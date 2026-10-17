import { describe, expect, it } from "vitest";
import {
  placeMapLabel,
  mapLabelRectsOverlap,
} from "../client/src/lib/mapLabelLayout";

describe("map labels around fixed geographic points", () => {
  const viewport = { width: 220, height: 160 };
  const size = { width: 50, height: 20 };
  it("chooses another side when a control or label occupies the right", () => {
    const obstacle = { x: 120, y: 55, width: 70, height: 50 };
    const result = placeMapLabel({ x: 100, y: 80 }, size, viewport, [obstacle]);
    expect(result?.side).toBe("left");
    expect(mapLabelRectsOverlap(result!.rect, obstacle, 4)).toBe(false);
  });
  it("keeps text inside the map near its right edge", () => {
    const result = placeMapLabel({ x: 195, y: 80 }, size, viewport, []);
    expect(result?.side).toBe("left");
    expect(result!.rect.x + result!.rect.width).toBeLessThanOrEqual(
      viewport.width - 10
    );
  });
  it("collapses the name instead of obscuring a map filled with obstacles", () => {
    expect(
      placeMapLabel({ x: 100, y: 80 }, size, viewport, [
        { x: 0, y: 0, ...viewport },
      ])
    ).toBeNull();
  });
  it("does not move the real point when placing consecutive labels", () => {
    const anchor = { x: 100, y: 80 };
    const first = placeMapLabel(anchor, size, viewport, [])!;
    const second = placeMapLabel(anchor, size, viewport, [first.rect])!;
    expect(anchor).toEqual({ x: 100, y: 80 });
    expect(mapLabelRectsOverlap(first.rect, second.rect, 4)).toBe(false);
  });
  it("can give a selected name a callout while retaining its point", () => {
    const result = placeMapLabel(
      { x: 100, y: 80 },
      size,
      viewport,
      [{ x: 70, y: 50, width: 60, height: 60 }],
      undefined,
      [23, 45, 67, 89]
    );
    expect(result?.distance).toBe(45);
    expect(result?.side).toBe("right");
  });
  it("retains an already valid side to prevent hover-induced jumping", () => {
    expect(
      placeMapLabel({ x: 100, y: 80 }, size, viewport, [], "left")?.side
    ).toBe("left");
  });
});
