import { useEffect, useMemo, useRef, useState } from "react";
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
  serial: number;
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
  management_card_matched: boolean;
  management_card_source: string;
  card_total_budget_million_krw: number | null;
  card_invested_to_2026_million_krw: number | null;
  card_budget_2027_million_krw: number | null;
  card_budget_2027_base_million_krw: number | null;
  card_budget_2027_first_extra_million_krw: number | null;
  card_budget_2027_additional_million_krw: number | null;
  card_budget_2028_million_krw: number | null;
  card_budget_2029_plus_million_krw: number | null;
  card_execution_budget_million_krw: number | null;
  card_execution_amount_million_krw: number | null;
  card_execution_rate: number | null;
  card_inspection: string;
  funding_breakdown: { name: string; total: number | null; invested: number | null; budget_2027: number | null; budget_2028: number | null; budget_2029_plus: number | null }[];
  usage_breakdown: { name: string; total: number | null; invested: number | null; budget_2027: number | null; budget_2028: number | null; budget_2029_plus: number | null }[];
  card_admin_procedures: string;
  card_admin_legal_basis: string;
  card_admin_status: { mid_term_fiscal?: boolean; investment_review?: boolean; public_property?: boolean; none?: boolean };
};

type Bureau = { name: string; departments: { name: string; projects: Project[] }[] };

const projects = dataset.projects as Project[];
const bureauFor = (department: string) =>
  ["문화예술과", "문화유산과", "독립기념관", "관광진흥과"].includes(department) ? "문화관광국" : "교육체육국";

const BUREAU_ORDER = ["문화관광국", "교육체육국"];
const DEPARTMENT_ORDER = ["문화예술과", "문화유산과", "독립기념관", "관광진흥과", "도서관정책과", "체육진흥과", "전국체전추진단"];

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
)
  .sort((a, b) => BUREAU_ORDER.indexOf(a.name) - BUREAU_ORDER.indexOf(b.name))
  .map((bureau) => ({
    ...bureau,
    departments: [...bureau.departments].sort(
      (a, b) => DEPARTMENT_ORDER.indexOf(a.name) - DEPARTMENT_ORDER.indexOf(b.name),
    ),
  }));

organization.forEach((bureau) =>
  bureau.departments.forEach((department) => department.projects.sort((a, b) => a.serial - b.serial)),
);

const money = (value: number | null) => (value == null ? "-" : `${value.toLocaleString("ko-KR")}백만원`);
const isBlank = (value: string | null | undefined) => !value || !value.trim();
const progressPercent = (project: Project) => {
  const parsed = Number.parseInt(project.expected_completion ?? "", 10);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 0;
};

type KvPair = { label: string; value: string };
function parseKvPairs(text: string): KvPair[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^○\s*([^:：]+?)\s*[:：]\s*(.+)$/);
      return match ? { label: match[1].replace(/\s+/g, ""), value: match[2].trim() } : null;
    })
    .filter((pair): pair is KvPair => pair !== null);
}

type TimelineEntry = { date: string; desc: string };
function parseTimeline(text: string): TimelineEntry[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const stripped = line.replace(/^○\s*/, "");
      const match = stripped.match(/^([\d][\d.\s~\-–]*\d\.?)\s+(\S.*)$/);
      return match ? { date: match[1].trim(), desc: match[2].trim() } : { date: "", desc: stripped };
    });
}

function Gauge({ percent }: { percent: number }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - percent / 100);
  return (
    <svg width={48} height={48} viewBox="0 0 44 44" className="pd-gauge">
      <circle className="track" cx={22} cy={22} r={r} />
      <circle className="fill" cx={22} cy={22} r={r} style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
    </svg>
  );
}

function KvCards({ pairs }: { pairs: KvPair[] }) {
  if (pairs.length === 0) return <p className="pd-empty text-[15px]">등록된 사업개요 정보가 없습니다.</p>;
  return (
    <div className="pd-kv-row">
      {pairs.map((pair) => (
        <div key={pair.label} className="pd-kv">
          <span className="pd-kv-label">{pair.label}</span>
          <span className="pd-kv-value">{pair.value}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewPanel({ project }: { project: Project }) {
  const pairs = parseKvPairs(project.overview);
  const extra: KvPair[] = [
    { label: "사업분야", value: project.category || "-" },
    { label: "재원구분", value: project.funding_type || "-" },
    { label: "현추진단계", value: project.current_stage || "-" },
  ];
  return (
    <div className="pd-card">
      <p className="pd-card-title">사업개요</p>
      <KvCards pairs={[...pairs, ...extra]} />
    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: Project["funding_breakdown"] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[var(--pd-border)]">
      <div className="border-b border-[var(--pd-border)] bg-white/[0.035] px-4 py-3 text-[13px] font-bold text-[var(--pd-text)]">{title}</div>
      {rows.length === 0 ? <div className="pd-note-box m-3">등록된 세부 예산표가 없습니다.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[12px]"><thead className="bg-black/20 text-[var(--pd-text-faint)]"><tr><th className="px-4 py-3">구분</th><th className="px-4 py-3 text-right">총사업비</th><th className="px-4 py-3 text-right">기투자<br/>(2026년까지)</th><th className="px-4 py-3 text-right">2027년</th><th className="px-4 py-3 text-right">2028년</th><th className="px-4 py-3 text-right">2029년 이후</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name} className="border-t border-[var(--pd-border)]"><td className="px-4 py-3 font-semibold text-[var(--pd-text)]">{row.name}</td>{[row.total, row.invested, row.budget_2027, row.budget_2028, row.budget_2029_plus].map((value, index) => <td key={index} className="px-4 py-3 text-right tabular-nums text-[var(--pd-text-muted)]">{value == null ? "-" : value.toLocaleString("ko-KR")}</td>)}</tr>)}</tbody></table></div>}
    </div>
  );
}

function BudgetPanel({ project }: { project: Project }) {
  const total = project.card_total_budget_million_krw ?? project.total_cost_million_krw;
  const invested = project.card_invested_to_2026_million_krw ?? project.invested_to_2026_million_krw;
  const budget = project.card_budget_2027_million_krw ?? project.budget_2027_million_krw;
  const execution = Math.min(100, Math.max(0, project.card_execution_rate ?? project.execution_rate ?? 0));
  const executionAmount = project.card_execution_amount_million_krw;
  return (
    <div className="pd-card">
      <p className="pd-card-title">예산 현황 <span className="text-[13px] font-normal text-[var(--pd-text-faint)]">(단위: 백만원 · {project.management_card_matched ? "사업별 관리카드" : "총괄표"})</span></p>
      <div className="pd-exec-grid">{[["총사업비", total], ["기투자액 (~2026)", invested], ["2027년 예산", budget], ["집행액", executionAmount]].map(([label, value]) => <div key={label} className="pd-exec-card"><span className="label">{label}</span><span className="num">{value == null ? "-" : value.toLocaleString("ko-KR")}</span></div>)}</div>
      <div className="mt-7"><div className="mb-2 flex justify-between font-body text-[13px] text-[var(--pd-text-faint)]"><span>예산 집행률</span><span>{execution}%</span></div><div className="h-3 rounded-full bg-[#334155]"><div className="h-3 rounded-full bg-[var(--pd-success)]" style={{ width: `${execution}%` }} /></div></div>
      <BreakdownTable title="재원별 예산" rows={project.funding_breakdown} />
      <BreakdownTable title="용도별 예산" rows={project.usage_breakdown} />
      <div className="mt-5 flex flex-wrap gap-3 text-[13px] text-[var(--pd-text-faint)]"><span>재원구분: {project.funding_type || "-"}</span><span>관리카드 점검: {project.card_inspection || "자료 없음"}</span></div>
      {!project.management_card_matched && <p className="pd-note-box mt-4 text-amber-300">해당 사업의 사업별 관리카드가 검색되지 않아 총괄표 기준으로 표시합니다.</p>}
    </div>
  );
}

function ProgressPanel({ project }: { project: Project }) {
  const percent = progressPercent(project);
  const past = parseTimeline(project.future_plan);
  const upcoming = parseTimeline(project.progress_status);
  return (
    <div className="pd-card">
      <div className="mb-6 flex flex-wrap gap-8">
        <div><p className="pd-summary-label !text-[13px]">사업 전체 공정률</p><p className="mt-1 text-[21px] font-bold text-[var(--pd-text)]">{percent}%</p></div>
        <div><p className="pd-summary-label !text-[13px]">추진상황 점검</p><p className="mt-1 text-[15px] font-semibold text-[var(--pd-success)]">{project.delay_reason || "-"}</p></div>
        <div><p className="pd-summary-label !text-[13px]">준공예정일</p><p className="mt-1 text-[15px] font-semibold text-[var(--pd-text)]">{project.inspection || "-"}</p></div>
      </div>
      {past.length > 0 && <><p className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--pd-text-faint)]">추진 경과</p><div className="pd-timeline mb-6"><div className="pd-timeline-line" />{past.map((item, index) => <div key={index} className="pd-t-item"><div className="pd-t-dot" /><div className="pd-t-date">{item.date || "-"}</div><div className="pd-t-desc">{item.desc}</div></div>)}</div></>}
      {(past.length > 0 || upcoming.length > 0) && <div className="pd-t-now"><span className="pd-t-now-label">● 지금</span></div>}
      {upcoming.length > 0 ? <><p className="mb-3 text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--pd-text-faint)]">향후 추진계획</p><div className="pd-timeline"><div className="pd-timeline-line dashed" />{upcoming.map((item, index) => <div key={index} className="pd-t-item future"><div className="pd-t-dot future" /><div className="pd-t-date">{item.date || "-"}</div><div className="pd-t-desc">{item.desc}</div></div>)}</div></> : <div className="pd-note-box">등록된 향후 추진계획 정보가 없습니다.</div>}
    </div>
  );
}

function AdminPanel({ project }: { project: Project }) {
  const status = project.card_admin_status || {};
  const checks = [["중기재정", status.mid_term_fiscal], ["투·융자심사", status.investment_review], ["공유재산", status.public_property], ["해당없음", status.none]] as const;
  return <div className="pd-card"><p className="pd-card-title">사전행정절차 이행여부</p>{project.management_card_matched ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{checks.map(([label, checked]) => <div key={label} className={`rounded-xl border px-4 py-4 ${checked ? "border-[var(--pd-success)]/50 bg-[var(--pd-success)]/10" : "border-[var(--pd-border)] bg-white/[0.02]"}`}><span className="text-[13px] text-[var(--pd-text-muted)]">{checked ? "■" : "□"} {label}</span></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="pd-kv"><span className="pd-kv-label">선택된 절차</span><span className="pd-kv-value">{project.card_admin_procedures || "-"}</span></div><div className="pd-kv"><span className="pd-kv-label">법적근거</span><span className="pd-kv-value">{project.card_admin_legal_basis || "-"}</span></div></div></> : <div className="pd-note-box">해당 사업의 사업별 관리카드가 검색되지 않았습니다.</div>}</div>;
}

function LocationPanel({ project }: { project: Project }) {
  const overviewPairs = parseKvPairs(project.overview);
  const address = overviewPairs.find((pair) => pair.label === "사업위치")?.value;
  return (
    <div className="pd-card">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="pd-map-placeholder">
          <div className="pd-map-pin" />
          <span className="pd-map-caption">지도 연동 예정 · 좌표 데이터 필요</span>
        </div>
        <div className="pd-kv-row" style={{ gridTemplateColumns: "1fr" }}>
          <div className="pd-kv">
            <span className="pd-kv-label">사업위치</span>
            <span className="pd-kv-value">{address ?? "등록된 정보가 없습니다."}</span>
          </div>
          <div className="pd-kv">
            <span className="pd-kv-label">구청</span>
            <span className="pd-kv-value">{project.contact || "-"}</span>
          </div>
          <div className="pd-kv">
            <span className="pd-kv-label">읍면동</span>
            <span className="pd-kv-value">{project.district || "-"}</span>
          </div>
          <div className="pd-kv">
            <span className="pd-kv-label">선거구</span>
            <span className="pd-kv-value">{project.town || "-"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = ["사업개요", "예산현황", "추진현황", "사전행정절차", "위치정보"] as const;

function ProjectDetail({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("사업개요");
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab("사업개요");
  }, [project.id]);

  useEffect(() => {
    const moveIndicator = () => {
      const btn = tabsRef.current?.querySelector<HTMLButtonElement>(`[data-tab="${activeTab}"]`);
      if (!btn || !indicatorRef.current) return;
      indicatorRef.current.style.width = `${btn.offsetWidth}px`;
      indicatorRef.current.style.transform = `translateX(${btn.offsetLeft - 5}px)`;
    };
    moveIndicator();
    window.addEventListener("resize", moveIndicator);
    return () => window.removeEventListener("resize", moveIndicator);
  }, [activeTab]);

  const percent = progressPercent(project);
  const overviewPairs = parseKvPairs(project.overview);

  return (
    <section className="relative p-6 lg:p-10">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="pdRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4c7cff" />
            <stop offset="100%" stopColor="#9a5cf5" />
          </linearGradient>
        </defs>
      </svg>

      <h1 className="max-w-4xl font-display text-2xl font-bold leading-[1.15] tracking-[-0.045em] text-white lg:text-4xl">
        {project.project_name}
      </h1>

      <section className="pd-summary mt-8" aria-label="사업 요약">
        <div className="pd-summary-cell">
          <span className="pd-summary-label">사업구분 · 진행상태</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pd-pill pd-pill-new">{project.region || "-"}</span>
            <span className="pd-pill pd-pill-tag">{project.current_stage || "-"}</span>
          </div>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label">총사업비</span>
          <span className="pd-summary-value grad">
            {project.total_cost_million_krw?.toLocaleString("ko-KR") ?? "-"}
            <small style={{ fontSize: 14, fontWeight: 700, background: "none", WebkitTextFillColor: "var(--pd-text-muted)", color: "var(--pd-text-muted)" }}> 백만원</small>
          </span>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label">사업 전체 공정률</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge percent={percent} />
            <span className="pd-summary-value grad">{percent}%</span>
          </div>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label">예산 집행률</span>
          <span className="pd-summary-value">{project.execution_rate ?? 0}%</span>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label">준공예정일</span>
          <span className="pd-summary-value" style={{ fontSize: 18 }}>{project.inspection || "-"}</span>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label">위치</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[project.contact, project.district, project.town].filter(Boolean).map((tag) => (
              <span key={tag} className="pd-pill pd-pill-tag">{tag}</span>
            ))}
            {!project.contact && !project.district && !project.town && <span className="pd-empty text-[14px]">-</span>}
          </div>
        </div>
      </section>

      <div className="pd-tabs" ref={tabsRef} role="tablist" aria-label="사업 상세 탭">
        <div className="pd-tab-indicator" ref={indicatorRef} />
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            data-tab={tab}
            className={`pd-tab-btn ${activeTab === tab ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "사업개요" && <OverviewPanel project={project} />}
        {activeTab === "예산현황" && <BudgetPanel project={project} />}
        {activeTab === "추진현황" && <ProgressPanel project={project} />}
        {activeTab === "사전행정절차" && <AdminPanel project={project} />}
        {activeTab === "위치정보" && <LocationPanel project={project} />}
      </div>
      {overviewPairs.length === 0 && activeTab === "사업개요" && null}
    </section>
  );
}

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [openBureaus, setOpenBureaus] = useState<string[]>(organization.map((item) => item.name));
  const [openDepartments, setOpenDepartments] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrganization = useMemo(
    () =>
      organization
        .map((bureau) => ({
          ...bureau,
          departments: bureau.departments
            .map((department) => ({
              ...department,
              projects: department.projects.filter((project) =>
                `${project.project_name} ${project.department} ${project.category}`.toLowerCase().includes(normalizedQuery),
              ),
            }))
            .filter((department) => department.projects.length > 0),
        }))
        .filter((bureau) => bureau.departments.length > 0),
    [normalizedQuery],
  );

  const totalCost = projects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const toggle = (items: string[], setter: (value: string[]) => void, item: string) =>
    setter(items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);

  return (
    <div className="min-h-screen bg-[var(--pd-ground)]/85 text-white">
      {isSidebarOpen && (
        <button aria-label="사이드바 닫기" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#07090f] via-[#0e1220] to-[#030409] transition-all duration-200 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "w-[76px]" : "w-[320px]"}`}
      >
        <div className={`flex min-h-[92px] items-center border-b border-white/[0.08] bg-black/20 ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>
          {!isCollapsed && (
            <div>
              <p className="font-display text-[24px] font-bold leading-[1.05] tracking-[-0.055em] text-white">화성시 주요투자사업</p>
              <p className="mt-1 font-body text-[11px] font-semibold tracking-[0.14em] text-[var(--pd-text-muted)]">INVESTMENT DASHBOARD</p>
            </div>
          )}
          <button
            className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--pd-text-muted)] hover:bg-white/[0.08] hover:text-white lg:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
          >
            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
        <nav className="pd-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 pb-5">
          {visibleOrganization.map((bureau) => {
            const bureauOpen = openBureaus.includes(bureau.name);
            return (
              <div key={bureau.name} className="mb-2">
                <button
                  className={`flex w-full items-center rounded-xl border px-3 py-2.5 text-left hover:brightness-125 ${bureau.name === "문화관광국" ? "border-[#2a4f73]/60 bg-[#122033]/70" : "border-[#4d3f6b]/60 bg-[#211834]/60"} ${isCollapsed ? "justify-center" : "gap-2"}`}
                  onClick={() => toggle(openBureaus, setOpenBureaus, bureau.name)}
                  title={isCollapsed ? bureau.name : undefined}
                >
                  {bureau.name === "문화관광국" ? <Building2 size={17} className="text-[#8ab4d8]" /> : <GraduationCap size={18} className="text-[#b49add]" />}
                  {bureauOpen ? <ChevronDown size={15} className="text-[var(--pd-text-muted)]" /> : <ChevronRight size={15} className="text-[var(--pd-text-muted)]" />}
                  {!isCollapsed && <span className="font-body text-[17px] font-extrabold tracking-[-0.04em] text-white">{bureau.name}</span>}
                </button>
                {bureauOpen && !isCollapsed && (
                  <div className="ml-3 border-l border-[#475569] pl-3">
                    {bureau.departments.map((department) => {
                      const key = `${bureau.name}-${department.name}`;
                      const departmentOpen = openDepartments.includes(key);
                      return (
                        <div key={department.name}>
                          <button
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[#334155]"
                            onClick={() => toggle(openDepartments, setOpenDepartments, key)}
                          >
                            {departmentOpen ? <ChevronDown size={14} className="text-[var(--pd-text-muted)]" /> : <ChevronRight size={14} className="text-[var(--pd-text-muted)]" />}
                            <span className="font-body text-[15px] font-bold text-[var(--pd-text-muted)]">{department.name}</span>
                            <span className="ml-auto font-body text-[11px] tabular-nums text-[var(--pd-text-faint)]">{department.projects.length}</span>
                          </button>
                          {departmentOpen && (
                            <div className="ml-3 border-l border-[#334155] pl-3 pb-1">
                              {department.projects.map((project) => (
                                <button
                                  key={project.id}
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setIsSidebarOpen(false);
                                  }}
                                  className={`mb-0.5 flex w-full items-start rounded-lg px-2.5 py-1.5 text-left ${selectedProject?.id === project.id ? "bg-[var(--pd-accent-wash)] text-white" : "text-[var(--pd-text-muted)] hover:bg-[#334155] hover:text-white"}`}
                                  style={selectedProject?.id === project.id ? { borderLeft: "2px solid var(--pd-accent-a)" } : undefined}
                                >
                                  <span className="mr-2 mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pd-text-faint)]" />
                                  <span className="font-body text-[14.5px] leading-[1.35]">{project.project_name}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {!isCollapsed && (
          <div className="border-t border-white/[0.08] px-5 pb-3 pt-3">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--pd-text-muted)]" size={16} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="사업명·부서·분야 검색"
                className="h-10 w-full rounded-xl border border-[#475569] bg-[#0f172a] pl-10 pr-3 font-body text-[14px] text-white outline-none placeholder:text-[var(--pd-text-faint)] focus:border-[#60a5fa]"
              />
            </label>
          </div>
        )}
      </aside>

      <div className={`min-h-screen transition-all duration-200 ${isCollapsed ? "lg:pl-[76px]" : "lg:pl-[320px]"}`}>
        <header className="flex h-[72px] items-center justify-between border-b border-white/[0.08] bg-[var(--pd-ground)]/80 px-5 backdrop-blur lg:px-9">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.06] text-white lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="사이드바 열기"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="relative min-h-[calc(100vh-72px)] overflow-hidden">
          <div className="pointer-events-none absolute right-[8%] top-[-8%] h-[520px] w-[170px] rotate-[24deg] rounded-full bg-[var(--pd-accent-a)]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8%] right-[17%] h-[440px] w-[145px] -rotate-[28deg] rounded-full bg-[var(--pd-accent-b)]/25 blur-3xl" />
          {selectedProject ? (
            <ProjectDetail project={selectedProject} />
          ) : (
            <section className="relative p-6 lg:p-10">
              <p className="font-body text-xs font-semibold tracking-[0.12em] text-[#93c5fd]">2027년도 주요 투자사업 추진현황</p>
              <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-[-0.05em] text-white lg:text-5xl">
                부서와 사업을 선택해
                <br />
                상세 현황을 확인하세요.
              </h1>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["전체 사업", dataset.project_count],
                  ["담당 부서", dataset.department_count],
                  ["총사업비", money(totalCost)],
                ].map(([label, value]) => (
                  <div key={label} className="pd-summary-cell" style={{ borderRadius: 16, border: "1px solid var(--pd-border-soft)" }}>
                    <span className="pd-summary-label">{label}</span>
                    <span className="pd-summary-value">{value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {isSidebarOpen && (
        <button className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-[#1e293b] text-white shadow-md lg:hidden" onClick={() => setIsSidebarOpen(false)} aria-label="사이드바 닫기">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
