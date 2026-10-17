export type LandmarkKind = "island" | "harbor" | "fossil" | "fortress" | "church" | "garden" | "temple" | "lake";

// Small original landmark illustrations; quiet enough to keep the map readable.
export function TourismLandmarkArt({ kind }: { kind: LandmarkKind }) {
  return <svg viewBox="0 0 64 58" fill="none" aria-hidden="true">
    <ellipse cx="32" cy="49" rx="27" ry="6" fill="#080f1c" opacity=".28"/>
    <path d="M5 44Q18 36 32 41T59 44L51 51H13Z" fill={kind === "island" || kind === "harbor" || kind === "lake" ? "#527b91" : "#658176"}/>
    {(kind === "island" || kind === "harbor") && <>
      <path d="M8 42Q17 27 28 35L37 43" fill="#a6b6a0"/><path d="M36 43L41 18H48L52 43Z" fill="#e9dfc3"/>
      <path d="M40 18H49V24H40Z" fill="#cb8a69"/><path d="M39 18L44.5 12L50 18Z" fill="#e1b976"/>
      <path d="M44 27V34M40 39H50" stroke="#667983" strokeWidth="2"/>
      <path d="M11 47H27M36 50H46" stroke="#abc8d1" strokeLinecap="round"/>
      {kind === "harbor" && <><path d="M14 32V44M15 33L26 40H15Z" fill="#f1ddb4" stroke="#dfc697"/><path d="M9 44H28L24 48H13Z" fill="#dbab79"/></>}
    </>}
    {kind === "fossil" && <>
      <path d="M11 43L16 31L29 25L43 28L53 43Z" fill="#a2a58c"/>
      <path d="M19 39Q21 28 31 32Q40 35 43 23L50 22L51 27L47 30L45 43H39L36 39L29 40L26 45H21L22 39L14 37" stroke="#e4c58d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="48" cy="25" r="1" fill="#263c46"/>
    </>}
    {kind === "fortress" && <>
      <path d="M10 42V27H18V23H25V27H39V23H46V27H54V43Z" fill="#aba995"/>
      <path d="M15 27V20H23V27M42 27V20H50V27" stroke="#d7cba9" strokeWidth="3"/>
      <path d="M25 43V36A7 7 0 0 1 39 36V43" fill="#233b44"/>
      <path d="M8 27L18 16H46L56 27Z" fill="#697e7b"/><path d="M17 18H47M9 27H55" stroke="#e3bf83" strokeWidth="2"/>
    </>}
    {kind === "church" && <>
      <path d="M17 43V29L32 17L47 29V43Z" fill="#d7b89c"/>
      <path d="M12 29L32 12L52 29" stroke="#758e8c" strokeWidth="5" strokeLinejoin="round"/>
      <path d="M27 44V35A5 5 0 0 1 37 35V44" fill="#314752"/>
      <path d="M32 8V18M28 12H36" stroke="#f0cd8e" strokeWidth="2.5"/>
      <path d="M20 31V36M44 31V36" stroke="#e9d9bc" strokeWidth="3"/>
    </>}
    {kind === "garden" && <>
      <path d="M13 43V28L32 18L51 28V43Z" fill="#a4c3b5" fillOpacity=".65" stroke="#d6e0c4" strokeWidth="1.5"/>
      <path d="M13 28H51M22 24V43M32 19V43M42 24V43" stroke="#dce5ce" strokeWidth="1.5"/>
      <path d="M25 42L28 33M37 42L34 32" stroke="#779379" strokeWidth="2"/>
      <circle cx="28" cy="32" r="4" fill="#e5bd84"/><circle cx="34" cy="31" r="4" fill="#c88b87"/>
    </>}
    {kind === "temple" && <>
      <path d="M16 43V29H48V43Z" fill="#ae8c70"/>
      <path d="M11 30Q21 24 21 20H43Q43 24 53 30Z" fill="#718c88"/>
      <path d="M19 21L25 14H39L45 21Z" fill="#536c6d"/>
      <path d="M10 30H54M18 21H46" stroke="#e6c58b" strokeWidth="2"/>
      <path d="M23 32V43M41 32V43" stroke="#d6b08a" strokeWidth="3"/>
      <path d="M28 43V34H36V43" fill="#2a4048"/>
    </>}
    {kind === "lake" && <>
      <path d="M9 44Q26 32 55 43" stroke="#9db4a2" strokeWidth="4"/>
      <path d="M13 36H52L46 39H19Z" fill="#dcc79f"/>
      <path d="M22 37V45M43 37V45" stroke="#b1b9a8" strokeWidth="2"/>
      <path d="M30 36V21M32 22L44 34H32Z" fill="#e4d7b8" stroke="#d6bf91"/>
      <path d="M12 48H28M33 51H50" stroke="#99bdc8" strokeLinecap="round"/>
    </>}
  </svg>;
}
