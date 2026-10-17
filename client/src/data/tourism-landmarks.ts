import type { LandmarkKind } from "../components/TourismLandmarkArt";

// Names/categories checked against the user-provided July 2026 tourism guide.
// Points use the supplied illustrated guide’s pixel layout (1800 × 1232),
// not GPS coordinates or verified entrances. Do not use for navigation.
export const tourismLandmarks: {name:string;kind:LandmarkKind;point:[number,number];category:string;description:string}[] = [
  {name:"화성 공룡알화석산지",kind:"fossil",point:[650,150],category:"자연·생태",description:"공룡알 화석과 갈대 풍경을 만나는 송산의 자연 명소"},
  {name:"화성 당성",kind:"fortress",point:[565,512],category:"역사·문화",description:"서해를 바라보는 화성의 역사 유적"},
  {name:"남양성모성지",kind:"church",point:[855,390],category:"역사·문화",description:"남양의 역사와 고요한 풍경을 만나는 공간"},
  {name:"융릉·건릉",kind:"temple",point:[1290,365],category:"역사·문화",description:"화성의 역사와 숲길을 함께 만나는 왕릉"},
  {name:"용주사",kind:"temple",point:[1368,340],category:"역사·문화",description:"효의 이야기가 깃든 화성의 사찰"},
  {name:"화성시 우리꽃 식물원",kind:"garden",point:[1040,760],category:"자연·생태",description:"우리 꽃과 식물을 만나는 팔탄의 생태 공간"},
  {name:"동탄호수공원",kind:"lake",point:[1630,570],category:"자연·생태",description:"호수와 산책길이 이어지는 동탄의 휴식 공간"},
];
