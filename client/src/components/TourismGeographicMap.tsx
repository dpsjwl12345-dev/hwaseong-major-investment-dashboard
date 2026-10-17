import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import geography from "../data/hwaseong-map-metadata.json";

export const TOURISM_REGIONS = ["제부도", "궁평항", "국화도", "입파도"] as const;
export type TourismRegion = typeof TOURISM_REGIONS[number];
// Named islands use their original WGS84 polygon centers, identified by the
// guide's island names and north/south locations, not by ranking and guessing.
// 궁평항 is a representative harbor point, not a surveyed project parcel.
const CENTERS: Record<TourismRegion, [number, number]> = {
  제부도: [126.61996914392513, 37.16794090190677],
  궁평항: [126.683, 37.116],
  국화도: [126.55692916127481, 37.06210373671743],
  입파도: [126.53922474495708, 37.10764374760446],
};
const cityBounds = new maplibregl.LngLatBounds(
  [geography.bounds[0], geography.bounds[1]],
  [geography.bounds[2], geography.bounds[3]],
);
export type TourismMapHandle = {
  reset: () => void;
  zoom: (direction: number) => void;
  focus: (regions: TourismRegion[]) => void;
};
type Props = {
  counts: Record<TourismRegion, number>;
  highlights: TourismRegion[];
  onSelect: (region: TourismRegion) => void;
};
const GEOGRAPHY_URL = "/maps/hwaseong-20260701.geojson";
const BOUNDARY_ATTRIBUTION = '<a href="https://sgis.kostat.go.kr" target="_blank" rel="noopener noreferrer">SGIS</a> · <a href="https://github.com/vuski/admdongkor" target="_blank" rel="noopener noreferrer">admdongkor</a> (CC BY 4.0)';
// OpenStreetMap Standard tiles require no account or API key.
const tiles = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];

const TourismGeographicMap = forwardRef<TourismMapHandle, Props>(function TourismGeographicMap({ counts, highlights, onSelect }, ref) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ region: TourismRegion; button: HTMLButtonElement; marker: maplibregl.Marker }[]>([]);
  const overview = useRef(true);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable" | "error">("loading");
  const duration = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 450;
  useImperativeHandle(ref, () => ({
    reset() { overview.current = true; map.current?.fitBounds(cityBounds, { padding: { top: 55, right: 55, bottom: 55, left: 75 }, duration: duration() }); },
    zoom(direction) { overview.current = false; const instance = map.current; if (instance) instance.easeTo({ zoom: instance.getZoom() + direction, duration: duration() ? 200 : 0 }); },
    focus(regions) {
      if (!regions.length) return;
      overview.current = false;
      const bounds = new maplibregl.LngLatBounds();
      regions.forEach(region => bounds.extend(CENTERS[region]));
      map.current?.fitBounds(bounds, { padding: 100, maxZoom: 12.5, duration: duration() });
    },
  }), []);

  useEffect(() => {
    if (!container.current) return;
    let disposed = false;
    let rasterReady = false;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        center: [126.84, 37.15], zoom: 10, minZoom: 5, maxZoom: 17,
        dragPan: true, dragRotate: false, touchPitch: false, renderWorldCopies: false,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            geography: { type: "geojson", data: GEOGRAPHY_URL, attribution: BOUNDARY_ATTRIBUTION },
            basemap: { type: "raster", tiles, tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>' },
          },
          layers: [
            { id: "water", type: "background", paint: { "background-color": "#c9d7d8" } },
            // Locally available real-coordinate context remains if raster tiles
            // are unavailable. It does not masquerade as a complete road map.
            { id: "land-context", type: "fill", source: "geography", filter: ["==", ["get", "kind"], "city"], paint: { "fill-color": "#edece4" } },
            { id: "basemap", type: "raster", source: "basemap", paint: { "raster-fade-duration": 150, "raster-saturation": -.1 } },
            // An opaque geographic mask keeps adjacent cities, roads and labels
            // out of the dashboard, without cropping or deforming city geometry.
            { id: "outside-city", type: "fill", source: "geography", filter: ["==", ["get", "kind"], "outside"], paint: { "fill-color": "#c9d7d8", "fill-opacity": 1 } },
            { id: "town-boundaries", type: "line", source: "geography", filter: ["==", ["get", "kind"], "town"], paint: { "line-color": "#8b9c96", "line-width": .65, "line-opacity": .32 } },
            { id: "district-boundaries", type: "line", source: "geography", filter: ["==", ["get", "kind"], "district"], paint: { "line-color": "#6d8383", "line-width": 1.15, "line-opacity": .65, "line-dasharray": [4, 3] } },
            { id: "city-boundary", type: "line", source: "geography", filter: ["==", ["get", "kind"], "city"], paint: { "line-color": "#718b88", "line-width": 1.1, "line-opacity": .5 } },
          ],
        },
      });
    } catch { setStatus("error"); return; }
    map.current = instance;
    instance.fitBounds(cityBounds, { padding: { top: 55, right: 55, bottom: 55, left: 75 }, duration: 0 });
    instance.on("movestart", event => { if (event.originalEvent) overview.current = false; });
    instance.on("sourcedata", event => {
      if (event.sourceId === "basemap" && event.tile?.state === "loaded" && !disposed) {
        rasterReady = true;
        setStatus("ready");
      }
    });
    instance.on("error", event => {
      if (disposed) return;
      if ((event as { sourceId?: string }).sourceId === "geography") setStatus("error");
      else if (!rasterReady) setStatus("unavailable");
    });
    const labels: { element: HTMLElement; marker: maplibregl.Marker; district: boolean }[] = [];
    for (const label of geography.labels) {
      const element = document.createElement("span");
      element.className = label.kind === "district" ? "tdb-gu-label" : "tdb-town-label";
      element.textContent = label.name;
      const marker = new maplibregl.Marker({ element }).setLngLat(label.point as [number, number]).addTo(instance);
      element.setAttribute("aria-hidden", "true");
      labels.push({ element, marker, district: label.kind === "district" });
    }
    // Hide colliding minor labels instead of moving them away from their real
    // positions. Districts and all project markers retain their coordinates.
    const layoutLabels = () => {
      const occupied: { x: number; y: number; w: number; h: number }[] = [];
      for (const label of labels) {
        const point = instance.project(label.marker.getLngLat());
        const candidate = { x: point.x - 25, y: point.y - 9, w: 50, h: 18 };
        const allowed = label.district || (instance.getZoom() > 10 && !occupied.some(r => Math.abs(r.x - candidate.x) < (r.w + candidate.w) / 2 + 8 && Math.abs(r.y - candidate.y) < 24));
        label.element.style.visibility = allowed ? "visible" : "hidden";
        if (allowed) occupied.push(candidate);
      }
    };
    instance.on("moveend", () => {
      layoutLabels();
      const center=instance.getCenter();
      const lng=Math.max(cityBounds.getWest(),Math.min(cityBounds.getEast(),center.lng));
      const lat=Math.max(cityBounds.getSouth(),Math.min(cityBounds.getNorth(),center.lat));
      if(Math.abs(center.lng-lng)>1e-7||Math.abs(center.lat-lat)>1e-7)instance.panTo([lng,lat],{duration:duration()?200:0});
    });
    instance.on("load", layoutLabels);
    layoutLabels();
    for (const region of TOURISM_REGIONS) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "tdb-geographic-marker";
      const count = document.createElement("b"); count.textContent = String(counts[region]);
      const label = document.createElement("span"); label.textContent = region;
      button.append(count, label);
      button.onclick = () => callback.current(region);
      const marker = new maplibregl.Marker({ element: button, anchor: "left" }).setLngLat(CENTERS[region]).addTo(instance);
      button.setAttribute("aria-label", `${region} 권역 사업 보기`);
      markers.current.push({ region, button, marker });
    }
    const resize = new ResizeObserver(() => {
      instance.resize();
      // Flex/grid layout can resize the canvas after initialization. Keep the
      // entire city inside the final viewport until the user pans or zooms.
      if (overview.current) instance.fitBounds(cityBounds, { padding: { top: 55, right: 55, bottom: 55, left: 75 }, duration: 0 });
      layoutLabels();
    });
    resize.observe(container.current);
    const timeout = window.setTimeout(() => { if (!disposed && !rasterReady) setStatus("unavailable"); }, 10000);
    return () => {
      disposed = true; clearTimeout(timeout); resize.disconnect();
      labels.forEach(label => label.marker.remove());
      markers.current.forEach(marker => marker.marker.remove()); markers.current = [];
      instance.remove(); map.current = null;
    };
  }, []);
  useEffect(() => {
    markers.current.forEach(({ region, button }) => {
      button.classList.toggle("is-active", highlights.includes(region));
      button.setAttribute("aria-pressed", String(highlights.includes(region)));
      button.querySelector("b")!.textContent = String(counts[region]);
    });
  }, [counts, highlights]);
  return <>
    <div ref={container} className="tdb-geographic-canvas" aria-label="실제 지형과 행정경계에 기반한 화성시 관광사업 지도" />
    <div className="tdb-map-key"><span>화성시</span><span><b />투자사업 권역</span></div>
    {status === "unavailable" && <div className="tdb-map-network-note">배경지도 연결 지연 · 실제 행정경계 표시 중</div>}
    {status === "error" && <div className="tdb-geographic-status">지도를 불러오지 못했습니다.</div>}
  </>;
});
export default TourismGeographicMap;
