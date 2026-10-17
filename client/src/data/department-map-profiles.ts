import { Amphora, BookOpen, Building2, Dumbbell, Flag, Landmark, Medal, Palette, Theater, Trophy, Volleyball } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LandmarkCategory } from "../components/TourismLandmarkIcon";
import type { TourismObjectKind } from "../components/TourismSiteObject";
import metadata from "./hwaseong-map-metadata.json";

type Profile = { english:string; words:string[]; accent:string; icon:LucideIcon; kind:TourismObjectKind; landmarks:LandmarkCategory[] };
export const departmentMapProfiles:Record<string,Profile> = {
  "관광진흥과":{english:"TOURISM DEPARTMENT",words:["바다를 잇고,","화성을 누리다"],accent:"#d6b579",icon:Landmark,kind:"tourism",landmarks:["harbor","heritage","church","temple","garden","park","fossil"]},
  "문화예술과":{english:"ARTS & CULTURE",words:["일상에 문화를,","도시에 예술을"],accent:"#b7a6d6",icon:Palette,kind:"culture",landmarks:["fossil"]},
  "문화유산과":{english:"CULTURAL HERITAGE",words:["역사를 보존하고,","내일로 이어가다"],accent:"#c5ad89",icon:Amphora,kind:"heritage",landmarks:["heritage","temple"]},
  "독립기념관":{english:"INDEPENDENCE & MEMORY",words:["독립의 기억을,","시민의 공간으로"],accent:"#a5bba6",icon:Flag,kind:"memorial",landmarks:[]},
  "도서관정책과":{english:"LIBRARIES & READING",words:["책으로 연결되는,","우리의 일상"],accent:"#b5b997",icon:BookOpen,kind:"library",landmarks:[]},
  "체육진흥과":{english:"SPORTS & EVERYDAY LIFE",words:["가까운 체육시설,","활기 있는 일상"],accent:"#8fbfbc",icon:Dumbbell,kind:"sports",landmarks:[]},
  "전국체전추진단":{english:"NATIONAL SPORTS FESTIVAL",words:["경기장을 준비하고,","도약을 이어가다"],accent:"#a9b9d6",icon:Medal,kind:"stadium",landmarks:[]},
};
export const profileForDepartment=(department:string)=>departmentMapProfiles[department]??{english:"MAJOR INVESTMENT PROJECTS",words:["화성시","주요투자사업"],accent:"#d6b579",icon:Building2,kind:"culture" as const,landmarks:[]};
export function departmentProjectIcon(name:string,department:string):LucideIcon {
  if(/도서관|독서/.test(name))return BookOpen;
  if(/공연|아트홀|예술의전당/.test(name))return Theater;
  if(/야구|테니스|축구|골프|체육시설/.test(name))return Volleyball;
  if(/경기장|돔구장|체육대회/.test(name))return Trophy;
  return profileForDepartment(department).icon;
}
// Administrative label anchors from the unchanged 2026-07-01 SGIS boundary.
// These locate an AREA, never a parcel, entrance, or actual project building.
export function projectAreaPoints(project:{overview?:string;district?:string}) {
  const address=project.overview?.split(/\n/).find(line=>/사업\s*위치/.test(line));
  if(address&&/미정|입지 선정/.test(address))return [];
  const names=metadata.labels.filter(label=>label.kind==="town");
  const addressMatches=address?names.filter(label=>address.includes(label.name)):[];
  const matches=addressMatches.length?addressMatches:names.filter(label=>(project.district??"").split(/[,·\s]+/).includes(label.name));
  return matches.map(label=>({area:label.name,point:label.point as [number,number]}));
}
