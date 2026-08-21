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
  Search,
  RefreshCw,
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
  carryover_million_krw?: number | null;
  carryover_type?: string;
  carryover_items?: { label: string; type: string; amount_million_krw: number }[];
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
function formatDateText(text: string): string {
  return text
    .replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g, (_, year, month, day) => `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}.`)
    .replace(/(\d{4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})\.?/g, (_, year, month, day) => `${year}.${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}.`)
    .replace(/(\d{4})년\s*(\d{1,2})월/g, (_, year, month) => `${year}.${String(month).padStart(2, "0")}.`)
    .replace(/(\d{4})[.\-/]\s*(\d{1,2})\.?/g, (_, year, month) => `${year}.${String(month).padStart(2, "0")}.`)
    .replace(/(\d{4})년/g, "$1.");
}
function parseKvPairs(text: string): KvPair[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^○\s*([^:：]+?)\s*[:：]\s*(.+)$/);
      return match ? { label: match[1].replace(/\s+/g, ""), value: formatDateText(match[2].trim()) } : null;
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
      return match ? { date: formatDateText(match[1].trim()), desc: match[2].trim() } : { date: "", desc: stripped };
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
  const removeContentCard = project.project_name.trim() === "농수산대학 유휴부지 공연장 건립";
  const pairs = parseKvPairs(project.overview).filter((pair) => !removeContentCard || pair.label.trim() !== "사업내용");
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

type BreakdownRow = Project["funding_breakdown"][number];
type BudgetYearKey = "budget_2026" | "budget_2027" | "budget_2028_plus";

function sumBreakdown(rows: BreakdownRow[], key: keyof BreakdownRow) {
  return rows.reduce((sum, row) => sum + ((row[key] as number | null | undefined) ?? 0), 0);
}

function FundingBreakdownCard({ rows }: { rows: BreakdownRow[] }) {
  const totalBudget = sumBreakdown(rows, "total");
  const columns: { key: keyof BreakdownRow; label: string }[] = [
    { key: "total", label: "재원별 총예산" },
    { key: "invested", label: "기투자" },
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "이후" },
  ];
  return <div className="pd-budget-panel"><div className="pd-budget-panel-heading"><div><span className="pd-budget-panel-kicker">01</span><h3>재원별 예산</h3></div><span className="pd-budget-panel-caption">총사업비 {formatMillion(totalBudget || null)}</span></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-funding-table-wrap"><table className="pd-funding-table"><thead><tr><th>구분</th>{columns.map((column) => <th key={String(column.key)}>{column.label}</th>)}</tr></thead><tbody><tr className="is-total"><th>총사업비</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(sumBreakdown(rows, column.key))}</td>)}</tr>{rows.map((row) => <tr key={row.name}><th>{row.name}</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(row[column.key] as number | null | undefined)}</td>)}</tr>)}</tbody></table></div>}</div>;
}

const usageColors = ["#e5542d", "#58c7b1", "#6f8cff", "#9a7bdb", "#6b7280"];
const usageColorNames = ["공사", "감리", "설계", "부대", "기타"];

function UsageBreakdownChart({ rows }: { rows: BreakdownRow[] }) {
  const years: { key: BudgetYearKey; label: string }[] = [
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "2028년 이후" },
  ];
  const [selectedYear, setSelectedYear] = useState<BudgetYearKey>("budget_2026");
  const selectedLabel = years.find((year) => year.key === selectedYear)?.label ?? "2026년";
  const selectedTotal = sumBreakdown(rows, selectedYear);
  const usageTotal = sumBreakdown(rows, "total");
  const selectedShare = usageTotal > 0 ? (selectedTotal / usageTotal) * 100 : 0;
  const yearTotals = years.map((year) => sumBreakdown(rows, year.key));
  const flowValues = [sumBreakdown(rows, "invested"), ...yearTotals];
  const maxFlowValue = Math.max(...flowValues, 1);
  const flowX = (index: number) => 15 + index * (290 / (flowValues.length - 1));
  const points = flowValues.map((value, index) => `${flowX(index)},${84 - (value / maxFlowValue) * 66}`).join(" ");
  const usageRows = rows.map((row) => ({ row, value: (row[selectedYear] as number | null | undefined) ?? 0 })).sort((a, b) => b.value - a.value);
  const usageColorFor = (name: string) => usageColors[Math.max(0, usageColorNames.indexOf(name)) % usageColors.length];
  return <div className="pd-budget-panel pd-usage-panel"><div className="pd-budget-panel-heading"><div><span className="pd-budget-panel-kicker">02</span><h3>용도별 예산</h3></div><span className="pd-budget-panel-caption">연도별 배분</span></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-pulse-content"><div className="pd-year-switcher" role="tablist" aria-label="예산 연도 선택">{years.map((year) => <button key={year.key} type="button" className={selectedYear === year.key ? "is-active" : ""} onClick={() => setSelectedYear(year.key)}>{year.label}</button>)}</div><div className="pd-pulse-summary"><div><span className="pd-pulse-eyebrow">{selectedLabel} 편성 예산</span><strong>{formatMillion(selectedTotal || null)}</strong><span className="pd-pulse-positive">전체 사업비의 {selectedShare.toFixed(1)}%</span></div><div className="pd-pulse-donut" style={{ background: `conic-gradient(#e5542d ${selectedShare}%, rgba(255,255,255,.1) 0)` }}><span>{selectedShare.toFixed(0)}%</span><small>전체</small></div></div><div className="pd-pulse-trend"><div className="pd-pulse-section-label"><span>연도별 예산 흐름</span><small>기투자 → 이후</small></div><svg viewBox="0 0 320 100" role="img" aria-label="연도별 예산 흐름"><defs><linearGradient id="budgetArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e5542d" stopOpacity=".28" /><stop offset="100%" stopColor="#e5542d" stopOpacity="0" /></linearGradient></defs><polygon points={`15,84 ${points} 305,84`} fill="url(#budgetArea)" /><polyline points={points} fill="none" stroke="#e5542d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{flowValues.map((value, index) => <circle key={`flow-${index}`} cx={flowX(index)} cy={84 - (value / maxFlowValue) * 66} r="4.5" fill="#fff" stroke="#e5542d" strokeWidth="3" />)}</svg><div className="pd-pulse-axis"><span>기투자</span><span>2026년</span><span>2027년</span><span>이후</span></div></div><div className="pd-usage-progress-list">{usageRows.map(({ row, value }) => { const share = selectedTotal > 0 ? (value / selectedTotal) * 100 : 0; return <div className="pd-usage-progress-row" key={row.name}><div className="pd-usage-progress-label"><span>{row.name}</span><b>{formatMillion(value || null)}</b><strong>{share.toFixed(0)}%</strong></div><div className="pd-usage-progress-track"><span style={{ width: `${share}%`, background: usageColorFor(row.name) }} /></div></div>; })}</div><div className="pd-usage-legend">{usageColorNames.map((name, index) => <span key={name}><i style={{ background: usageColors[index] }} />{name}</span>)}</div></div>}</div>;
}

function formatMillion(value: number | null | undefined) {
  return value == null ? "-" : `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })} 백만원`;
}

function BudgetPanel({ project }: { project: Project }) {
  const total = project.card_total_budget_million_krw ?? project.total_cost_million_krw;
  const invested = project.card_invested_to_2025_million_krw ?? project.card_invested_to_2026_million_krw ?? project.invested_to_2026_million_krw;
  const budget = project.card_budget_2026_million_krw ?? project.budget_2027_million_krw;
  const execution = Math.min(100, Math.max(0, project.card_execution_rate ?? project.execution_rate ?? 0));
  const executionAmount = project.card_execution_amount_million_krw;
  const carryoverItems = project.carryover_items?.length
    ? project.carryover_items
    : project.carryover_million_krw != null
      ? [{ label: project.project_name, type: project.carryover_type ?? "이월", amount_million_krw: project.carryover_million_krw }]
      : [];
  const carryoverTotal = carryoverItems.length ? carryoverItems.reduce((sum, item) => sum + item.amount_million_krw, 0) : null;
  const carryoverLabel = carryoverItems.length === 1 ? `이월액 · ${carryoverItems[0].type}` : "이월액";
  const budgetCards = [
    { label: "총사업비", value: total, icon: Coins, tone: "violet", carryoverItems: undefined },
    { label: "기투자액 (~2025)", value: invested, icon: TrendingUp, tone: "teal", carryoverItems: undefined },
    { label: "2026년 예산", value: budget, icon: CalendarCheck, tone: "amber", carryoverItems: undefined },
    { label: carryoverLabel, value: carryoverTotal, icon: RefreshCw, tone: "rose", carryoverItems },
    { label: "집행액", value: executionAmount, icon: Activity, tone: "blue", carryoverItems: undefined },
  ] as const;
  return (
    <div className="pd-card">
      <div className="pd-exec-grid">{budgetCards.map(({ label, value, icon: Icon, tone, carryoverItems: items }, index) => <div key={label} className={`pd-exec-card pd-exec-card-${tone} ${index === 0 ? "is-primary" : ""}`}><div className="pd-exec-card-top"><span className="pd-exec-icon"><Icon size={17} strokeWidth={2.2} /></span><span className="label">{label}</span></div><span className="num">{formatMillion(value)}</span>{items && items.length > 1 && <div className="pd-carryover-list">{items.map((item) => <span key={`${item.label}-${item.type}`}><b>{item.type}</b> {formatMillion(item.amount_million_krw)}</span>)}</div>}<span className="pd-exec-card-glow" aria-hidden="true" /></div>)}</div>
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
      <div className="pd-budget-breakdown-grid"><FundingBreakdownCard rows={project.funding_breakdown} /><UsageBreakdownChart rows={project.usage_breakdown} /></div>
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
        <div><p className="pd-summary-label !text-[13px]">준공예정일</p><p className="mt-1 text-[15px] font-semibold text-[var(--pd-text)]">{formatDateText(project.inspection || "-")}</p></div>
      </div>
      <div className="pd-progress-layout">
        <section className="pd-progress-section pd-progress-vertical">
          <div className="pd-progress-heading"><span className="pd-progress-kicker is-muted">01</span><div><p className="pd-progress-title">추진경과</p><p className="pd-progress-subtitle">지금까지 진행된 주요 단계</p></div></div>
          {past.length > 0 ? <div className="pd-progress-vertical-list">{past.map((item, index) => <div key={index} className={`pd-progress-vertical-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{item.desc}</div></div></div>)}</div> : <div className="pd-note-box">등록된 추진현황이 없습니다.</div>}
        </section>
        <section className="pd-progress-section pd-progress-horizontal">
          <div className="pd-progress-heading"><span className="pd-progress-kicker is-muted">02</span><div><p className="pd-progress-title">향후 계획</p><p className="pd-progress-subtitle">다음 단계와 예정 일정</p></div></div>
          {upcoming.length > 0 ? <div className="pd-progress-horizontal-track"><div className="pd-progress-horizontal-line" />{upcoming.map((item, index) => <div key={index} className={`pd-progress-horizontal-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{item.desc}</div></div></div>)}</div> : <div className="pd-note-box">등록된 향후 추진계획 정보가 없습니다.</div>}
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

type KakaoLatLng = { getLat: () => number; getLng: () => number };
type KakaoMapInstance = { setCenter: (latLng: KakaoLatLng) => void };
type KakaoGeocoder = { addressSearch: (address: string, callback: (result: Array<{ x: string; y: string }>, status: string) => void) => void };
type KakaoMaps = {
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Marker: new (options: { map: KakaoMapInstance; position: KakaoLatLng }) => unknown;
  InfoWindow: new (options: { content: string }) => { open: (map: KakaoMapInstance, marker: unknown) => void };
  services: { Geocoder: new () => KakaoGeocoder; Status: { OK: string } };
  load: (callback: () => void) => void;
};
type KakaoWindow = Window & { kakao?: { maps: KakaoMaps } };

function LocationPanel({ project }: { project: Project }) {
  const overviewPairs = parseKvPairs(project.overview);
  const address = overviewPairs.find((pair) => pair.label === "사업위치")?.value;
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "missing-key" | "error">("idle");
  const isFirstProject = project.serial === 1;

  useEffect(() => {
    if (!isFirstProject || !address || !mapRef.current) return;
    const appKey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string | undefined;
    if (!appKey) {
      setMapStatus("missing-key");
      return;
    }

    setMapStatus("loading");
    const scriptId = "kakao-map-sdk";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const setupMap = () => {
      const kakao = (window as KakaoWindow).kakao;
      if (!kakao?.maps || !mapRef.current) {
        setMapStatus("error");
        return;
      }
      kakao.maps.load(() => {
        if (!mapRef.current) return;
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.addressSearch(address, (result, status) => {
          if (status !== kakao.maps.services.Status.OK || result.length === 0 || !mapRef.current) {
            setMapStatus("error");
            return;
          }
          const position = new kakao.maps.LatLng(Number(result[0].y), Number(result[0].x));
          const map = new kakao.maps.Map(mapRef.current, { center: position, level: 5 });
          const marker = new kakao.maps.Marker({ map, position });
          const infoWindow = new kakao.maps.InfoWindow({ content: `<div style="padding:8px 12px;font-size:13px;white-space:nowrap">${project.project_name}</div>` });
          infoWindow.open(map, marker);
          setMapStatus("ready");
        });
      });
    };

    if (existing) {
      if ((window as KakaoWindow).kakao?.maps) setupMap();
      else existing.addEventListener("load", setupMap, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false&libraries=services`;
    script.addEventListener("load", setupMap, { once: true });
    script.addEventListener("error", () => setMapStatus("error"), { once: true });
    document.head.appendChild(script);
    return () => script.removeEventListener("load", setupMap);
  }, [address, isFirstProject, project.project_name]);

  return (
    <div className="pd-card">
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {isFirstProject ? (
          <div className="pd-map-placeholder relative overflow-hidden">
            <div ref={mapRef} className={`h-full min-h-[320px] w-full ${mapStatus === "ready" ? "opacity-100" : "opacity-0"}`} />
            {mapStatus !== "ready" && <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><div><div className="pd-map-pin" /><span className="pd-map-caption">{mapStatus === "missing-key" ? "카카오맵 API 키를 등록하면 지도가 표시됩니다" : mapStatus === "error" ? "주소를 지도 좌표로 변환하지 못했습니다" : "지도 불러오는 중"}</span></div></div>}
          </div>
        ) : (
          <div className="pd-map-placeholder"><div className="pd-map-pin" /><span className="pd-map-caption">첫 번째 사업 시범 연동 완료 · 다음 단계에서 전체 적용</span></div>
        )}
        <div className="pd-kv-row" style={{ gridTemplateColumns: "1fr" }}>
          <div className="pd-kv"><span className="pd-kv-label">사업위치</span><span className="pd-kv-value">{address ?? "등록된 정보가 없습니다."}</span></div>
          <div className="pd-kv"><span className="pd-kv-label">구청</span><span className="pd-kv-value">{project.contact || "-"}</span></div>
          <div className="pd-kv"><span className="pd-kv-label">읍면동</span><span className="pd-kv-value">{project.district || "-"}</span></div>
          <div className="pd-kv"><span className="pd-kv-label">선거구</span><span className="pd-kv-value">{project.town || "-"}</span></div>
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
    <section className="pd-detail-page relative p-6 lg:p-10" style={themeVars}>
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
            <span className="pd-pill pd-pill-status">{project.current_stage || "-"}</span>
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
          <span className="pd-summary-value" style={{ fontSize: 18 }}>{formatDateText(project.inspection || "-")}</span>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><MapPin /> 위치 · 선거구</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[project.contact, project.district, project.town].filter(Boolean).map((tag, index) => (
              <span key={`${tag}-${index}`} className={`pd-pill ${index === 2 ? "pd-pill-district" : "pd-pill-tag"}`}>{tag}</span>
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


function futureBudgetFor(project: Project) {
  const planned = (project.budget_2027_million_krw ?? 0) + (project.card_budget_2028_plus_million_krw ?? 0);
  if (planned > 0) return planned;
  return Math.max((project.total_cost_million_krw ?? 0) - (project.invested_to_2026_million_krw ?? 0), 0);
}

function parseProgress(project: Project) {
  const value = Number.parseInt(project.expected_completion ?? "", 10);
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

function formatDepartmentAmount(value: number) {
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} 백만원`;
}

function DepartmentDashboard({
  onBack,
  onSelectProject,
  initialDepartment,
}: {
  onBack: () => void;
  onSelectProject: (project: Project) => void;
  initialDepartment: string;
}) {
  const [stageFilter, setStageFilter] = useState("전체");
  const departmentProjects = projects
    .filter((project) => project.department === initialDepartment)
    .sort((a, b) => futureBudgetFor(b) - futureBudgetFor(a));
  const filteredProjects = departmentProjects.filter((project) => stageFilter === "전체" || project.current_stage === stageFilter);
  const stageOptions = Array.from(new Set(departmentProjects.map((project) => project.current_stage).filter(Boolean)));
  const totalCost = departmentProjects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const investedAmount = departmentProjects.reduce((sum, project) => sum + (project.invested_to_2026_million_krw ?? 0), 0);
  const budget2027 = departmentProjects.reduce((sum, project) => sum + (project.budget_2027_million_krw ?? 0), 0);
  const futurePlanBudget = departmentProjects.reduce((sum, project) => sum + (project.card_budget_2028_plus_million_krw ?? 0), 0);

  return (
    <section className="dept-dashboard">
      <div className="dept-dashboard-header">
        <div>
          <p className="dept-dashboard-eyebrow">DEPARTMENT INVESTMENT CONTROL</p>
          <h1>{initialDepartment} 추진현황</h1>
          <p>현재 추진 중인 {initialDepartment} 주요사업과 향후 편성해야 할 예산을 확인합니다.</p>
        </div>
        <button type="button" className="dept-dashboard-back" onClick={onBack}>주요사업 현황으로 돌아가기</button>
      </div>

      <div className="dept-kpi-grid dept-kpi-grid-selected">
        <div className="dept-kpi"><span>총사업비</span><strong>{formatDepartmentAmount(totalCost)}</strong><small>{initialDepartment} 사업 합계</small></div>
        <div className="dept-kpi"><span>기투자액</span><strong>{formatDepartmentAmount(investedAmount)}</strong><small>2026년까지 누적 투자</small></div>
        <div className="dept-kpi dept-kpi-accent"><span>2027년 편성예정액</span><strong>{formatDepartmentAmount(budget2027)}</strong><small>사업별 입력 예정액 합계</small></div>
        <div className="dept-kpi"><span>향후 계획예산액</span><strong>{formatDepartmentAmount(futurePlanBudget)}</strong><small>2028년 이후 계획액</small></div>
      </div>

      <div className="dept-panel dept-panel-projects dept-panel-selected">
        <div className="dept-panel-heading"><div><span className="dept-panel-kicker">01</span><h2>{initialDepartment} 주요사업</h2></div><span>{departmentProjects.length}개 사업 · 총사업비 {formatDepartmentAmount(totalCost)}</span></div>
        <div className="dept-filter-row">
          <label>추진단계<select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}><option value="전체">전체</option>{stageOptions.map((stage) => <option key={stage} value={stage}>{stage}</option>)}</select></label>
          <span>{filteredProjects.length}개 사업 표시</span>
        </div>
        <div className="dept-project-table-wrap">
          <table className="dept-project-table"><thead><tr><th>사업명</th><th>현 추진단계</th><th>향후 필요예산</th><th>진행률</th></tr></thead><tbody>
            {filteredProjects.map((project) => <tr key={project.id} onClick={() => onSelectProject(project)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onSelectProject(project); }}>
              <td><strong>{project.project_name}</strong><small>{project.region || project.district || "위치정보 미등록"}</small></td><td><span className="dept-stage-chip">{project.current_stage || "미등록"}</span></td><td className="dept-amount-cell">{formatDepartmentAmount(futureBudgetFor(project))}</td><td><div className="dept-progress"><span><em style={{ width: `${parseProgress(project)}%` }} /></span><b>{parseProgress(project)}%</b></div></td>
            </tr>)}
            {filteredProjects.length === 0 && <tr><td colSpan={4} className="dept-empty">조건에 맞는 사업이 없습니다.</td></tr>}
          </tbody></table>
        </div>
      </div>
      <p className="dept-dashboard-note">향후 계획예산액은 각 사업의 2028년 이후 계획예산 합계이며, 사업별 상세 표에서는 2027년 편성예정액과 향후 계획예산액을 합산한 금액을 향후 필요예산으로 표시합니다.</p>
    </section>
  );
}

function PodaSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="sidebar-search-simple">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="검색"
        type="text"
        name="text"
        className="input"
        aria-label="사업명·부서·분야 검색"
      />
      <Search className="sidebar-search-simple-icon" size={18} strokeWidth={2} aria-hidden="true" />
    </div>
  );
}
function LandingPage({ onOpenDashboard }: { onOpenDashboard: () => void }) {
  return (
    <section className="landing-page">
      <div className="hero-panel">
        <div className="landing-preloader" aria-hidden="true">
          <span /><span /><span /><span /><span />
        </div>
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
        <div className="landing-orb landing-orb-c" />
        <div className="landing-noise" />
        <button type="button" onClick={onOpenDashboard} className="landing-status-button" aria-label="주요투자사업 현황 열기"><span>주요투자사업 현황</span><span className="landing-status-dot" aria-hidden="true" /></button>
        <div className="landing-content">
          <p className="landing-eyebrow"><span /> HWASEONG SPECIAL CITY <span /></p>
          <h1 className="landing-title"><span className="landing-title-line landing-title-line-a">MAJOR</span><span className="landing-title-line landing-title-line-b">INVESTMENT</span></h1>
        </div>
      </div>
    </section>
  );
}

export default function Home() {

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const allBureauNames = organization.map((item) => item.name);
  const allDepartmentKeys = organization.flatMap((bureau) => bureau.departments.map((department) => `${bureau.name}-${department.name}`));
  const [openBureaus, setOpenBureaus] = useState<string[]>(allBureauNames);
  const [openDepartments, setOpenDepartments] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDepartmentDashboard, setSelectedDepartmentDashboard] = useState("전체");
  const [activeView, setActiveView] = useState<"landing" | "project" | "department">("landing");

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
                `${project.project_name} ${project.department} ${project.category} ${project.project_type} ${project.region} ${project.district} ${project.town}`.toLowerCase().includes(normalizedQuery),
              ),
            }))
            .filter((department) => department.projects.length > 0),
        }))
        .filter((bureau) => bureau.departments.length > 0),
    [normalizedQuery],
  );

  const toggle = (items: string[], setter: (value: string[]) => void, item: string) =>
    setter(items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);
  const resetSidebar = () => {
    setQuery("");
    setOpenBureaus(allBureauNames);
    setOpenDepartments([]);
  };

  return (
    <div className="min-h-screen bg-[var(--pd-ground)]/85 text-white">
      {isSidebarOpen && (
        <button aria-label="사이드바 닫기" className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
      <aside
        className={`app-sidebar fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/[0.08] bg-gradient-to-b from-[#07090f] via-[#0e1220] to-[#030409] transition-all duration-200 lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "w-[76px]" : "w-[300px]"}`}
      >
                <div className={`sidebar-brand flex min-h-[104px] items-end bg-black/20 pb-3 ${isCollapsed ? "justify-center px-3" : "justify-between px-6"}`}>

          {!isCollapsed && (
            <button
              type="button"
                            className="sidebar-title-button text-left"

              onClick={() => {
                setSelectedProject(null);
                setActiveView("landing");
                resetSidebar();
                setIsSidebarOpen(false);
              }}
            >
                            <p className="sidebar-title-text" aria-label="화성시 주요투자사업">화성시 주요투자사업</p>

              <p className="mt-1 font-body text-[11px] font-semibold tracking-[0.14em] text-[var(--pd-text-muted)]">INVESTMENT DASHBOARD</p>
            </button>
          )}
          
                </div>
        <nav className="pd-sidebar-nav min-h-0 flex-1 overflow-y-auto px-3 pb-5 pt-5">

          {visibleOrganization.map((bureau) => {
            const bureauOpen = normalizedQuery.length > 0 || openBureaus.includes(bureau.name);
            return (
              <div key={bureau.name} className="mb-2">
                <button
                  className={`sidebar-bureau flex w-full items-center rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 text-left shadow-[0_3px_12px_rgba(0,0,0,0.10)] transition-colors hover:border-white/[0.12] hover:bg-white/[0.05] ${bureauOpen ? "is-open" : ""} ${isCollapsed ? "justify-center" : "gap-2"}`}
                  onClick={() => toggle(openBureaus, setOpenBureaus, bureau.name)}
                  title={isCollapsed ? bureau.name : undefined}
                >
                  {!isCollapsed && <span className="font-body text-[15px] font-semibold tracking-[-0.02em] text-white/85">{bureau.name}</span>}
                  <span className={`sidebar-bureau-icon ${isCollapsed ? "" : "ml-auto"} ${bureau.name === "문화관광국" ? "is-culture" : "is-education"}`} aria-hidden="true">
                    {bureau.name === "문화관광국" ? <Building2 size={20} strokeWidth={2.2} /> : <GraduationCap size={20} strokeWidth={2.2} />}
                  </span>
                </button>
                {bureauOpen && !isCollapsed && (
                                    <div className="ml-1 pl-0">
                    {bureau.departments.map((department) => {

                      const key = `${bureau.name}-${department.name}`;
                      const departmentOpen = normalizedQuery.length > 0 || openDepartments.includes(key);
                      return (
                        <div key={department.name}>
                          <button
                            className={`sidebar-department flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left hover:bg-[#334155] ${departmentOpen ? "is-open" : ""}`}
                            onClick={() => {
                              setSelectedDepartmentDashboard(department.name);
                              setSelectedProject(null);
                              setActiveView("department");
                              setOpenBureaus(allBureauNames);
                              setOpenDepartments([key]);
                              setIsSidebarOpen(false);
                            }}
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
                                      setActiveView("project");
                                      setOpenBureaus(allBureauNames);
                                      setOpenDepartments([key]);
                                      setIsSidebarOpen(false);
                                    }}
                                                                        className={`sidebar-project relative mb-0.5 flex min-w-0 w-full items-start rounded-lg py-1.5 pl-11 pr-1 text-left ${isSelected ? "is-selected text-white" : "text-[var(--pd-text-muted)] hover:bg-[#334155] hover:text-white"}`}

                                    style={isSelected ? { background: "var(--hanzo-yellow)", borderLeft: "0", color: "var(--hanzo-ink)" } : undefined}
                                  >
                                    <span
                                                                            className="absolute left-8 top-[13px] h-1.5 w-1.5 rounded-full"

                                      style={{ background: isSelected ? "var(--hanzo-ink)" : "rgba(23, 24, 18, .34)" }}
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
          <div className="mt-5 px-3 pt-2 pb-1">
            <PodaSearch value={query} onChange={setQuery} />
            {normalizedQuery && <p className="sidebar-search-count">{visibleOrganization.reduce((total, bureau) => total + bureau.departments.reduce((sum, department) => sum + department.projects.length, 0), 0)}개 사업 검색됨</p>}
          </div>
        )}
      </nav>
      </aside>

      <div className={`flex min-h-screen flex-col transition-all duration-200 ${isCollapsed ? "lg:pl-[76px]" : "lg:pl-[300px]"}`}>
        <header className="flex h-[72px] flex-none items-center border-b border-white/[0.08] bg-[var(--pd-ground)]/80 px-5 backdrop-blur lg:hidden">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.14] bg-white/[0.06] text-white"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="사이드바 열기"
          >
            <Menu size={18} />
          </button>
        </header>

        <main className="app-main relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute right-[8%] top-[-8%] h-[520px] w-[170px] rotate-[24deg] rounded-full bg-[var(--pd-accent-a)]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8%] right-[17%] h-[440px] w-[145px] -rotate-[28deg] rounded-full bg-[var(--pd-accent-b)]/25 blur-3xl" />
          {selectedProject && <div className="app-panel-topbar" aria-hidden="true" />}
          {activeView === "department" ? (
            <DepartmentDashboard key={selectedDepartmentDashboard} initialDepartment={selectedDepartmentDashboard} onBack={() => setActiveView("landing")} onSelectProject={(project) => { setSelectedProject(project); setActiveView("project"); }} />
          ) : activeView === "project" && selectedProject ? (
            <div className="detail-panel-shell">
              <ProjectDetail project={selectedProject} />
            </div>
          ) : (
            <LandingPage onOpenDashboard={() => { setSelectedProject(projects[0] ?? null); setActiveView("project"); }} />
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
