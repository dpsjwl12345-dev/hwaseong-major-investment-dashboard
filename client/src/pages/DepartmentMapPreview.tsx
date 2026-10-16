import { useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowUpRight, LocateFixed, Minus, Plus, X } from "lucide-react";
import boundary from "../data/hwaseong-boundary.json";
import districts from "../data/hwaseong-dong-outlines.json";
import islands from "../data/hwaseong-islands.json";
import points from "../data/hwaseong-coastal-points.json";
import dataset from "../data/dashboard_projects.json";
import "./DepartmentMapPreview.css";

type Region = "제부도" | "궁평항" | "국화도" | "입파도";
const regions: Region[] = ["제부도", "궁평항", "국화도", "입파도"];
const projectRegions = (name: string): Region[] => /계류시설/.test(name) ? ["국화도", "입파도"] : /주차장 및 도로/.test(name) ? ["제부도", "궁평항"] : /국화도/.test(name) ? ["국화도"] : /궁평|주차장 및 도로|황금해안길/.test(name) ? ["궁평항"] : ["제부도"];
const INITIAL = { x: 15, y: 80, w: 590, h: 415 };
export default function DepartmentMapPreview() {
  const [view, setView] = useState(INITIAL);
  const [selected, setSelected] = useState<Region | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const projects = useMemo(() => dataset.projects.filter(p => p.department === "관광진흥과"), []);
  const selectedProjects = selected ? projects.filter(p => projectRegions(p.project_name).includes(selected)) : [];
  const chosen = selectedProjects.find(p => p.id === projectId);
  const zoom = (factor: number) => setView(v => {
    const w = Math.max(100, Math.min(1150, v.w * factor)); const h = w * INITIAL.h / INITIAL.w;
    return { x: v.x + (v.w - w) / 2, y: v.y + (v.h - h) / 2, w, h };
  });
  const start = (e: PointerEvent<SVGSVGElement>) => {
    if ((e.target as Element).closest('[data-marker]')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const move = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current; const matrix = svg.current?.getScreenCTM(); if (!d || !matrix) return;
    const dx = (e.clientX - d.x) / matrix.a; const dy = (e.clientY - d.y) / matrix.d;
    if (Math.abs(dx) + Math.abs(dy) > 2) d.moved = true;
    setView(v => ({ ...v, x: d.vx - dx, y: d.vy - dy }));
  };
  const select = (region: Region) => { setSelected(region); setProjectId(null); };
  return <main className="dmp-page">
    <header className="dmp-header"><a href="/" className="dmp-back"><ArrowLeft size={17} /> 돌아가기</a><span>HIB<span className="dmp-dot">.</span></span><span className="dmp-preview">MAP STUDY / 01</span></header>
    <section className="dmp-heading"><div><p>TOURISM INVESTMENT MAP</p><h1>관광진흥과 <span>사업지도</span></h1></div><div className="dmp-summary"><b>{projects.length}</b><span>개 사업<span>서해안 관광 거점</span></span></div></section>
    <section className="dmp-map" aria-label="관광진흥과 주요투자사업 지도">
      <div className="dmp-map-caption"><span className="dmp-live" /> 화성시 서해안 <span className="dmp-divider">/</span><span>사업 분포</span></div>
      <svg ref={svg} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} aria-label="화성시 해안 권역별 관광사업 지도" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <defs><pattern id="dmp-grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#18303c" strokeWidth=".35" /></pattern><radialGradient id="dmp-land"><stop stopColor="#263f49"/><stop offset="1" stopColor="#142833"/></radialGradient><filter id="dmp-glow"><feGaussianBlur stdDeviation="4"/></filter></defs>
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="#091821" /><rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#dmp-grid)" />
        <path d={boundary.d} fill="url(#dmp-land)" stroke="#45616b" strokeWidth=".7" vectorEffect="non-scaling-stroke" />
        {Object.entries(districts).map(([name,d]) => <path key={name} d={d} fill="none" stroke="#506673" strokeOpacity=".35" strokeWidth=".6" vectorEffect="non-scaling-stroke" />)}
        {Object.entries(islands).map(([name, shape]) => <path key={name} d={shape.d} fill="#28444b" stroke="#65878a" strokeWidth=".7" vectorEffect="non-scaling-stroke" />)}
        <g className="dmp-place-labels"><text x="343" y="192">송산면</text><text x="303" y="263">서신면</text><text x="410" y="280">마도면</text><text x="470" y="345">팔탄면</text><text x="275" y="437">우정읍</text><text x="100" y="172" className="dmp-sea-label">WEST SEA</text></g>
        {regions.map(region => {
          const point = points[region]; const x = point.x * 10; const y = point.y * boundary.height / 100;
          const active = selected === region; const count = projects.filter(p => projectRegions(p.project_name).includes(region)).length;
          const scale = view.w / INITIAL.w; const r = 12;
          return <g key={region} transform={`translate(${x} ${y}) scale(${scale})`} className={`dmp-pin${active ? " is-selected" : ""}`} data-marker="true" role="button" tabIndex={0} aria-label={`${region} 권역 ${count}개 사업`} aria-pressed={active} onClick={() => select(region)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); select(region); } }}>
            <circle r="25" className="dmp-halo"/><circle r="17" className="dmp-pin-ring"/><circle r={r} className="dmp-pin-core"/><text textAnchor="middle" dominantBaseline="central" className="dmp-pin-count">{count}</text><text x="23" y="4" className="dmp-pin-name">{region === "궁평항" ? "궁평 권역" : region}</text>
          </g>;
        })}
      </svg>
      <div className="dmp-controls"><button onClick={() => zoom(.75)} aria-label="지도 확대"><Plus size={19}/></button><button onClick={() => zoom(1.333)} aria-label="지도 축소"><Minus size={19}/></button><span/><button onClick={() => setView(INITIAL)} aria-label="해안 전체 보기"><LocateFixed size={19}/></button></div>
      <nav className="dmp-regions" aria-label="지도 권역 선택">{regions.map(region => <button key={region} className={selected === region ? "is-selected" : ""} onClick={() => select(region)}>{region === "궁평항" ? "궁평 권역" : region}</button>)}</nav>
      {selected && <aside className="dmp-popover" aria-label={`${selected} 사업 목록`}><div className="dmp-popover-head"><div><small>SELECTED AREA</small><h2>{selected === "궁평항" ? "궁평 권역" : selected}</h2></div><button aria-label="선택 닫기" onClick={() => { setSelected(null); setProjectId(null); }}><X size={18}/></button></div><div className="dmp-projects">{selectedProjects.map(p => <button key={p.id} className={p.id === projectId ? "is-selected" : ""} onClick={() => setProjectId(p.id)}><span>{p.project_name}</span><ArrowUpRight size={16}/></button>)}</div>{chosen && <div className="dmp-project-note"><b>{chosen.current_stage || "추진단계 확인 중"}</b><p>{chosen.overview.split('\n').find(s => s.includes('사업위치:'))?.replace('○ 사업위치:', '') || "세부사업별 위치 확인"}</p></div>}</aside>}
      <footer className="dmp-map-footer"><span><i/> 사업 권역 <i className="is-gold"/> 선택 권역</span><span>권역 대표 위치 · 사업별 부지 경계 미반영</span></footer>
    </section>
    <footer className="dmp-footnote">여러 지역에 걸친 사업은 해당 권역에 함께 표시됩니다. <span>지도: 기존 화성시 행정경계 자료 · 사업정보: 대시보드 등록자료</span></footer>
  </main>;
}
