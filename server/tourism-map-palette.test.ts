import { describe,it,expect } from "vitest";
import {toneTourismMapPixels,TOURISM_MAP_SEA} from "../client/src/lib/tourismMapPalette";
describe("tourism navy map tiles",()=>{
  it("matches source water exactly to the outside mask so coastal reveal edges disappear",()=>{
    for(const water of [[170,211,223],[172,210,222],[181,215,230]]){
      const p=toneTourismMapPixels(new Uint8ClampedArray([...water,255]));
      expect(Array.from(p)).toEqual([20,35,50,255]);
    }
    expect(TOURISM_MAP_SEA).toBe("#142332");
  });
  it("keeps roads and labels legible against darker land",()=>{
    const p=toneTourismMapPixels(new Uint8ClampedArray([242,239,233,255,255,255,255,255,70,70,70,255]));
    expect(p[4]+p[5]+p[6]).toBeGreaterThan(p[0]+p[1]+p[2]);
    expect(p[8]+p[9]+p[10]).toBeGreaterThan(p[4]+p[5]+p[6]);
  });
  it("preserves transparency",()=>{expect(toneTourismMapPixels(new Uint8ClampedArray([170,211,223,87]))[3]).toBe(87);});
});
