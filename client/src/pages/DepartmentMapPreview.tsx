import { useMemo, useRef, useState, type PointerEvent } from "react";
import { ArrowLeft, ArrowUpRight, LocateFixed, Minus, Plus, X } from "lucide-react";
import boundary from "../data/hwaseong-boundary.json";
import guOutlines from "../data/hwaseong-gu-outlines.json";
import islands from "../data/hwaseong-islands.json";
import points from "../data/hwaseong-coastal-points.json";
import dataset from "../data/dashboard_projects.json";
import "./DepartmentMapPreview.css";

type Region = "제부도" | "궁평항" | "국화도" | "입파도";
const regions: Region[] = ["제부도", "궁평항", "국화도", "입파도"];
const projectRegions = (name: string): Region[] => /계류시설/.test(name) ? ["국화도", "입파도"] : /주차장 및 도로/.test(name) ? ["제부도", "궁평항"] : /국화도/.test(name) ? ["국화도"] : /궁평|주차장 및 도로|황금해안길/.test(name) ? ["궁평항"] : ["제부도"];
const INITIAL = { x: -35, y: -5, w: 1120, h: 630 };
const GU_COLORS: Record<string, string> = { "만세구": "#e8eee5", "효행구": "#f0eadf", "병점구": "#dce8ec", "동탄구": "#e9e4ed" };
// Place gu labels inside the largest ring of each existing boundary.
const labelPosition = (d: string): [number, number] => {
  let largest = 0; let result: [number, number] = [0, 0];
  for (const ring of d.split("M").filter(Boolean)) {
    const coords = (ring.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    let area = 0, x = 0, y = 0;
    for (let i = 0; i + 1 < coords.length; i += 2) {
      const j = (i + 2) % coords.length;
      const cross = coords[i] * coords[j + 1] - coords[j] * coords[i + 1];
      area += cross; x += (coords[i] + coords[j]) * cross; y += (coords[i + 1] + coords[j + 1]) * cross;
    }
    if (Math.abs(area) > largest) { largest = Math.abs(area); result = [x / (3 * area), y / (3 * area)]; }
  }
  return result;
};
export default function DepartmentMapPreview() {
  const [view, setView] = useState(INITIAL);
  const [selected, setSelected] = useState<Region | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const scene = useRef<SVGGElement>(null);
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
    <header className="dmp-header"><a href="/" className="dmp-back"><ArrowLeft size={17} /> 돌아가기</a><span>HIB<span className="dmp-dot">.</span></span><span className="dmp-preview">MAP STUDY / 02</span></header>
    <section className="dmp-heading"><div><p>TOURISM INVESTMENT MAP</p><h1>관광진흥과 <span>사업지도</span></h1></div><div className="dmp-summary"><b>{projects.length}</b><span>개 사업<span>서해안 관광 거점</span></span></div></section>
    <section className="dmp-map" aria-label="관광진흥과 주요투자사업 지도">
      <div className="dmp-map-caption"><span className="dmp-live" /> 화성시 관광사업 <span className="dmp-divider">/</span><span>사업 분포</span></div>
      <svg ref={svg} viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} aria-label="화성시 해안 권역별 관광사업 지도" onPointerDown={start} onPointerMove={move} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
        <defs>
          <linearGradient id="dmp-water" x1="0" y1="600" x2="1000" y2="0" gradientUnits="userSpaceOnUse"><stop stopColor="#176a78"/><stop offset=".46" stopColor="#3d9198"/><stop offset="1" stopColor="#9bcac0"/></linearGradient>
          <pattern id="dmp-water-lines" width="110" height="110" patternUnits="userSpaceOnUse"><path d="M-10 55Q20 45 55 55T120 55" fill="none" stroke="#d4ebe5" strokeWidth=".45" strokeOpacity=".12"/></pattern>
          <filter id="dmp-shore"><feGaussianBlur stdDeviation="7"/></filter>
          <filter id="dmp-land-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="1" dy="10" stdDeviation="9" floodColor="#103e46" floodOpacity=".28"/></filter>
          <filter id="dmp-pin-shadow" x="-100%" y="-100%" width="300%" height="350%"><feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#124e55" floodOpacity=".28"/></filter>
        </defs>
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#dmp-water)" />
        <rect x="-10000" y="-10000" width="20000" height="20000" fill="url(#dmp-water-lines)" />
        <g ref={scene} transform="matrix(1 .075 -.13 .83 55 30)">
          <path d={boundary.d} fill="none" stroke="#ceede0" strokeWidth="12" opacity=".14" filter="url(#dmp-shore)" />
          <g filter="url(#dmp-land-shadow)">
            <path d={boundary.d} transform="translate(0 9)" fill="#578f87" stroke="#578f87" strokeWidth="1"/>
            <path d={boundary.d} transform="translate(0 5)" fill="#88aea0" stroke="#88aea0" strokeWidth="1"/>
            <path d={boundary.d} fill="#e8eee5" stroke="#f9faf0" strokeWidth="1"/>
            {Object.entries(guOutlines).map(([name,shape]) => <path key={name} d={shape.d} fill={GU_COLORS[name]} stroke="#a4b5ab" strokeWidth="1.1" vectorEffect="non-scaling-stroke"/>)}
          </g>
          {Object.entries(islands).map(([name, shape]) => <g key={name}><path d={shape.d} transform="translate(0 4)" fill="#619287"/><path d={shape.d} fill="#edf0e5" stroke="#f8f9eb" strokeWidth="1"/></g>)}
          <g className="dmp-gu-labels">{Object.entries(guOutlines).map(([name,shape]) => <text key={name} x={labelPosition(shape.d)[0]} y={labelPosition(shape.d)[1]} textAnchor="middle">{name}</text>)}</g>
          <g className="dmp-place-labels"><text x="343" y="192">송산면</text><text x="303" y="263">서신면</text><text x="410" y="280">마도면</text><text x="470" y="345">팔탄면</text><text x="275" y="437">우정읍</text><text x="60" y="190" className="dmp-sea-label">WEST COAST</text></g>
        {regions.map(region => {
          const point = points[region]; const x = point.x * 10; const y = point.y * boundary.height / 100;
          const active = selected === region; const count = projects.filter(p => projectRegions(p.project_name).includes(region)).length;
          const scale = Math.max(.65, view.w / 950); const r = 12;
          return <g key={region} transform={`translate(${x} ${y}) scale(${scale})`} className={`dmp-pin${active ? " is-selected" : ""}`} data-marker="true" role="button" tabIndex={0} aria-label={`${region} 권역 ${count}개 사업`} aria-pressed={active} onClick={() => select(region)} onKeyDown={e => { if(e.key === "Enter" || e.key === " ") { e.preventDefault(); select(region); } }}>
            <rect x="-18" y="-36" width="95" height="51" fill="transparent" pointerEvents="all"/><ellipse cy="6" rx="13" ry="4" className="dmp-pin-ground"/><path d="M0 3V-9" className="dmp-pin-stem"/><g filter="url(#dmp-pin-shadow)"><circle cy="-18" r="16" className="dmp-pin-ring"/><circle cy="-18" r={r} className="dmp-pin-core"/><text y="-18" textAnchor="middle" dominantBaseline="central" className="dmp-pin-count">{count}</text></g><text x="23" y="-14" className="dmp-pin-name">{region === "궁평항" ? "궁평 권역" : region}</text>
          </g>;
        })}
        </g>
      </svg>
      <div className="dmp-controls"><button onClick={() => zoom(.75)} aria-label="지도 확대"><Plus size={19}/></button><button onClick={() => zoom(1.333)} aria-label="지도 축소"><Minus size={19}/></button><span/><button onClick={() => setView(INITIAL)} aria-label="해안 전체 보기"><LocateFixed size={19}/></button></div>
      <nav className="dmp-regions" aria-label="지도 권역 선택">{regions.map(region => <button key={region} className={selected === region ? "is-selected" : ""} onClick={() => select(region)}>{region === "궁평항" ? "궁평 권역" : region}</button>)}</nav>
      {selected && <aside className="dmp-popover" aria-label={`${selected} 사업 목록`}><div className="dmp-popover-head"><div><small>SELECTED AREA</small><h2>{selected === "궁평항" ? "궁평 권역" : selected}</h2></div><button aria-label="선택 닫기" onClick={() => { setSelected(null); setProjectId(null); }}><X size={18}/></button></div><div className="dmp-projects">{selectedProjects.map(p => <button key={p.id} className={p.id === projectId ? "is-selected" : ""} onClick={() => setProjectId(p.id)}><span>{p.project_name}</span><ArrowUpRight size={16}/></button>)}</div>{chosen && <div className="dmp-project-note"><b>{chosen.current_stage || "추진단계 확인 중"}</b><p>{chosen.overview.split('\n').find(s => s.includes('사업위치:'))?.replace('○ 사업위치:', '') || "세부사업별 위치 확인"}</p></div>}</aside>}
      <footer className="dmp-map-footer"><span><i/> 사업 권역 <i className="is-gold"/> 선택 권역 <span className="dmp-gu-legend">{Object.entries(GU_COLORS).map(([name,color]) => <span key={name}><i style={{ background: color }}/>{name}</span>)}</span></span><span>권역 대표 위치 · 사업별 부지 경계 미반영</span></footer>
    </section>
    <footer className="dmp-footnote">여러 지역에 걸친 사업은 해당 권역에 함께 표시됩니다. <span>지도: 기존 화성시 행정경계 자료 · 사업정보: 대시보드 등록자료</span></footer>
  </main>;
}
