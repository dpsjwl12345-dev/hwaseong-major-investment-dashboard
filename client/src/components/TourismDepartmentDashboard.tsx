import { useMemo, useRef, useState } from "react";
import { Anchor, ArrowUpRight, Footprints, Layers3, LocateFixed, MapPin, Minus, ParkingCircle, Plus, Route, Search, TrainFront, Trees, Wallet, X } from "lucide-react";
import { deriveProjectBudget } from "../lib/projectBudget";
import TourismSatelliteMap, { TOURISM_REGIONS, type TourismRegion, type TourismMapHandle } from "./TourismSatelliteMap";
import "./TourismDepartmentDashboard.css";

type BudgetSource = Parameters<typeof deriveProjectBudget>[0];
export type TourismProject = BudgetSource & {
  id: string; department: string; project_name: string; current_stage?: string; progress_rate?: number | null;
  sub_projects?: (BudgetSource & { name: string })[];
};
type Region = TourismRegion;

const regionsFor = (name: string): Region[] => /계류시설/.test(name) ? ["국화도","입파도"] : /주차장 및 도로/.test(name) ? ["제부도","궁평항"] : /국화도/.test(name) ? ["국화도"] : /궁평|황금해안길/.test(name) ? ["궁평항"] : ["제부도"];
const regionLabel = (region: Region) => region === "궁평항" ? "궁평 권역" : region === "제부도" ? "제부 권역" : region;
const iconFor = (name: string) => /열차/.test(name) ? TrainFront : /계류/.test(name) ? Anchor : /주차/.test(name) ? ParkingCircle : /도로/.test(name) ? Route : /데크|해안길/.test(name) ? Footprints : Trees;
const money = (value: number) => (Math.trunc(value / 100 * 10) / 10).toLocaleString("ko-KR", {maximumFractionDigits:1});
// A parent project is one list item; sum its children once for its budget.
export const tourismBudgetFor = (project: TourismProject) => {
  const sources = project.sub_projects?.length ? project.sub_projects : [project];
  return sources.map(source=>deriveProjectBudget(source)).reduce((sum,b)=>({total:sum.total+b.total,request:sum.request+b.budget2027,invested:sum.invested+b.investedThrough2026}),{total:0,request:0,invested:0});
};

export default function TourismDepartmentDashboard({projects: allProjects,onOpenProject}:{projects: TourismProject[];onOpenProject:(id:string)=>void}) {
  const projects=useMemo(()=>allProjects.filter(p=>p.department==="관광진흥과"),[allProjects]);
  const [query,setQuery]=useState("");
  const [region,setRegion]=useState<Region|null>(null);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const map = useRef<TourismMapHandle>(null);
  const totals=useMemo(()=>projects.reduce((sum,p)=>{const b=tourismBudgetFor(p);return {total:sum.total+b.total,request:sum.request+b.request,invested:sum.invested+b.invested};},{total:0,request:0,invested:0}),[projects]);
  const visible=projects.filter(p=>p.project_name.includes(query.trim())&&(!region||regionsFor(p.project_name).includes(region)));
  const active=projects.find(p=>p.id===(hoveredId??activeId));
  const highlights=active?regionsFor(active.project_name):region?[region]:[];
  const counts=useMemo(()=>Object.fromEntries(TOURISM_REGIONS.map(place=>[place,projects.filter(p=>regionsFor(p.project_name).includes(place)).length])) as Record<Region,number>,[projects]);
  const focus=(p:TourismProject)=>{setActiveId(p.id);map.current?.focus(regionsFor(p.project_name));};
  return <section className="tdb-shell" aria-label="관광진흥과 부서별 현황">
    <header className="tdb-header"><div><p>TOURISM DEPARTMENT</p><h1>관광진흥과 <span>주요투자사업</span></h1></div><span className="tdb-slogan">바다를 잇고, 화성을 누리다</span></header>
    <div className="tdb-kpis" aria-label="관광진흥과 주요 지표">
      <article className="tdb-kpi is-count"><div><Layers3 size={17}/><span>관리사업</span></div><strong>{projects.length}<small>개</small></strong><p>세부사업은 모사업에 포함</p></article>
      <article className="tdb-kpi"><div><Wallet size={17}/><span>총사업비</span></div><strong>{money(totals.total)}<small>억원</small></strong><p>등록된 사업비 합계</p></article>
      <article className="tdb-kpi is-request"><div><Wallet size={17}/><span>2027년 요구액</span></div><strong>{money(totals.request)}<small>억원</small></strong><p>미등록 요구액 제외</p></article>
      <article className="tdb-kpi"><div><Wallet size={17}/><span>누적 투자액</span></div><strong>{money(totals.invested)}<small>억원</small></strong><p>2026년까지 편성액 기준</p></article>
    </div>
    <div className="tdb-body">
      <section className="tdb-map-card" aria-label="화성시 관광사업 권역 지도">
        <header className="tdb-map-header"><div><h2>사업 분포</h2><span>화성시</span></div><button aria-label="화성시 지도 전체 보기" onClick={()=>{map.current?.reset();setRegion(null);setActiveId(null);}}><LocateFixed size={15}/> 전체 보기</button></header>
        <div className="tdb-map-surface">
          <TourismSatelliteMap ref={map} counts={counts} highlights={highlights} onSelect={place=>{setRegion(region===place?null:place);setActiveId(null);}}/>
          <div className="tdb-zoom"><button aria-label="관광 지도 확대" onClick={()=>map.current?.zoom(1)}><Plus size={17}/></button><button aria-label="관광 지도 축소" onClick={()=>map.current?.zoom(-1)}><Minus size={17}/></button></div>
          {active&&<div className="tdb-map-selection"><MapPin size={16}/><span>{active.project_name}</span><button onClick={()=>onOpenProject(active.id)} aria-label={`${active.project_name} 상세 보기`}><ArrowUpRight size={17}/></button></div>}
        </div>
        <div className="tdb-map-caption"><span>{projects.length}개 사업 · 4개 권역</span><span>표시는 권역 대표 위치이며 사업 부지 경계가 아닙니다.</span></div>
      </section>
      <section className="tdb-list-card" aria-label="관광진흥과 사업 목록">
        <header className="tdb-list-header"><div><h2>{region?regionLabel(region):"전체 사업"}</h2><span>{visible.length}</span></div>{region&&<button aria-label="권역 필터 해제" onClick={()=>setRegion(null)}><X size={16}/></button>}</header>
        <label className="tdb-search"><Search size={15}/><input aria-label="관광진흥과 사업 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="사업명 검색"/></label>
        <div className="tdb-project-list">{visible.map(project=>{const Icon=iconFor(project.project_name);return <article key={project.id} className={`tdb-project${activeId===project.id?" is-active":""}`} onMouseEnter={()=>setHoveredId(project.id)} onMouseLeave={()=>setHoveredId(null)}>
          <span className="tdb-project-icon"><Icon size={19}/></span><div className="tdb-project-info"><button className="tdb-project-title" onClick={()=>focus(project)}>{project.project_name}</button><div className="tdb-project-meta"><span>{project.current_stage||(project.sub_projects?.length?`세부사업 ${project.sub_projects.length}개`:"단계 미등록")}</span><strong>{project.progress_rate==null?"미등록":`${project.progress_rate}%`}</strong></div></div><button className="tdb-project-locate" aria-label={`${project.project_name} 지도에서 보기`} onClick={()=>focus(project)}><MapPin size={15}/></button><button className="tdb-project-detail" aria-label={`${project.project_name} 상세 보기`} onClick={()=>onOpenProject(project.id)}><ArrowUpRight size={15}/></button>
        </article>;})}{!visible.length&&<p className="tdb-empty">검색 결과가 없습니다.</p>}</div>
      </section>
    </div>
  </section>;
}
