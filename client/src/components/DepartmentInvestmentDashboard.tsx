import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Anchor, ArrowUpRight, Footprints, Layers3, LocateFixed, MapPin, Minus, ParkingCircle, Plus, Route, Search, TrainFront, Trees, Wallet, X } from "lucide-react";
import { deriveProjectBudget } from "../lib/projectBudget";
import TourismGeographicMap, { TOURISM_REGIONS, type TourismRegion, type TourismMapHandle } from "./TourismGeographicMap";
import { tourismProjectSites } from "../data/tourism-project-sites";
import type { TourismMapSite } from "./TourismProjectMarkers";
import { ContainerTextFlip } from "./ui/container-text-flip";
import { departmentProjectIcon, profileForDepartment, projectAreaPoints } from "../data/department-map-profiles";
import "./TourismDepartmentDashboard.css";

type BudgetSource = Parameters<typeof deriveProjectBudget>[0];
export type TourismProject = BudgetSource & {
  id: string; department: string; project_name: string; current_stage?: string; progress_rate?: number | null;
  overview?: string; district?: string;
  rendering_images?: string[]; rendering_image_types?: string[];
  sub_projects?: (BudgetSource & { name: string })[];
};
type Region = TourismRegion;

const regionsFor = (name: string): Region[] => /계류시설/.test(name) ? ["국화도","입파도"] : /주차장 및 도로/.test(name) ? ["제부도","궁평항"] : /국화도/.test(name) ? ["국화도"] : /궁평|황금해안길/.test(name) ? ["궁평항"] : ["제부도"];
const regionLabel = (region: Region) => region === "궁평항" ? "궁평 권역" : region === "제부도" ? "제부 권역" : region;
const iconFor = (name: string) => /열차/.test(name) ? TrainFront : /계류/.test(name) ? Anchor : /주차/.test(name) ? ParkingCircle : /도로/.test(name) ? Route : /데크|해안길/.test(name) ? Footprints : Trees;
const money = (value: number) => Math.trunc(value / 100).toLocaleString("ko-KR");
// A parent project is one list item; sum its children once for its budget.
export const tourismBudgetFor = (project: TourismProject) => {
  const sources = project.sub_projects?.length ? project.sub_projects : [project];
  return sources.map(source=>deriveProjectBudget(source)).reduce((sum,b)=>({total:sum.total+b.total,request:sum.request+b.budget2027,invested:sum.invested+b.investedThrough2026}),{total:0,request:0,invested:0});
};

export default function DepartmentInvestmentDashboard({projects: allProjects,onOpenProject,department="관광진흥과"}:{projects: TourismProject[];onOpenProject:(id:string)=>void;department?:string}) {
  const projects=useMemo(()=>allProjects.filter(p=>(department==="전체"||p.department===department)),[allProjects,department]);
  const profile=profileForDepartment(department);
  const isTourism=department==="관광진흥과";
  const [query,setQuery]=useState("");
  const [region,setRegion]=useState<Region|null>(null);
  const [activeSiteKey,setActiveSiteKey]=useState<string|null>(null);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const map = useRef<TourismMapHandle>(null);
  const projectList = useRef<HTMLDivElement>(null);
  const [revealProject,setRevealProject]=useState<{id:string}|null>(null);
  useLayoutEffect(()=>{
    if(!revealProject)return;
    const list=projectList.current;
    const row=list && Array.from(list.querySelectorAll<HTMLElement>("[data-project-id]")).find(element=>element.dataset.projectId===revealProject.id);
    if(!list||!row)return;
    const bounds=list.getBoundingClientRect(),item=row.getBoundingClientRect();
    // Scroll only the project list; keep the map and page in place.
    list.scrollTo({top:list.scrollTop+item.top-bounds.top-(list.clientHeight-item.height)/2,behavior:"instant"});
  },[revealProject]);
  const totals=useMemo(()=>projects.reduce((sum,p)=>{const b=tourismBudgetFor(p);return {total:sum.total+b.total,request:sum.request+b.request,invested:sum.invested+b.invested};},{total:0,request:0,invested:0}),[projects]);
  const visible=projects.filter(p=>p.project_name.includes(query.trim())&&(!region||regionsFor(p.project_name).includes(region)));
  const active=projects.find(p=>p.id===(hoveredId??activeId));
  const highlights=isTourism?(active?regionsFor(active.project_name):region?[region]:[]):[];
  const counts=useMemo(()=>Object.fromEntries(TOURISM_REGIONS.map(place=>[place,isTourism?projects.filter(p=>regionsFor(p.project_name).includes(place)).length:0])) as Record<Region,number>,[projects,isTourism]);
  const sites=useMemo<TourismMapSite[]>(()=>isTourism?tourismProjectSites.flatMap(site=>{
    const index=projects.findIndex(p=>p.id.endsWith(site.projectSuffix));if(index<0)return [];
    const p=projects[index];return [{...site,projectId:p.id,number:index+1,name:p.project_name}];
  }):projects.flatMap((project,index)=>projectAreaPoints(project).map(({area,point})=>({key:`${project.id}:${area}`,projectId:project.id,number:index+1,name:project.project_name,label:project.project_name,kind:/테니스/.test(project.project_name)?"tennis":/야구/.test(project.project_name)?"baseball":/경기장|돔구장|축구/.test(project.project_name)?"stadium":profileForDepartment(project.department).kind,point}))),[projects,isTourism,profile.kind]);
  const selectSite=(site:TourismMapSite)=>{setRegion(null);setQuery("");setHoveredId(null);setActiveId(site.projectId);setActiveSiteKey(site.key);setRevealProject({id:site.projectId});map.current?.focusSites([site.point],isTourism?14.2:12.2);};
  const focus=(p:TourismProject)=>{setActiveId(p.id);setActiveSiteKey(sites.find(s=>s.projectId===p.id)?.key??null);map.current?.focusSites(sites.filter(s=>s.projectId===p.id).map(s=>s.point),isTourism?14.2:12.2);};
  return <section className="tdb-shell" data-department={department} style={{"--tdb-gold":profile.accent} as CSSProperties} aria-label={`${department} 부서별 현황`}>
    <header className="tdb-header"><div><p>{profile.english}</p><h1>{!isTourism&&<profile.icon size={24} className="department-heading-icon"/>}{department} <span>주요투자사업</span></h1></div><div className="tdb-slogan"><ContainerTextFlip words={profile.words} interval={3600} className="tdb-slogan-flip" textClassName="tdb-slogan-word"/></div></header>
    <div className="tdb-kpis" aria-label={`${department} 주요 지표`}>
      <article className="tdb-kpi is-count"><div><Layers3 size={17}/><span>관리사업</span></div><strong>{projects.length}<small>개</small></strong><p>세부사업은 모사업에 포함</p></article>
      <article className="tdb-kpi"><div><Wallet size={17}/><span>총사업비</span></div><strong>{money(totals.total)}<small>억원</small></strong><p>등록된 사업비 합계</p></article>
      <article className="tdb-kpi is-request"><div><Wallet size={17}/><span>2027년 요구액</span></div><strong>{money(totals.request)}<small>억원</small></strong><p>미등록 요구액 제외</p></article>
      <article className="tdb-kpi"><div><Wallet size={17}/><span>누적 투자액</span></div><strong>{money(totals.invested)}<small>억원</small></strong><p>2026년까지 편성액 기준</p></article>
    </div>
    <div className="tdb-body">
      <section className="tdb-map-card" aria-label={`${department} 사업 지도`}>
        <header className="tdb-map-header"><button aria-label="화성시 지도 전체 보기" onClick={()=>{map.current?.reset();setRegion(null);setActiveId(null);setActiveSiteKey(null);}}><LocateFixed size={15}/> 전체 보기</button></header>
        <div className="tdb-map-surface">
          <TourismGeographicMap key={department} landmarkCategories={profile.landmarks} ref={map} counts={counts} highlights={highlights} sites={sites} activeProjectId={activeId} activeSiteKey={activeSiteKey} onProjectSelect={selectSite} onSelect={place=>{setRegion(place);setQuery("");setActiveId(null);setHoveredId(null);map.current?.focus([place]);}}/>
          <div className="tdb-zoom"><button aria-label="사업 지도 확대" onClick={()=>map.current?.zoom(1)}><Plus size={17}/></button><button aria-label="사업 지도 축소" onClick={()=>map.current?.zoom(-1)}><Minus size={17}/></button></div>

        </div>
        <div className="tdb-map-caption"><span>{isTourism?"가상 오브젝트 · 위치도 판독 대표위치(대략)":"읍·면·동 대표위치 · 실제 사업지와 다를 수 있음 · 가상 오브젝트"}</span></div>
      </section>
      <section className="tdb-list-card" aria-label={`${department} 사업 목록`}>
        <header className="tdb-list-header"><div><h2>{region?regionLabel(region):"전체 사업"}</h2><span>{visible.length}</span></div>{region&&<button aria-label="권역 필터 해제" onClick={()=>setRegion(null)}><X size={16}/></button>}</header>
        <label className="tdb-search"><Search size={15}/><input aria-label={`${department} 사업 검색`} value={query} onChange={e=>setQuery(e.target.value)} placeholder="사업명 검색"/></label>
        <div className="tdb-project-list" ref={projectList}>{visible.map(project=>{const Icon=isTourism?iconFor(project.project_name):departmentProjectIcon(project.project_name,department);return <article key={project.id} data-project-id={project.id} className={`tdb-project${activeId===project.id?" is-active":""}`} onMouseEnter={()=>setHoveredId(project.id)} onMouseLeave={()=>setHoveredId(null)}>
          <span className="tdb-project-icon"><Icon size={19}/><b className="tdb-project-number">{projects.findIndex(p=>p.id===project.id)+1}</b></span><div className="tdb-project-info"><div className="tdb-project-heading"><button className="tdb-project-title" aria-pressed={activeId===project.id} onClick={()=>focus(project)}>{project.project_name}</button>{!sites.some(site=>site.projectId===project.id)&&<span className="department-unmapped">위치 미등록</span>}<span className="tdb-project-stage">{project.current_stage||(project.sub_projects?.length?`세부사업 ${project.sub_projects.length}개`:"단계 미등록")}</span></div>{project.progress_rate!=null&&<div className="tdb-progress" aria-label={`진척률 ${project.progress_rate}%`}><i style={{width:`${Math.max(0,Math.min(100,project.progress_rate))}%`}}/></div>}</div><button className="tdb-project-detail" aria-label={`${project.project_name} 상세 보기`} onClick={()=>onOpenProject(project.id)}><ArrowUpRight size={25} strokeWidth={1.8}/></button>
        </article>;})}{!visible.length&&<p className="tdb-empty">검색 결과가 없습니다.</p>}</div>
      </section>
    </div>
  </section>;
}
