import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Activity,
  Building2,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  Coins,
  GraduationCap,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  
  Tag,
  TrendingUp,
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
  card_invested_to_2025_million_krw: number | null;
  card_invested_to_2026_million_krw: number | null;
  card_budget_2026_million_krw: number | null;
  card_budget_2026_base_million_krw: number | null;
  card_budget_2026_first_extra_million_krw: number | null;
  card_budget_2026_second_extra_million_krw: number | null;
  card_budget_2026_third_extra_million_krw: number | null;
  card_budget_2026_additional_million_krw: number | null;
  card_budget_2027_million_krw: number | null;
  card_budget_2028_plus_million_krw: number | null;
  card_execution_budget_million_krw: number | null;
  card_execution_amount_million_krw: number | null;
  card_execution_rate: number | null;
  card_inspection: string;
  funding_breakdown: { name: string; total: number | null; invested: number | null; budget_2026: number | null; budget_2027: number | null; budget_2028_plus: number | null; budget_2026_base?: number | null; budget_2026_first_extra?: number | null; budget_2026_second_extra?: number | null; budget_2026_third_extra?: number | null; budget_2026_additional?: number | null }[];
  usage_breakdown: { name: string; total: number | null; invested: number | null; budget_2026: number | null; budget_2027: number | null; budget_2028_plus: number | null; budget_2026_base?: number | null; budget_2026_first_extra?: number | null; budget_2026_second_extra?: number | null; budget_2026_third_extra?: number | null; budget_2026_additional?: number | null }[];
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

// 부서별 시그니처 컬러 — my-dashboard(공기관 예산통합)의 dept-culture/library/tour/temp 팔레트를 이 프로젝트 부서 구성에 맞게 확장.
const DEPARTMENT_COLOR: Record<string, { from: string; to: string }> = {
  문화예술과: { from: "#5B84FF", to: "#8aa4ff" },
  문화유산과: { from: "#d9a441", to: "#f0c168" },
  독립기념관: { from: "#e0616f", to: "#f28a95" },
  관광진흥과: { from: "#2fb8c4", to: "#5cd6e0" },
  도서관정책과: { from: "#48BB78", to: "#6fd99a" },
  체육진흥과: { from: "#F6AD55", to: "#ffc57a" },
  전국체전추진단: { from: "#9B6BD6", to: "#b98cef" },
};
const DEFAULT_COLOR = { from: "#4c7cff", to: "#9a5cf5" };
const colorFor = (department: string) => DEPARTMENT_COLOR[department] ?? DEFAULT_COLOR;

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
      <circle
        className="fill"
        cx={22}
        cy={22}
        r={r}
        style={{ strokeDasharray: circumference, ["--pd-gauge-offset" as string]: offset } as CSSProperties}
      />
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
    { label: "현추진단계", value: project.current_stage || "-" },
  ];

  return (
        <div className="pd-card">
      <KvCards pairs={[...pairs, ...extra]} />

    </div>
  );
}

function BreakdownTable({ title, rows }: { title: string; rows: Project["funding_breakdown"] }) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-[var(--pd-border)]">
      <div className="border-b border-[var(--pd-border)] bg-white/[0.035] px-4 py-3 text-[13px] font-bold text-[var(--pd-text)]">{title}</div>
      {rows.length === 0 ? <div className="pd-note-box m-3">등록된 세부 예산표가 없습니다.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[12px]"><thead className="bg-black/20 text-[var(--pd-text-faint)]"><tr><th className="px-4 py-3">구분</th><th className="px-4 py-3 text-right">총사업비</th><th className="px-4 py-3 text-right">기투자<br/>(2025년까지)</th><th className="px-4 py-3 text-right">2026년</th><th className="px-4 py-3 text-right">2027년</th><th className="px-4 py-3 text-right">2028년 이후</th></tr></thead><tbody>{rows.map((row) => <tr key={row.name} className="border-t border-[var(--pd-border)]"><td className="px-4 py-3 font-semibold text-[var(--pd-text)]">{row.name}</td>{[row.total, row.invested, row.budget_2026, row.budget_2027, row.budget_2028_plus].map((value, index) => <td key={index} className="px-4 py-3 text-right tabular-nums text-[var(--pd-text-muted)]">{value == null ? "-" : value.toLocaleString("ko-KR")}</td>)}</tr>)}</tbody></table></div>}
    </div>
  );
}

function BudgetPanel({ project }: { project: Project }) {
  const total = project.card_total_budget_million_krw ?? project.total_cost_million_krw;
  const invested = project.card_invested_to_2025_million_krw ?? project.card_invested_to_2026_million_krw ?? project.invested_to_2026_million_krw;
  const budget = project.card_budget_2026_million_krw ?? project.budget_2027_million_krw;
  const execution = Math.min(100, Math.max(0, project.card_execution_rate ?? project.execution_rate ?? 0));
  const executionAmount = project.card_execution_amount_million_krw;
  return (
    <div className="pd-card">
      <p className="pd-card-title">예산 현황 <span className="text-[13px] font-normal text-[var(--pd-text-faint)]">(단위: 백만원 · {project.management_card_matched ? "사업별 관리카드" : "총괄표"})</span></p>
      <div className="pd-exec-grid">{[["총사업비", total], ["기투자액 (~2025)", invested], ["2026년 예산", budget], ["집행액", executionAmount]].map(([label, value]) => <div key={label} className="pd-exec-card"><span className="label">{label}</span><span className="num">{value == null ? "-" : value.toLocaleString("ko-KR")}</span></div>)}</div>
      <div className="mt-7">
        <div className="mb-2 flex justify-between font-body text-[13px] text-[var(--pd-text-faint)]">
          <span>예산 집행률</span>
          <span>{execution}%</span>
        </div>
        <div className="h-3 rounded-full bg-[#334155]">
          <div
            key={project.id}
            className="pd-bar-fill h-3 rounded-full bg-[var(--pd-success)]"
            style={{ ["--pd-bar-width" as string]: `${execution}%` } as CSSProperties}
          />
        </div>
      </div>
      <BreakdownTable title="재원별 예산" rows={project.funding_breakdown} />
      <BreakdownTable title="용도별 예산" rows={project.usage_breakdown} />
      <div className="mt-5 flex flex-wrap gap-3 text-[13px] text-[var(--pd-text-faint)]"><span>재원구분: {project.funding_type || "-"}</span><span>관리카드 점검: {project.card_inspection || "자료 없음"}</span></div>
      {!project.management_card_matched && <p className="pd-note-box mt-4 text-amber-300">해당 사업의 사업별 관리카드가 검색되지 않아 총괄표 기준으로 표시합니다.</p>}
    </div>
  );
}

function ProgressPanel({ project }: { project: Project }) {
  const percent = progressPercent(project);
  const past = parseTimeline(project.progress_status);
  const upcoming = parseTimeline(project.future_plan);
  return (
    <div className="pd-card">
      <div className="mb-6 flex flex-wrap gap-8">
        <div><p className="pd-summary-label !text-[13px]">사업 전체 공정률</p><p className="mt-1 text-[21px] font-bold text-[var(--pd-text)]">{percent}%</p></div>
        <div><p className="pd-summary-label !text-[13px]">추진상황 점검</p><p className="mt-1 text-[15px] font-semibold text-[var(--pd-success)]">{project.delay_reason || "-"}</p></div>
        <div><p className="pd-summary-label !text-[13px]">준공예정일</p><p className="mt-1 text-[15px] font-semibold text-[var(--pd-text)]">{project.inspection || "-"}</p></div>
      </div>
            <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-[var(--pd-border)] bg-black/10 p-4 sm:p-5">
          <p className="mb-4 text-[13px] font-bold tracking-[0.04em] text-[var(--pd-text)]">추진경과</p>
          {past.length > 0 ? <div className="pd-timeline"><div className="pd-timeline-line" />{past.map((item, index) => <div key={index} className="pd-t-item"><div className="pd-t-dot" /><div className="pd-t-date">{item.date || "-"}</div><div className="pd-t-desc">{item.desc}</div></div>)}</div> : <div className="pd-note-box">등록된 추진현황이 없습니다.</div>}
        </section>
        <section className="rounded-xl border border-[var(--pd-border)] bg-black/10 p-4 sm:p-5">
          <p className="mb-4 text-[13px] font-bold tracking-[0.04em] text-[var(--pd-text)]">향후 추진계획</p>
          {upcoming.length > 0 ? <div className="pd-timeline"><div className="pd-timeline-line dashed" />{upcoming.map((item, index) => <div key={index} className="pd-t-item future"><div className="pd-t-dot future" /><div className="pd-t-date">{item.date || "-"}</div><div className="pd-t-desc">{item.desc}</div></div>)}</div> : <div className="pd-note-box">등록된 향후 추진계획 정보가 없습니다.</div>}
        </section>
      </div>

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
    const alignIndicator = () => {
      const label = tabsRef.current?.querySelector<HTMLLabelElement>('label[aria-selected="true"]');
      if (!label || !indicatorRef.current) return;
      indicatorRef.current.style.width = `${label.offsetWidth}px`;
      indicatorRef.current.style.transform = `translateX(${label.offsetLeft}px)`;
    };
    alignIndicator();
    window.addEventListener("resize", alignIndicator);
    return () => window.removeEventListener("resize", alignIndicator);
  }, [activeTab]);

  

  const percent = progressPercent(project);
  const overviewPairs = parseKvPairs(project.overview);
  const color = colorFor(project.department);
  const themeVars = { ["--pd-accent-a" as string]: color.from, ["--pd-accent-b" as string]: color.to } as CSSProperties;

  return (
    <section className="relative p-6 lg:p-10" style={themeVars}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="pdRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "var(--pd-accent-a)" }} />
            <stop offset="100%" style={{ stopColor: "var(--pd-accent-b)" }} />
          </linearGradient>
        </defs>
      </svg>

      <h1 className="max-w-4xl font-display text-2xl font-bold leading-[1.15] tracking-[-0.045em] text-white lg:text-4xl">
        {project.project_name}
      </h1>

      <section className="pd-summary mt-8" aria-label="사업 요약">
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><Tag /> 사업구분 · 진행상태</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pd-pill pd-pill-new">{project.region || "-"}</span>
            <span className="pd-pill pd-pill-tag">{project.current_stage || "-"}</span>
          </div>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label"><Coins /> 총사업비</span>
          <span className="pd-summary-value grad">
            {project.total_cost_million_krw?.toLocaleString("ko-KR") ?? "-"}
            <small style={{ fontSize: 14, fontWeight: 700, background: "none", WebkitTextFillColor: "var(--pd-text-muted)", color: "var(--pd-text-muted)" }}> 백만원</small>
          </span>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label"><Activity /> 사업 전체 공정률</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge key={project.id} percent={percent} />
            <span className="pd-summary-value grad">{percent}%</span>
          </div>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><TrendingUp /> 예산 집행률</span>
          <span className="pd-summary-value">{project.execution_rate ?? 0}%</span>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><CalendarCheck /> 준공예정일</span>
          <span className="pd-summary-value" style={{ fontSize: 18 }}>{project.inspection || "-"}</span>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><MapPin /> 위치</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[project.contact, project.district, project.town].filter(Boolean).map((tag) => (
              <span key={tag} className="pd-pill pd-pill-tag">{tag}</span>
            ))}
            {!project.contact && !project.district && !project.town && <span className="pd-empty text-[14px]">-</span>}
          </div>
        </div>
      </section>

      <div ref={tabsRef} className="pill-radio-container pd-pill-tabs" role="tablist" aria-label="사업 상세 탭">
        {TABS.map((tab, index) => {
          const inputId = `detail-tab-${project.id}-${index}`;
          return (
            <span key={tab} className="pill-tab-option">
              <input id={inputId} name={`detail-tab-${project.id}`} type="radio" checked={activeTab === tab} onChange={() => setActiveTab(tab)} />
              <label htmlFor={inputId} role="tab" aria-selected={activeTab === tab}>{tab}</label>
            </span>
          );
        })}
        <div ref={indicatorRef} className="pill-indicator" aria-hidden="true" />
      </div>

      <div key={`${project.id}-${activeTab}`} className="pd-panel-fade">
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

function PodaSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="poda-search">
      <div className="poda-search-glow" />
      <div className="poda-search-dark" />
      <div className="poda-search-dark" />
      <div className="poda-search-white" />
      <div className="poda-search-border" />
      <div className="poda-search-main">
        <input value={value} onChange={(event) => onChange(event.target.value)} placeholder="검색" type="text" className="poda-search-input" aria-label="사업명·부서·분야 검색" />
        <div className="poda-search-mask" />
        <div className="poda-search-pink" />
        <div className="poda-search-filter-border" />
        <div className="poda-search-filter" aria-hidden="true"><svg viewBox="4.8 4.56 14.832 15.408" fill="none"><path d="M8.16 6.65h7.67c.64 0 1.16.52 1.16 1.16v1.28c0 .47-.29 1.05-.58 1.34l-2.5 2.21c-.35.29-.58.87-.58 1.34v2.5c0 .35-.23.81-.52.99l-.81.51c-.76.47-1.8-.06-1.8-.99v-3.08c0-.41-.23-.93-.47-1.22L7.52 10.36C7.23 10.08 7 9.55 7 9.2V7.87c0-.7.52-1.22 1.16-1.22Z" stroke="#d6d6e6" strokeWidth="1" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" /></svg></div>
        <div className="poda-search-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle stroke="url(#poda-search-gradient)" r="8" cy="11" cx="11" /><line stroke="url(#poda-search-gradient-line)" y2="16.65" y1="22" x2="16.65" x1="22" /><defs><linearGradient id="poda-search-gradient" gradientTransform="rotate(50)"><stop stopColor="#d8e5ea" offset="0%" /><stop stopColor="#8ca9b7" offset="50%" /></linearGradient><linearGradient id="poda-search-gradient-line"><stop stopColor="#8ca9b7" offset="0%" /><stop stopColor="#5c7480" offset="50%" /></linearGradient></defs></svg></div>
      </div>
    </div>
  );
}

function LandingPage({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  return (
    <section className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#060914] text-white">
      <div className="landing-orb landing-orb-a" />
      <div className="landing-orb landing-orb-b" />
      <div className="landing-orb landing-orb-c" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_36%,rgba(0,0,0,0.42))]" />
      <div className="relative flex min-h-[calc(100vh-72px)] flex-col px-6 pb-12 pt-6 sm:px-10 lg:px-16 lg:pt-8">
        <div className="flex flex-1 -translate-y-[20vh] flex-col items-center justify-center py-4 text-center">
          <p className="mb-3 whitespace-nowrap font-body text-[clamp(1rem,2vw,1.45rem)] font-semibold tracking-[0.34em] text-white/70">HWASEONG SPECIAL CITY</p>
          <h1 className="max-w-5xl font-display text-[clamp(1.55rem,3.2vw,3rem)] font-black uppercase leading-[1.02] tracking-[-0.06em] text-white drop-shadow-[0_10px_35px_rgba(0,0,0,0.25)]">MAJOR<br />INVESTMENT</h1>
          <button type="button" onClick={onOpenDashboard} className="landing-status-button relative z-10 mt-5 rounded-full border border-white/25 bg-white/10 px-5 py-2.5 text-[14px] font-semibold text-white backdrop-blur" aria-label="주요투자사업 현황 열기">주요투자사업 현황</button>
        </div>
      </div>
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
                <div className={`flex min-h-[104px] items-end border-b border-white/[0.08] bg-black/20 pb-3 ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>

          {!isCollapsed && (
            <button
              type="button"
              className="text-left"
              onClick={() => {
                setSelectedProject(null);
                setIsSidebarOpen(false);
              }}
            >
              <p className="font-display text-[24px] font-bold leading-[1.05] tracking-[-0.055em] text-white">화성시 주요투자사업</p>
              <p className="mt-1 font-body text-[11px] font-semibold tracking-[0.14em] text-[var(--pd-text-muted)]">INVESTMENT DASHBOARD</p>
            </button>
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
                                    <div className="ml-1 pl-0">
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
                                                        <div className="ml-0 pl-0 pb-1">

                              {department.projects.map((project) => {
                                const isSelected = selectedProject?.id === project.id;
                                const color = colorFor(project.department);
                                return (
                                  <button
                                    key={project.id}
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setIsSidebarOpen(false);
                                    }}
                                                                        className={`relative mb-0.5 flex min-w-0 w-full items-start rounded-lg py-1.5 pl-11 pr-1 text-left ${isSelected ? "text-white" : "text-[var(--pd-text-muted)] hover:bg-[#334155] hover:text-white"}`}

                                    style={isSelected ? { background: `${color.from}26`, borderLeft: `2px solid ${color.from}` } : undefined}
                                  >
                                    <span
                                                                            className="absolute left-8 top-[13px] h-1.5 w-1.5 rounded-full"

                                      style={{ background: isSelected ? color.from : "var(--pd-text-faint)" }}
                                    />
                                                                        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-body text-[13.5px] leading-[1.35]">{project.project_name}</span>

                                  </button>
                                );
                              })}
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
        {!isCollapsed && (
          <div className="mt-3 border-t border-white/[0.08] px-3 pt-2 pb-1">
            <PodaSearch value={query} onChange={setQuery} />
          </div>
        )}
      </nav>
      </aside>

      <div className={`flex min-h-screen flex-col transition-all duration-200 ${isCollapsed ? "lg:pl-[76px]" : "lg:pl-[320px]"}`}>
        <header className="flex h-[72px] flex-none items-center border-b border-white/[0.08] bg-[var(--pd-ground)]/80 px-5 backdrop-blur lg:hidden">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.06] text-white"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="사이드바 열기"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute right-[8%] top-[-8%] h-[520px] w-[170px] rotate-[24deg] rounded-full bg-[var(--pd-accent-a)]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8%] right-[17%] h-[440px] w-[145px] -rotate-[28deg] rounded-full bg-[var(--pd-accent-b)]/25 blur-3xl" />
                    {selectedProject ? <ProjectDetail project={selectedProject} /> : <LandingPage onOpenDashboard={() => setSelectedProject(projects[0] ?? null)} />}

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
