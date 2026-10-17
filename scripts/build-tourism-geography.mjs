// Preserve source WGS84 coordinates. Do not simplify, smooth, move, or scale
// individual features to match an illustrated guide.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { union, difference, bbox, area, centerOfMass, booleanPointInPolygon, pointOnFeature, polygon } from "@turf/turf";
const input = process.argv[2];
if (!input) throw new Error("Usage: node scripts/build-tourism-geography.mjs <HangJeongDong_ver20260701.geojson>");
const source = JSON.parse(readFileSync(input, "utf8"));
const towns = source.features.filter(f => f.properties?.adm_nm?.includes("화성시"));
if (!towns.length) throw new Error("No Hwaseong features found");
const insideLabel = feature => {
  const polygons = feature.geometry.type === "MultiPolygon" ? feature.geometry.coordinates : [feature.geometry.coordinates];
  const largest = polygons.map(coordinates => polygon(coordinates)).sort((a,b)=>area(b)-area(a))[0];
  const center = centerOfMass(largest);
  return (booleanPointInPolygon(center,largest) ? center : pointOnFeature(largest)).geometry.coordinates;
};
const townFeatures = towns.map(f=>({type:"Feature",properties:{kind:"town",name:f.properties.adm_nm.split(" ").at(-1),district:f.properties.sggnm.replace("화성시","")},geometry:f.geometry}));
const districtNames=[...new Set(townFeatures.map(f=>f.properties.district))];
const districtFeatures=districtNames.map(name=>{const features=townFeatures.filter(f=>f.properties.district===name);const shape=features.length===1?features[0]:union({type:"FeatureCollection",features});return {type:"Feature",properties:{kind:"district",name},geometry:shape.geometry};});
const merged=union({type:"FeatureCollection",features:townFeatures});
const city={type:"Feature",properties:{kind:"city",name:"화성시"},geometry:merged.geometry};
// Hide all neighboring basemap geography without changing Hwaseong itself.
const outside=difference({type:"FeatureCollection",features:[polygon([[[-180,-85],[180,-85],[180,85],[-180,85],[-180,-85]]]),city]});
outside.properties={kind:"outside",name:"화성시 외부"};
const output={type:"FeatureCollection",features:[city,...districtFeatures,...townFeatures,outside]};
const metadata={version:"2026-07-01",source:"https://github.com/vuski/admdongkor/blob/dd1881663fcabc69b81393604e91ebf3a4202e9a/ver20260701/HangJeongDong_ver20260701.geojson",license:"CC BY 4.0; underlying SGIS KOGL Type 1",coordinateSystem:"EPSG:4326",processing:"Town coordinates retained without modification; city/districts topological unions; label anchors inside largest polygon. No geometry simplification or illustration tracing.",bounds:bbox(city),labels:[...districtFeatures,...townFeatures].map(f=>({...f.properties,point:insideLabel(f)}))};
mkdirSync("client/public/maps",{recursive:true});
writeFileSync("client/public/maps/hwaseong-20260701.geojson",JSON.stringify(output));
writeFileSync("client/src/data/hwaseong-map-metadata.json",JSON.stringify(metadata,null,2)+"\n");
console.log({towns:towns.length,districts:districtFeatures.length,bounds:metadata.bounds,bytes:JSON.stringify(output).length});
