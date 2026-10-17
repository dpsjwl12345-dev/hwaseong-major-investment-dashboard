import type { ReactNode } from "react";
export type LandmarkCategory = "harbor" | "heritage" | "church" | "temple" | "garden" | "park" | "fossil";

const symbols: Record<LandmarkCategory, ReactNode> = {
  harbor: <><path fillRule="evenodd" d="M16 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2.7a2.3 2.3 0 1 1 0 4.6 2.3 2.3 0 0 1 0-4.6Z"/><path d="M14.5 10h3v4h5v2.6h-5v10c4.2-.7 7-3 7.7-6.5H22l4.7-5 3.3 6h-2.2C26.7 27 22.3 30 16 31 9.7 30 5.3 27 4.2 21.1H2l3.3-6 4.7 5H6.8c.7 3.5 3.5 5.8 7.7 6.5v-10h-5V14h5Z"/></>,
  heritage: <><path d="m3 11 13-8 13 8v2H3Z"/><rect x="4" y="26" width="24" height="3" rx=".8"/><rect x="6" y="23" width="20" height="2"/><rect x="7" y="15" width="4" height="8" rx=".5"/><rect x="14" y="15" width="4" height="8" rx=".5"/><rect x="21" y="15" width="4" height="8" rx=".5"/></>,
  church: <><path d="M15 2h2v3h3v2h-3v4h-2V7h-3V5h3Z"/><path fillRule="evenodd" d="m4 17 12-9 12 9v12H4Zm9 12h6v-7a3 3 0 0 0-6 0Zm-5-9h3v-3H8Zm13 0h3v-3h-3Z"/></>,
  temple: <><path d="M6 8c3 2 6 0 10-4 4 4 7 6 10 4l-2 5H8Z"/><path d="M2 16c5 2 9 0 14-5 5 5 9 7 14 5l-2 5H4Z"/><rect x="6" y="27" width="20" height="2.5" rx=".5"/><rect x="7" y="22" width="3" height="5"/><rect x="14.5" y="22" width="3" height="5"/><rect x="22" y="22" width="3" height="5"/></>,
  garden: <><path d="M15 17h2v13h-2Z"/><path d="M15 26C7 28 4 24 4 20c6-1 10 1 11 6ZM17 28c7 0 11-4 11-8-6 0-10 2-11 8Z"/>{[0,60,120,180,240,300].map(a=><ellipse key={a} cx="16" cy="7" rx="3.2" ry="5" transform={`rotate(${a} 16 12)`}/>)}<circle cx="16" cy="12" r="3.3"/></>,
  park: <><path d="M9 3 2 13h3l-4 7h6v8h4v-8h6l-4-7h3Z"/><path d="m23 5-6 9h3l-4 8h5v6h4v-6h6l-5-8h3Z"/><rect x="3" y="28" width="26" height="2" rx="1"/></>,
  fossil: <><path d="M5 27C1 20 3 10 10 5c7-5 17-1 19 8 2 7-3 14-10 15-5 1-10-2-11-7-1-4 2-9 6-10 4-1 8 1 9 5 1 3-1 6-4 7-2 1-5-1-5-3 0-1 1-3 3-3 1 0 2 1 2 2h-2c0 1 1 1 2 0 1-2-1-4-3-3-3 1-4 4-2 6 3 4 9 1 10-3 2-6-3-11-9-10C8 10 5 17 8 23l5 6-8 1Z"/></>,
};

// Only the landmark silhouette is shaded. The SVG canvas and button have no
// background plate, so the map stays visible around and through each symbol.
export default function TourismLandmarkIcon({ category, idPrefix }: { category: LandmarkCategory; idPrefix: string }) {
  const face=`${idPrefix}-face`,edge=`${idPrefix}-edge`;
  return <svg viewBox="0 0 32 34" width="28" height="30" fill="none" aria-hidden="true" focusable="false" className="tdb-landmark-symbol">
    <defs>
      <linearGradient id={face} x1="5" y1="1" x2="27" y2="30" gradientUnits="userSpaceOnUse"><stop stopColor="#f5e5c6"/><stop offset=".35" stopColor="#d4af74"/><stop offset=".72" stopColor="#b58a4d"/><stop offset="1" stopColor="#886136"/></linearGradient>
      <linearGradient id={edge} x1="3" y1="5" x2="28" y2="32" gradientUnits="userSpaceOnUse"><stop stopColor="#775735"/><stop offset="1" stopColor="#493928"/></linearGradient>
    </defs>
    <g transform="translate(0 1.7)" fill={`url(#${edge})`} stroke="#382d23" strokeWidth=".65" strokeLinejoin="round">{symbols[category]}</g>
    <g fill={`url(#${face})`} stroke="#f5dfb7" strokeOpacity=".45" strokeWidth=".45" strokeLinejoin="round">{symbols[category]}</g>
  </svg>;
}
