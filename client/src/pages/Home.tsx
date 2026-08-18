import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  X,
} from "lucide-react";
import dataset from "../data/dashboard_projects.json";

type Project = {
  id: string;
  department: string;
  project_name: string;
  overview: string;
  category: string;
  current_stage: string;
  funding_type: string;
  total_cost_million_krw: number | null;
  invested_to_2026_million_krw: number | null;
  budget_2027_million_krw: number | null;
  execution_rate: number | null;
  progress_status: string;
  progress_rate: number | null;
  expected_completion: string;
  progress_notes: string;
  future_plan: string;
  inspection: string;
  delay_reason: string;
  administrative_procedures: string;
  project_type: string;
  region: string;
  district: string;
  town: string;
  contact: string;
  last_saved: string;
};

type Bureau = { name: string; departments: { name: string; projects: Project[] }[] };

const projects = dataset.projects as Project[];
const bureauFor = (department: string) =>
  ["문화예술과", "문화유산과", "관광진흥과"].includes(department) ? "문화관광국" : "교육체육국";

const organization: Bureau[] = Object.values(
  projects.reduce<Record<string, Bureau>>((acc, project) => {
    const bureau = bureauFor(project.department);
    acc[bureau] ??= { name: bureau, departments: [] };
    let department = acc[bureau].departments.find((item) => item.name === project.department);
    if (!department) {
      department = { name: project.department, projects: [] };
      acc[bureau].departments.push(department);
    }
    department.projects.push(project);
    return acc;
  }, {}),
).sort((a, b) => a.name.localeCompare(b.name, "ko"));

const money = (value: number | null) => (value == null ? "-" : `${value.toLocaleString("ko-KR")}백만원`);
const clean = (value: string) => value || "등록된 정보가 없습니다.";

function InfoCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.10] bg-white/[0.035] p-6 shadow-[0_12px_30px_rgba(46,65,78,0.04)]">
      <p className="font-body text-[11px] font-semibold tracking-[0.1em] text-[#b8c4d6]">{label}</p>
      <p className="mt-4 whitespace-pre-line font-body text-[14px] leading-6 text-[#cbd5e1]">{body}</p>
    </div>
  );
}

function OverviewPanel({ project }: { project: Project }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-white/[0.10] bg-white/[0.035] p-6 lg:col-span-2">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["사업기간", project.overview.match(/사업기간:([^\n]+)/)?.[1]?.trim() || "-"],
            ["총사업비", money(project.total_cost_million_krw)],
            ["담당부서", project.department],
            ["현재 상태", `${clean(project.current_stage)} · ${project.progress_rate ?? 0}%`],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#b8c4d6]">{label}</p>
              <p className="mt-2 font-body text-[15px] font-semibold text-[#e2e8f0]">{value}</p>
            </div>
          ))}
        </div>
      </div>
      <InfoCard label="사업개요" body={clean(project.overview)} />
      <InfoCard label="사업분야 · 재원구분" body={`${clean(project.category)} · ${clean(project.funding_type)}`} />
      <InfoCard label="추진현황" body={clean(project.progress_notes)} />
      <InfoCard label="향후 추진계획" body={clean(project.future_plan)} />
    </div>
  );
}

function ProgressPanel({ project }: { project: Project }) {
  const progress = Math.min(100, Math.max(0, project.progress_rate ?? 0));
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-white/[0.10] bg-white/[0.035] p-6">
        <div className="flex items-center justify-between">
          <p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#b8c4d6]">사업 전체 공정률</p>
          <span className="font-body text-[20px] font-bold text-[#93c5fd]">{progress}%</span>
        </div>
        <div className="mt-6 h-3 rounded-full bg-[#334155]"><div className="h-3 rounded-full bg-gradient-to-r from-[#2563eb] to-[#a855f7]" style={{ width: `${progress}%` }} /></div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoCard label="현 추진단계" body={clean(project.current_stage)} />
          <InfoCard label="준공예정일" body={clean(project.expected_completion)} />
          <InfoCard label="추진상황 점검" body={clean(project.inspection)} />
          <InfoCard label="부진 사유" body={clean(project.delay_reason)} />
        </div>
      </div>
      <InfoCard label="행정절차 이행여부" body={clean(project.administrative_procedures)} />
    </div>
  );
}

function BudgetPanel({ project }: { project: Project }) {
  const total = project.total_cost_million_krw ?? 0;
  const invested = project.invested_to_2026_million_krw ?? 0;
  const budget = project.budget_2027_million_krw ?? 0;
  const execution = project.execution_rate ?? 0;
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl border border-white/[0.10] bg-white/[0.035] p-6">
        <div className="flex items-center justify-between"><p className="font-body text-[11px] font-semibold tracking-[0.08em] text-[#b8c4d6]">예산 현황</p><span className="font-body text-[12px] text-[#b8c4d6]">단위: 백만원</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[["총사업비", total], ["기투자액", invested], ["2027년 예산", budget]].map(([label, value]) => <div key={label} className="rounded-xl bg-black/25 p-4"><p className="font-body text-xs text-[#94a3b8]">{label}</p><p className="mt-2 font-body text-lg font-bold text-white">{Number(value).toLocaleString("ko-KR")}</p></div>)}
        </div>
        <div className="mt-7"><div className="mb-2 flex justify-between font-body text-xs text-[#b8c4d6]"><span>예산 집행률</span><span>{execution}%</span></div><div className="h-3 rounded-full bg-[#334155]"><div className="h-3 rounded-full bg-[#34d399]" style={{ width: `${Math.min(100, Math.max(0, execution))}%` }} /></div></div>
      </div>
      <InfoCard label="재원구분" body={clean(project.funding_type)} />
    </div>
  );
}

function LocationPanel({ project }: { project: Project }) {
  return <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]"><InfoCard label="지역정보" body={[project.region, project.district, project.town].filter(Boolean).join(" · ") || "등록된 지역정보가 없습니다."} /><InfoCard label="담당자(연락처)" body={clean(project.contact)} /></div>;
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [openBureaus, setOpenBureaus] = useState<string[]>(organization.map((item) => item.name));
  const [openDepartments, setOpenDepartments] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("사업개요");
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrganization = useMemo(() => organization.map((bureau) => ({ ...bureau, departments: bureau.departments.map((department) => ({ ...department, projects: department.projects.filter((project) => `${project.project_name} ${project.department} ${project.category}`.toLowerCase().includes(normalizedQuery)) })).filter((department) => department.projects.length > 0) })).filter((bureau) => bureau.departments.length > 0), [normalizedQuery]);
  const totalCost = projects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const toggle = (items: string[], setter: (value: string[]) => void, item: string) => setter(items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);

  return (
    <div className="min-h-screen bg-[#050609]/85 text-white">
      {isSidebarOpen && <button aria-label="사이드바 닫기" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#07090f] via-[#0e1220] to-[#030409] transition-all duration-200 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "w-[76px]" : "w-[320px]"}`}>
        <div className={`flex min-h-[92px] items-center border-b border-white/[0.08] bg-black/20 ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>
          {!isCollapsed && <div><p className="font-display text-[24px] font-bold leading-[1.05] tracking-[-0.055em] text-white">화성시 주요투자사업</p><p className="mt-1 font-body text-[10px] font-semibold tracking-[0.16em] text-[#b8c4d6]">INVESTMENT DASHBOARD</p></div>}
          <button className="hidden h-9 w-9 items-center justify-center rounded-full text-[#94a3b8] hover:bg-white/[0.08] hover:text-white lg:flex" onClick={() => setIsCollapsed(!isCollapsed)} aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}>{isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
          {visibleOrganization.map((bureau) => { const bureauOpen = openBureaus.includes(bureau.name); return <div key={bureau.name} className="mb-2"><button className={`flex w-full items-center rounded-xl border px-3 py-2.5 text-left hover:brightness-125 ${bureau.name === "문화관광국" ? "border-[#2a4f73]/60 bg-[#122033]/70" : "border-[#4d3f6b]/60 bg-[#211834]/60"} ${isCollapsed ? "justify-center" : "gap-2"}`} onClick={() => toggle(openBureaus, setOpenBureaus, bureau.name)} title={isCollapsed ? bureau.name : undefined}>{bureau.name === "문화관광국" ? <Building2 size={17} className="text-[#8ab4d8]" /> : <GraduationCap size={18} className="text-[#b49add]" />}{bureauOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}{!isCollapsed && <span className="font-body text-[17px] font-extrabold tracking-[-0.04em] text-white">{bureau.name}</span>}</button>
            {bureauOpen && !isCollapsed && <div className="ml-3 border-l border-[#475569] pl-3">{bureau.departments.map((department) => { const key = `${bureau.name}-${department.name}`; const departmentOpen = openDepartments.includes(key); return <div key={department.name}><button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[#334155]" onClick={() => toggle(openDepartments, setOpenDepartments, key)}>{departmentOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}<span className="font-body text-[15px] font-bold text-[#cbd5e1]">{department.name}</span><span className="ml-auto font-body text-[10px] tabular-nums text-[#64748b]">{department.projects.length}</span></button>{departmentOpen && <div className="ml-3 border-l border-[#334155] pl-3 pb-1">{department.projects.map((project) => <button key={project.id} onClick={() => { setSelectedProject(project); setActiveTab("사업개요"); setIsSidebarOpen(false); }} className={`mb-0.5 flex w-full items-start rounded-lg px-2.5 py-1.5 text-left ${selectedProject?.id === project.id ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white" : "text-[#cbd5e1] hover:bg-[#334155] hover:text-white"}`}><span className="mr-2 mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#64748b]" /><span className="font-body text-[14px] leading-[1.3]">{project.project_name}</span></button>)}</div>}</div> })}</div>}</div> })}
        </nav>
        {!isCollapsed && <div className="border-t border-white/[0.08] px-5 py-3"><p className="font-body text-[11px] text-[#b8c4d6]">예산심사 업무용 관리 화면</p><p className="mt-1 font-body text-[11px] text-[#64748b]">{organization.length}개 국 · {dataset.department_count}개 부서 · {dataset.project_count}개 사업</p></div>}
        {!isCollapsed && <div className="border-t border-white/[0.08] px-5 pb-3 pt-3"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa4ad]" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사업명·부서·분야 검색" className="h-10 w-full rounded-xl border border-[#475569] bg-[#0f172a] pl-10 pr-3 font-body text-[13px] text-white outline-none placeholder:text-[#64748b] focus:border-[#60a5fa]" /></label></div>}
      </aside>
      <div className={`min-h-screen transition-all duration-200 ${isCollapsed ? "lg:pl-[76px]" : "lg:pl-[320px]"}`}>
        <header className="flex h-[72px] items-center justify-between border-b border-white/[0.08] bg-[#050609]/80 px-5 backdrop-blur lg:px-9"><button className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.06] text-white lg:hidden" onClick={() => setIsSidebarOpen(true)} aria-label="사이드바 열기"><Menu size={18} /></button><div className="hidden items-center gap-4 sm:flex"><span className="font-body text-xs text-[#b8c4d6]">총사업비</span><strong className="font-body text-sm text-white">{money(totalCost)}</strong><span className="h-2 w-2 rounded-full bg-[#34d399]" /><span className="font-body text-xs text-[#b8c4d6]">Drive 자료 기준</span></div></header>
        <main className="relative min-h-[calc(100vh-72px)] overflow-hidden"><div className="pointer-events-none absolute right-[8%] top-[-8%] h-[520px] w-[170px] rotate-[24deg] rounded-full bg-[#173e67]/45 blur-3xl" /><div className="pointer-events-none absolute bottom-[-8%] right-[17%] h-[440px] w-[145px] -rotate-[28deg] rounded-full bg-[#452375]/35 blur-3xl" />
          {selectedProject ? <section className="relative p-6 lg:p-10"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-body text-xs font-semibold tracking-[0.12em] text-[#93c5fd]">{selectedProject.department} · {selectedProject.category}</p><h1 className="mt-2 max-w-4xl font-display text-2xl font-bold leading-[1.15] tracking-[-0.045em] text-white lg:text-4xl">{selectedProject.project_name}</h1></div><div className="rounded-2xl border border-white/[0.1] bg-white/[0.035] px-5 py-3 text-right"><p className="font-body text-[11px] text-[#94a3b8]">전체 공정률</p><p className="font-body text-2xl font-bold text-[#93c5fd]">{selectedProject.progress_rate ?? 0}%</p></div></div><div className="mt-8 flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">{["사업개요", "추진현황", "예산편성", "위치정보", "변경이력"].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 font-body text-[13px] ${activeTab === tab ? "bg-gradient-to-r from-[#2563eb] to-[#7c3aed] font-semibold text-white" : "text-[#b8c4d6] hover:bg-white hover:text-[#33424d]"}`}>{tab}</button>)}</div><div className="mt-7">{activeTab === "사업개요" && <OverviewPanel project={selectedProject} />}{activeTab === "추진현황" && <ProgressPanel project={selectedProject} />}{activeTab === "예산편성" && <BudgetPanel project={selectedProject} />}{activeTab === "위치정보" && <LocationPanel project={selectedProject} />}{activeTab === "변경이력" && <InfoCard label="최종 저장일" body={clean(selectedProject.last_saved)} />}</div></section> : <section className="relative p-6 lg:p-10"><p className="font-body text-xs font-semibold tracking-[0.12em] text-[#93c5fd]">2027년도 주요 투자사업 추진현황</p><h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-[-0.05em] text-white lg:text-5xl">부서와 사업을 선택해<br />상세 현황을 확인하세요.</h1><div className="mt-8 grid gap-4 sm:grid-cols-3">{[["전체 사업", dataset.project_count], ["담당 부서", dataset.department_count], ["총사업비", money(totalCost)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/[0.1] bg-white/[0.035] p-5"><p className="font-body text-xs text-[#94a3b8]">{label}</p><p className="mt-2 font-body text-2xl font-bold text-white">{value}</p></div>)}</div></section>}
        </main>
      </div>
      {isSidebarOpen && <button className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-md lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="사이드바 닫기"><X size={18} /></button>}
    </div>
  );
}
