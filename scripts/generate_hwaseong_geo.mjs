// Single source of truth for every piece of geo data the "주요 투자사업 분포도"
// screen needs, all derived from ONE dataset (vuski/admdongkor's 행정동
// boundaries, WGS84) so the outer city shape, the internal 읍면동 divider
// lines, and the dong centroids all share exactly the same projection —
// nothing can drift out of alignment between them.
//
// Source data: https://github.com/vuski/admdongkor (공개 행정동 경계, WGS84)
// No project/address data is read or sent anywhere by this script.
//
// Usage:
//   node scripts/generate_hwaseong_geo.mjs <path-to-HangJeongDong-geojson>
import { readFileSync, writeFileSync } from "node:fs";
import { geoMercator, geoPath, geoCentroid } from "d3-geo";
import { union, rewind, bbox } from "@turf/turf";

// vuski/admdongkor's polygon for 새솔동 (송산그린시티, split off from 송산면/
// 마도면 in 2022 — one of the newest dongs in the dataset) sits far north of
// where 새솔동 actually is, pulling its geoCentroid up near the top of the
// whole city instead of the western coastal area. Manually pin it near its
// parent dongs (송산면/마도면) until an updated source fixes the geometry.
const CENTROID_OVERRIDES = {
  새솔동: [126.79, 37.185],
};

// Named coastal/island landmarks that show up in several 서해안 project
// addresses (궁평항, 국화도, 제부도 등) are 리-level place names — finer than
// the 읍면동 centroids above, so those projects were landing mid-inland at
// their whole township's center instead of on the coast.
//
// Two things that didn't work: (1) 제부도's real-world coordinate (Wikipedia)
// projects onto a gap in our simplified outline — the causeway/island isn't
// traced, so the marker floats in blank "sea"; (2) the raw westmost polygon
// vertex sits exactly on the map's edge and gets clipped by the glow filter.
// So instead: take the westmost vertex of the real township polygon — 제부도
// and 궁평항 use opposite halves (north/south) of 서신면's coastline so they
// don't stack on the same point — then blend it partway back toward the
// township's centroid, which keeps it safely inside the drawn landmass while
// still reading as "toward the coast" rather than dead-center.
const COASTAL_POINTS = {
  제부도: { westmostOf: "서신면", half: "north", inset: 0.3 },
  궁평항: { westmostOf: "서신면", half: "south", inset: 0.3 },
  국화도: { westmostOf: "우정읍", half: null, inset: 0.45 },
};

const sourcePath = process.argv[2];
if (!sourcePath) {
  console.error("Usage: node scripts/generate_hwaseong_geo.mjs <HangJeongDong-geojson-path>");
  process.exit(1);
}

const source = JSON.parse(readFileSync(sourcePath, "utf-8"));
const dongFeatures = source.features.filter((f) => f.properties?.adm_nm?.includes("화성시"));
if (dongFeatures.length === 0) {
  console.error("No 화성시 features found in source file");
  process.exit(1);
}

// Union every dong polygon into the outer city outline. Doing this from the
// current 행정동 dataset (rather than an older 시군구-level file) means any
// land reclamation already assigned to a dong is included automatically.
// turf.union() normalizes ring winding to the GeoJSON RFC7946 convention
// (exterior rings CCW), but d3-geo expects the opposite (exterior CW, the
// convention the raw source data already uses) — without un-reversing it
// here, d3-geo can't tell inside from outside and fills the whole viewport.
const cityOutline = rewind(union({ type: "FeatureCollection", features: dongFeatures }), { reverse: true });

// Fit once to find the shape's natural aspect ratio, then refit to a box with
// that exact aspect so the polygon touches all four edges with no letterboxing.
const probe = geoMercator().fitSize([1000, 1000], cityOutline);
const [[x0, y0], [x1, y1]] = geoPath(probe).bounds(cityOutline);
const aspect = (x1 - x0) / (y1 - y0);
const WIDTH = 1000;
const HEIGHT = Math.round(WIDTH / aspect);

const projection = geoMercator().fitSize([WIDTH, HEIGHT], cityOutline);
const path = geoPath(projection);

writeFileSync(
  new URL("../client/src/data/hwaseong-boundary.json", import.meta.url),
  JSON.stringify(
    {
      width: WIDTH,
      height: HEIGHT,
      d: path(cityOutline.geometry),
      scale: projection.scale(),
      translate: projection.translate(),
      center: projection.center(),
    },
    null,
    2,
  ) + "\n",
);

// Per-dong outline (for internal 읍면동 divider lines) and centroid (for
// plotting projects by district), both in the exact same coordinate space
// as the city outline above.
const centroids = {};
const dongOutlines = {};
for (const feature of dongFeatures) {
  // adm_nm looks like "경기도 화성시효행구 봉담읍" — keep just the 읍/면/동 name.
  const dongName = feature.properties.adm_nm.split(" ").pop();
  const [lon, lat] = CENTROID_OVERRIDES[dongName] ?? geoCentroid(feature);
  const projected = projection([lon, lat]);
  if (projected) {
    centroids[dongName] = {
      x: Number(((projected[0] / WIDTH) * 100).toFixed(2)),
      y: Number(((projected[1] / HEIGHT) * 100).toFixed(2)),
    };
  }
  dongOutlines[dongName] = path(feature.geometry);
}

writeFileSync(
  new URL("../client/src/data/hwaseong-dong-centroids.json", import.meta.url),
  JSON.stringify(centroids, null, 2) + "\n",
);
writeFileSync(
  new URL("../client/src/data/hwaseong-dong-outlines.json", import.meta.url),
  JSON.stringify(dongOutlines, null, 2) + "\n",
);

// Shoelace formula — good enough at this scale just to rank ring sizes.
const ringArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return Math.abs(sum / 2);
};

const coastalPoints = {};
for (const [name, { westmostOf: dongName, half, inset }] of Object.entries(COASTAL_POINTS)) {
  const feature = dongFeatures.find((f) => f.properties.adm_nm.split(" ").pop() === dongName);
  if (!feature) continue;
  const polys = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];
  // These townships include several tiny offshore islet rings alongside the
  // real mainland body (e.g. 서신면 has 4 separate rings, 3 of them under
  // 60 points) — searching "westmost point" across every ring can land on a
  // speck of an islet too small to render visibly, which is exactly what
  // made the marker look like it was floating in open water. Stick to the
  // largest (mainland) ring only.
  const mainRing = polys.map((poly) => poly[0]).sort((a, b) => ringArea(b) - ringArea(a))[0];
  const lats = mainRing.map((p) => p[1]);
  const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const candidates = half === "north" ? mainRing.filter((p) => p[1] >= midLat) : half === "south" ? mainRing.filter((p) => p[1] < midLat) : mainRing;
  let westmost = null;
  for (const p of candidates) if (!westmost || p[0] < westmost[0]) westmost = p;
  if (!westmost) continue;
  const centroid = geoCentroid(feature);
  const lonlat = [westmost[0] + (centroid[0] - westmost[0]) * inset, westmost[1] + (centroid[1] - westmost[1]) * inset];
  const projected = projection(lonlat);
  if (!projected) continue;
  coastalPoints[name] = {
    x: Number(((projected[0] / WIDTH) * 100).toFixed(2)),
    y: Number(((projected[1] / HEIGHT) * 100).toFixed(2)),
  };
}
writeFileSync(
  new URL("../client/src/data/hwaseong-coastal-points.json", import.meta.url),
  JSON.stringify(coastalPoints, null, 2) + "\n",
);

// 화성특례시's 4 general districts (효행구/봉담·매송·비봉·정남/우정 등을 아우름
// — sggnm already groups dongs into these). Union each group's dongs into one
// outline plus a label anchor point, same coordinate space as everything else.
const guGroups = new Map();
for (const feature of dongFeatures) {
  // sggnm looks like "화성시효행구" — strip the city name to get "효행구".
  const guName = feature.properties.sggnm.replace("화성시", "");
  if (!guGroups.has(guName)) guGroups.set(guName, []);
  guGroups.get(guName).push(feature);
}

const guOutlines = {};
for (const [guName, features] of guGroups) {
  const guUnion =
    features.length > 1
      ? rewind(union({ type: "FeatureCollection", features }), { reverse: true })
      : features[0];
  // Anchor the label near the TOP of the district's bounding box (centered
  // horizontally) rather than its area centroid — the centroid tends to sit
  // right where project markers cluster, so the label ends up covering them.
  const [minLon, minLat, maxLon, maxLat] = bbox(guUnion);
  const lon = (minLon + maxLon) / 2;
  const lat = maxLat - (maxLat - minLat) * 0.08;
  const projected = projection([lon, lat]);
  guOutlines[guName] = {
    d: path(guUnion.geometry),
    labelX: projected ? Number(((projected[0] / WIDTH) * 100).toFixed(2)) : 50,
    labelY: projected ? Number(((projected[1] / HEIGHT) * 100).toFixed(2)) : 50,
  };
}

writeFileSync(
  new URL("../client/src/data/hwaseong-gu-outlines.json", import.meta.url),
  JSON.stringify(guOutlines, null, 2) + "\n",
);

console.log(`City outline: viewBox 0 0 ${WIDTH} ${HEIGHT} (aspect ${aspect.toFixed(3)})`);
console.log(`Wrote ${Object.keys(centroids).length} dong centroids, ${Object.keys(dongOutlines).length} dong outlines, ${Object.keys(guOutlines).length} gu outlines (${[...guGroups.keys()].join(", ")})`);
