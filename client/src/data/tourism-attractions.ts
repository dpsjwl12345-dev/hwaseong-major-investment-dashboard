// Names and general areas: user-supplied tourmap_kor_20260707_S.pdf.
// Coordinates are approximate orientation points, NOT surveyed POI entrances.
// Keep this qualification visible; replace with official POI coordinates when available.
export const tourismAttractions: { name: string; point: [number, number]; category: "harbor" | "heritage" | "church" | "temple" | "garden" | "park" | "fossil" }[] = [
  { name: "전곡항", point: [126.650, 37.186], category: "harbor" },
  { name: "백미항", point: [126.688, 37.139], category: "harbor" },
  { name: "고정리 공룡알 화석산지", point: [126.763, 37.279], category: "fossil" },
  { name: "화성 당성", point: [126.735, 37.191], category: "heritage" },
  { name: "남양 성모성지", point: [126.816, 37.205], category: "church" },
  { name: "융건릉", point: [126.989, 37.212], category: "heritage" },
  { name: "용주사", point: [127.005, 37.213], category: "temple" },
  { name: "화성시 우리꽃식물원", point: [126.879, 37.077], category: "garden" },
  { name: "동탄 호수공원", point: [127.104, 37.158], category: "park" },
  { name: "매향리 평화생태공원", point: [126.746, 37.041], category: "park" },
];
