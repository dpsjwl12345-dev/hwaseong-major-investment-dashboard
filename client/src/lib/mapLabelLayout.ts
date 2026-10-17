export type MapLabelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type MapLabelSide = "right" | "left" | "top" | "bottom";
export const mapLabelRectsOverlap = (
  a: MapLabelRect,
  b: MapLabelRect,
  gap = 0
) =>
  a.x < b.x + b.width + gap &&
  a.x + a.width + gap > b.x &&
  a.y < b.y + b.height + gap &&
  a.y + a.height + gap > b.y;

// Move the label around its fixed geographic anchor; never move the anchor.
export function placeMapLabel(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  viewport: { width: number; height: number },
  occupied: MapLabelRect[],
  preferred?: MapLabelSide,
  distances: readonly number[] = [23]
): { side: MapLabelSide; rect: MapLabelRect; distance: number } | null {
  for (const distance of distances) {
    const candidates: { side: MapLabelSide; x: number; y: number }[] = [
      { side: "right", x: anchor.x + distance, y: anchor.y - size.height / 2 },
      {
        side: "left",
        x: anchor.x - distance - size.width,
        y: anchor.y - size.height / 2,
      },
      {
        side: "top",
        x: anchor.x - size.width / 2,
        y: anchor.y - distance - size.height,
      },
      { side: "bottom", x: anchor.x - size.width / 2, y: anchor.y + distance },
    ];
    if (preferred)
      candidates.sort(
        (a, b) => Number(b.side === preferred) - Number(a.side === preferred)
      );
    for (const candidate of candidates) {
      const rect = { x: candidate.x, y: candidate.y, ...size };
      if (
        rect.x < 10 ||
        rect.y < 10 ||
        rect.x + rect.width > viewport.width - 10 ||
        rect.y + rect.height > viewport.height - 10
      )
        continue;
      if (!occupied.some(obstacle => mapLabelRectsOverlap(rect, obstacle, 4)))
        return { side: candidate.side, rect, distance };
    }
  }
  return null;
}
