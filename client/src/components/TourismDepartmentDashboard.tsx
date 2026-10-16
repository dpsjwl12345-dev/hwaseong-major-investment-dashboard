import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Anchor, ArrowUpRight, Footprints, Layers3, LocateFixed, MapPin, Minus, ParkingCircle, Plus, Route, Search, TrainFront, Trees, Wallet, X } from "lucide-react";
import { deriveProjectBudget } from "../lib/projectBudget";
import boundary from "../data/hwaseong-boundary.json";
import guOutlines from "../data/hwaseong-gu-outlines.json";
import coastalPoints from "../data/hwaseong-coastal-points.json";
import "./TourismDepartmentDashboard.css";

type BudgetSource = Parameters<typeof deriveProjectBudget>[0];
export type TourismProject = BudgetSource & {
  id: string; department: string; project_name: string; current_stage?: string; progress_rate?: number | null;
  sub_projects?: (BudgetSource & { name: string })[];
};
type Region = keyof typeof coastalPoints;
const REGIONS: Region[] = ["제부도", "궁평항", "국화도", "입파도"];
const FULL_VIEW = {x:-32,y:-22,width:1064,height:611};
const regionsFor = (name: string): Region[] => /계류시설/.test(name) ? ["국화도","입파도"] : /주차장 및 도로/.test(name) ? ["제부도","궁평항"] : /국화도/.test(name) ? ["국화도"] : /궁평|황금해안길/.test(name) ? ["궁평항"] : ["제부도"];
const regionLabel = (region: Region) => region === "궁평항" ? "궁평 권역" : region === "제부도" ? "제부 권역" : region;
const iconFor = (name: string) => /열차/.test(name) ? TrainFront : /계류/.test(name) ? Anchor : /주차/.test(name) ? ParkingCircle : /도로/.test(name) ? Route : /데크|해안길/.test(name) ? Footprints : Trees;
const money = (value: number) => (Math.trunc(value / 100 * 10) / 10).toLocaleString("ko-KR", {maximumFractionDigits:1});
// A parent project is one list item; sum its children once for its budget.
export const tourismBudgetFor = (project: TourismProject) => {
  const sources = project.sub_projects?.length ? project.sub_projects : [project];
  return sources.map(source=>deriveProjectBudget(source)).reduce((sum,b)=>({total:sum.total+b.total,request:sum.request+b.budget2027,invested:sum.invested+b.investedThrough2026}),{total:0,request:0,invested:0});
};
const districtLabel = (d: string) => {
  let best=0, result=[0,0];
  for(const ring of d.split("M").filter(Boolean)){
    const n=(ring.match(/-?\d+(?:\.\d+)?/g)??[]).map(Number);let area=0,x=0,y=0;
    for(let i=0;i+1<n.length;i+=2){const j=(i+2)%n.length;const cross=n[i]*n[j+1]-n[j]*n[i+1];area+=cross;x+=(n[i]+n[j])*cross;y+=(n[i+1]+n[j+1])*cross;}
    if(Math.abs(area)>best){best=Math.abs(area);result=[x/(3*area),y/(3*area)];}
  }
  return result;
};

export default function TourismDepartmentDashboard({projects: allProjects,onOpenProject}:{projects: TourismProject[];onOpenProject:(id:string)=>void}) {
  const projects=useMemo(()=>allProjects.filter(p=>p.department==="관광진흥과"),[allProjects]);
  const [query,setQuery]=useState("");
  const [region,setRegion]=useState<Region|null>(null);
  const [activeId,setActiveId]=useState<string|null>(null);
  const [hoveredId,setHoveredId]=useState<string|null>(null);
  const [view,setView]=useState(FULL_VIEW);
  const svg=useRef<SVGSVGElement>(null);
  const drag=useRef<{x:number;y:number;vx:number;vy:number}|null>(null);
  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const matrix = element.getScreenCTM();
      if (!matrix) return;
      const cursor = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
      setView(previous => {
        const width = Math.max(120, Math.min(FULL_VIEW.width * 1.6, previous.width * Math.exp(Math.max(-120, Math.min(120, event.deltaY)) * .002)));
        const ratio = width / previous.width;
        return { x: cursor.x - (cursor.x - previous.x) * ratio, y: cursor.y - (cursor.y - previous.y) * ratio, width, height: previous.height * ratio };
      });
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, []);

  const totals=useMemo(()=>projects.reduce((sum,p)=>{const b=tourismBudgetFor(p);return {total:sum.total+b.total,request:sum.request+b.request,invested:sum.invested+b.invested};},{total:0,request:0,invested:0}),[projects]);
  const visible=projects.filter(p=>p.project_name.includes(query.trim())&&(!region||regionsFor(p.project_name).includes(region)));
  const active=projects.find(p=>p.id===(hoveredId??activeId));
  const highlights=active?regionsFor(active.project_name):region?[region]:[];
  const zoom=(factor:number)=>setView(v=>{const width=Math.max(120,Math.min(FULL_VIEW.width*1.6,v.width*factor));const height=width*FULL_VIEW.height/FULL_VIEW.width;return {x:v.x+(v.width-width)/2,y:v.y+(v.height-height)/2,width,height};});
  const focus=(p:TourismProject)=>{setActiveId(p.id);const places=regionsFor(p.project_name).map(r=>coastalPoints[r]);const x=places.reduce((s,p)=>s+p.x*10,0)/places.length;const y=places.reduce((s,p)=>s+p.y*boundary.height/100,0)/places.length;setView({x:x-210,y:y-130,width:470,height:470*FULL_VIEW.height/FULL_VIEW.width});};
  const start=(e:PointerEvent<SVGSVGElement>)=>{if((e.target as Element).closest('[data-region]'))return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};};
  const move=(e:PointerEvent<SVGSVGElement>)=>{const d=drag.current,m=svg.current?.getScreenCTM();if(d&&m)setView(v=>({...v,x:d.vx-(e.clientX-d.x)/m.a,y:d.vy-(e.clientY-d.y)/m.d}));};
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
        <header className="tdb-map-header"><div><h2>사업 분포</h2><span>화성시</span></div><button aria-label="화성시 지도 전체 보기" onClick={()=>{setView(FULL_VIEW);setRegion(null);setActiveId(null);}}><LocateFixed size={15}/> 전체 보기</button></header>
        <div className="tdb-map-surface">
          <svg ref={svg} viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`} onDoubleClick={()=>zoom(.65)} onPointerDown={start} onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}} aria-label="화성시 4개 구 경계와 관광사업 권역">
            <path className="tdb-city" d={boundary.d}/>
            {Object.entries(guOutlines).map(([name,shape])=><path className="tdb-district" key={name} d={shape.d}/>)}
            <g className="tdb-district-names">{Object.entries(guOutlines).map(([name,shape])=>{const [x,y]=districtLabel(shape.d);return <text key={name} x={x} y={y} textAnchor="middle">{name}</text>;})}</g>
            {REGIONS.map(place=>{const point=coastalPoints[place];const count=projects.filter(p=>regionsFor(p.project_name).includes(place)).length;const selected=highlights.includes(place);const scale=view.width/FULL_VIEW.width;return <g data-region="true" key={place} className={`tdb-map-marker${selected?" is-active":""}`} transform={`translate(${point.x*10} ${point.y*boundary.height/100}) scale(${scale})`} role="button" tabIndex={0} aria-pressed={region===place} aria-label={`${regionLabel(place)} ${count}개 사업 보기`} onClick={()=>{setRegion(region===place?null:place);setActiveId(null);}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setRegion(region===place?null:place);setActiveId(null);}}}><circle className="tdb-marker-halo" r="25"/><circle className="tdb-marker-disc" r="17"/><text className="tdb-marker-count" textAnchor="middle" dominantBaseline="central">{count}</text><text className="tdb-marker-name" x="25" y="4">{regionLabel(place)}</text></g>;})}
          </svg>
          <div className="tdb-zoom"><button aria-label="관광 지도 확대" onClick={()=>zoom(.75)}><Plus size={17}/></button><button aria-label="관광 지도 축소" onClick={()=>zoom(1.333)}><Minus size={17}/></button></div>
          {active&&<div className="tdb-map-selection"><MapPin size={16}/><span>{active.project_name}</span><button onClick={()=>onOpenProject(active.id)} aria-label={`${active.project_name} 상세 보기`}><ArrowUpRight size={17}/></button></div>}
        </div>
        <div className="tdb-map-caption"><span>권역별 사업 분포</span><span>마커는 사업 부지의 정확한 좌표가 아닌 권역 대표 위치입니다.</span></div>
      </section>
      <section className="tdb-list-card" aria-label="관광진흥과 사업 목록">
        <header className="tdb-list-header"><div><h2>{region?regionLabel(region):"전체 사업"}</h2><span>{visible.length}</span></div>{region&&<button aria-label="권역 필터 해제" onClick={()=>setRegion(null)}><X size={16}/></button>}</header>
        <label className="tdb-search"><Search size={15}/><input aria-label="관광진흥과 사업 검색" value={query} onChange={e=>setQuery(e.target.value)} placeholder="사업명 검색"/></label>
        <div className="tdb-project-list">{visible.map(project=>{const Icon=iconFor(project.project_name);return <article key={project.id} className={`tdb-project${activeId===project.id?" is-active":""}`} onMouseEnter={()=>setHoveredId(project.id)} onMouseLeave={()=>setHoveredId(null)}>
          <span className="tdb-project-icon"><Icon size={19}/></span><div className="tdb-project-info"><button className="tdb-project-title" onClick={()=>onOpenProject(project.id)}>{project.project_name}<ArrowUpRight size={13}/></button><div className="tdb-project-meta"><span>{project.current_stage||(project.sub_projects?.length?`세부사업 ${project.sub_projects.length}개`:"단계 미등록")}</span><strong>{project.progress_rate==null?"미등록":`${project.progress_rate}%`}</strong></div></div><button className="tdb-project-locate" aria-label={`${project.project_name} 지도에서 보기`} onClick={()=>focus(project)}><MapPin size={15}/></button>
        </article>;})}{!visible.length&&<p className="tdb-empty">검색 결과가 없습니다.</p>}</div>
      </section>
    </div>
  </section>;
}
