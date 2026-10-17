// Representative project-area points read from registered project location maps.
// Approximate map readings, not surveyed entrances or parcel centroids.
// Never use the legacy coastal-lonlat file: its island names are reversed.
import type { TourismObjectKind } from "../components/TourismSiteObject";
export const tourismProjectSites: { kind: TourismObjectKind; key: string; projectSuffix: string; label: string; point: [number, number]; source: string }[] = [
  {kind:"marina",key:"marina-guk",projectSuffix:"Sheet1:1",label:"국화도 계류시설",point:[126.559,37.063],source:"사업개요: 국화도 / 관광안내도"},
  {kind:"marina",key:"marina-ip",projectSuffix:"Sheet1:1",label:"입파도 계류시설",point:[126.540,37.108],source:"사업개요: 입파도 / 관광안내도"},
  {kind:"rest",key:"jebudo-rest",projectSuffix:"Sheet1:2",label:"제부도 관광휴게시설",point:[126.620,37.156],source:"사업개요: 제부리 관광휴게시설·매바위"},
  {kind:"trail",key:"gold-coast",projectSuffix:"Sheet1:3",label:"황금해안길",point:[126.674,37.145],source:"/renderings/tourism-3/1.webp · 전곡항~궁평항 노선 대표구간"},
  {kind:"park",key:"goryeom",projectSuffix:"Sheet1:4",label:"고렴산 해상공원",point:[126.657,37.163],source:"/renderings/tourism-4/1.png · 송교리 해상공원 사업구역"},
  {kind:"deck",key:"guk-deck",projectSuffix:"Sheet1:5",label:"국화도 해안데크",point:[126.555,37.062],source:"/renderings/tourism-12/1.png · 서측 해안 정비구간"},
  {kind:"parking",key:"songgyo-parking",projectSuffix:"Sheet1:7",label:"송교리 주차장·도로",point:[126.663,37.154],source:"/renderings/tourism-8/1.png · P2/P3 대표구역"},
  {kind:"parking",key:"gung-parking",projectSuffix:"Sheet1:7",label:"궁평주차장",point:[126.689,37.123],source:"/renderings/tourism-8/1.png · P4"},
  {kind:"parking",key:"west-parking",projectSuffix:"Sheet1:7",label:"서해안 관광지 주차장",point:[126.661,37.168],source:"/renderings/tourism-8/1.png · P1"},
  {kind:"tourism",key:"gung-tourism",projectSuffix:"Sheet1:8",label:"궁평 종합관광지",point:[126.685,37.117],source:"/renderings/tourism-6/1.png · 궁평리 관광지 사업구역"},
  {kind:"road",key:"jebudo-roads",projectSuffix:"Sheet1:10",label:"제부도 도시계획도로",point:[126.625,37.176],source:"/renderings/tourism-10/1.png · 북측 중로 대표구간"},
  {kind:"train",key:"jebudo-train",projectSuffix:"tourism-jebudo-trackless-train",label:"무궤도 관광순환열차",point:[126.622,37.177],source:"/renderings/tourism-jebudo-train/garage-location.png · 북측 차고지 계획구역"},
];
