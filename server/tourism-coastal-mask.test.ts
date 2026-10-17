import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { booleanPointInPolygon, type FeatureCollection, type Polygon, type MultiPolygon, type Feature } from "@turf/turf";
const geography=JSON.parse(readFileSync("client/public/maps/hwaseong-20260701.geojson","utf8")) as FeatureCollection<Polygon|MultiPolygon>;
const feature=(kind:string)=>geography.features.find(f=>f.properties?.kind===kind) as Feature<Polygon|MultiPolygon>;
describe("Hwaong coastal basemap visibility",()=>{
  it("does not obscure the reclaimed coastal context with the old administrative mask",()=>{
    expect(booleanPointInPolygon([126.74,37.10],feature("outside"))).toBe(false);
    expect(booleanPointInPolygon([126.76,37.12],feature("outside"))).toBe(false);
  });
  it("does not invent land cover: water and farmland both come from the basemap",()=>{
    expect(booleanPointInPolygon([126.74,37.10],feature("city"))).toBe(false);
    expect(geography.features.some(f=>f.properties?.kind==="reclaimed-land")).toBe(false);
  });
  it("keeps neighboring cities covered",()=>{
    expect(booleanPointInPolygon([127.03,37.28],feature("outside"))).toBe(true);
    expect(booleanPointInPolygon([126.60,37.25],feature("outside"))).toBe(true);
  });
});
