export const TOURISM_MAP_SEA = "#142332";
export const TOURISM_MAP_LAND = "#293946";
const SEA = [20, 35, 50] as const;

// Recolor the existing source tile without changing geography. In particular,
// tile water and the outside mask must have exactly the same opaque color.
export function toneTourismMapPixels(pixels: Uint8ClampedArray) {
  for (let i=0;i<pixels.length;i+=4) {
    const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
    const water=r>120&&r<210&&g>165&&b>185&&g-r>8&&b-r>18;
    let color: readonly number[];
    if(water) color=SEA;
    else {
      const l=.2126*r+.7152*g+.0722*b;
      if(l>250) color=[78,96,110]; // white road surfaces
      else if(g-r>8&&g-b>6&&l>150) color=[36,62,57]; // parks and planted areas
      else {
        const ink=Math.max(0,Math.min(1,(242-l)/195));
        color=[41+ink*140,57+ink*137,70+ink*128];
      }
    }
    pixels[i]=color[0];pixels[i+1]=color[1];pixels[i+2]=color[2];
  }
  return pixels;
}
