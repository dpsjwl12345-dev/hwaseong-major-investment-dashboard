import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent as ReactFormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import createGlobe from "cobe";
import {
  Activity,
  Banknote,
  Building2,
  CalendarCheck,
  CalendarClock,
  ClipboardCheck,
  Download,
  AlignRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  GraduationCap,
  Layers3,
  MapPin,
  Route,
  Image as ImageIcon,
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
import hwaseongBoundary from "../data/hwaseong-boundary.json";
import dongCentroids from "../data/hwaseong-dong-centroids.json";
import dongOutlines from "../data/hwaseong-dong-outlines.json";
import guOutlines from "../data/hwaseong-gu-outlines.json";
import coastalPoints from "../data/hwaseong-coastal-points.json";
import islands from "../data/hwaseong-islands.json";
import dongLonLat from "../data/hwaseong-dong-lonlat.json";
import coastalLonLat from "../data/hwaseong-coastal-lonlat.json";
import { HwaseongGLMap } from "../components/HwaseongGLMap";

type Project = {
  id: string;
  serial: number;
  department: string;
  project_name: string;
  overview: string;
  category: string;
  current_stage: string;
  current_stage_note?: string;
  funding_type: string;
  total_cost_million_krw: number | null;
  invested_to_2026_million_krw: number | null;
  carryover_million_krw?: number | null;
  carryover_type?: string;
  carryover_items?: { label: string; type: string; amount_million_krw: number }[];
  budget_2027_million_krw: number | null;
  budget_2026_hide?: boolean;
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
  gallery_images?: { src: string; alt?: string; caption?: string }[];
  rendering_images?: string[];
  overview_images?: string[];
  overview_images_title?: string;
  overview_map?: { title?: string; image?: string; basemap?: "illustration"; spots: { label: string; x: number; y: number; zoomImage: string; tracked?: boolean }[] };
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
  usage_breakdown_note?: string;
  funding_breakdown_note?: string;
  card_admin_procedures: string;
  card_admin_legal_basis: string;
  card_admin_status: { mid_term_fiscal?: boolean; investment_review?: boolean; public_property?: boolean; none?: boolean };
  sub_projects?: (Partial<Project> & { name: string })[];
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
      const match = line.match(/^○\s*([^:：]+?)\s*[:：]\s*(.*)$/);
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
      const colonMatch = stripped.match(/^(\d[^:：]*?)[:：]\s*(\S.*)$/);
      if (colonMatch) return { date: formatDateText(colonMatch[1].trim()), desc: colonMatch[2].trim() };
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
    { label: "현추진단계", value: project.current_stage ? `${project.current_stage}${project.current_stage_note ? ` (${project.current_stage_note})` : ""}` : "-" },
  ];
  const renderings = project.overview_images ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
        <div className="pd-card">
      <KvCards pairs={[...pairs, ...extra]} />
      {renderings.length > 0 && (
        <div className="pd-kv-row mt-4">
          <div className="pd-kv" style={{ gridColumn: "1 / -1" }}>
            <span className="pd-kv-label">{project.overview_images_title || "관련 이미지"}</span>
            <div className="pd-rendering-grid mt-1" data-count={Math.min(renderings.length, 4)}>
              {renderings.map((src, index) => (
                <button type="button" key={src} className="pd-rendering-thumb" onClick={() => setLightboxIndex(index)} aria-label={`${project.project_name} 이미지 ${index + 1} 확대 보기`}>
                  <img src={src} alt={`${project.project_name} 이미지 ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {lightboxIndex !== null && (
        <RenderingLightbox
          images={renderings}
          index={lightboxIndex}
          projectName={project.project_name}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
      {project.overview_map && <SpotMapCard map={project.overview_map} projectName={project.project_name} />}
    </div>
  );
}

function SpotMapCard({ map, projectName }: { map: NonNullable<Project["overview_map"]>; projectName: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const mapBody = (
    <>
      {map.basemap === "illustration" ? (
        <svg className="pd-spotmap-illustration" viewBox={`0 0 ${hwaseongBoundary.width} ${hwaseongBoundary.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${projectName} 위치도`}>
          <path d={hwaseongBoundary.d} />
        </svg>
      ) : (
        <img src={map.image} alt={`${projectName} 위치도`} />
      )}
      {map.spots.map((spot, index) => (
        <span key={spot.label} className={`pd-spotmap-pin${spot.tracked ? " is-tracked" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
          <span className="pd-spotmap-pin-dot">{index + 1}</span>
          <span className="pd-spotmap-pin-label">{spot.label}</span>
        </span>
      ))}
    </>
  );
  return (
    <div className="pd-kv-row mt-4">
      <div className="pd-kv" style={{ gridColumn: "1 / -1" }}>
        <span className="pd-kv-label">{map.title || "거점 위치도"}</span>
        <button type="button" className={`pd-spotmap mt-1${map.basemap === "illustration" ? " is-illustration" : ""}`} onClick={() => setIsZoomed(true)} aria-label={`${map.title || "거점 위치도"} 확대 보기`}>
          {mapBody}
        </button>
        {map.spots.some((s) => s.tracked) && (
          <div className="pd-spotmap-legend mt-2">
            <span><i className="pd-spotmap-legend-dot is-tracked" />체육진흥과 추진사업</span>
            <span><i className="pd-spotmap-legend-dot" />검토·참고 지점</span>
          </div>
        )}
      </div>
      {isZoomed && (
        <div className="pd-lightbox-backdrop" onClick={() => setIsZoomed(false)}>
          <button type="button" className="pd-lightbox-close" onClick={() => setIsZoomed(false)} aria-label="닫기"><X size={20} /></button>
          <div className="pd-lightbox-content pd-spotmap-lightbox" onClick={(event) => event.stopPropagation()}>
            <div className="pd-spotmap is-illustration is-zoomed">{mapBody}</div>
          </div>
        </div>
      )}
    </div>
  );
}

type BreakdownRow = Project["funding_breakdown"][number];
type BudgetYearKey = "budget_2026" | "budget_2027" | "budget_2028_plus";

function sumBreakdown(rows: BreakdownRow[], key: keyof BreakdownRow) {
  return rows.reduce((sum, row) => sum + ((row[key] as number | null | undefined) ?? 0), 0);
}

function displayBreakdownName(name: string) {
  return name.replace(/\s*\((?:일반운영비|민간이전)\)\s*/g, " ").replace(/\s{2,}/g, " ").trim();
}

function DetailSectionHeading({ icon: Icon, title, subtitle }: { icon: typeof Coins; title: string; subtitle?: string }) {
  return <div className="pd-section-heading"><span className="pd-section-icon"><Icon size={17} strokeWidth={2.2} /></span><div><p className="pd-section-heading-title">{title}</p>{subtitle && <p className="pd-section-heading-subtitle">{subtitle}</p>}</div></div>;
}

function FundingBreakdownCard({ rows, note }: { rows: BreakdownRow[]; note?: string }) {
  const totalBudget = sumBreakdown(rows, "total");
  const columns: { key: keyof BreakdownRow; label: string }[] = [
    { key: "total", label: "재원별 총예산" },
    { key: "invested", label: "기투자" },
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "이후" },
  ];
  return <div className="pd-budget-panel"><div className="pd-budget-panel-heading"><DetailSectionHeading icon={Banknote} title="재원별 예산" /><span className="pd-budget-panel-caption">총사업비 {formatMillion(totalBudget || null)}<br />(단위:백만원)</span></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-funding-table-wrap"><table className="pd-funding-table"><thead><tr><th>구분</th>{columns.map((column) => <th key={String(column.key)}>{column.label}</th>)}</tr></thead><tbody><tr className="is-total"><th>총사업비</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(sumBreakdown(rows, column.key))}</td>)}</tr>{rows.map((row) => <tr key={row.name}><th>{displayBreakdownName(row.name)}</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(row[column.key] as number | null | undefined)}</td>)}</tr>)}</tbody></table></div>}{note && <p className="pd-note-box mt-3 !text-[12px]">{note}</p>}</div>;
}

const usageColors = ["#e5542d", "#58c7b1", "#6f8cff", "#9a7bdb", "#6b7280"];
const usageColorNames = ["공사", "감리", "설계", "부대", "기타"];

function UsageBreakdownChart({ rows, note }: { rows: BreakdownRow[]; note?: string }) {
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
  return <div className="pd-budget-panel pd-usage-panel"><div className="pd-budget-panel-heading"><DetailSectionHeading icon={Layers3} title="성질별 예산" /><span className="pd-budget-panel-caption">연도별 배분</span></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-pulse-content"><div className="pd-year-switcher" role="tablist" aria-label="예산 연도 선택">{years.map((year) => <button key={year.key} type="button" className={selectedYear === year.key ? "is-active" : ""} onClick={() => setSelectedYear(year.key)}>{year.label}</button>)}</div><div className="pd-pulse-summary"><div><span className="pd-pulse-eyebrow">{selectedLabel} 편성 예산</span><strong>{formatMillion(selectedTotal || null)}</strong><span className="pd-pulse-positive">전체 사업비의 {selectedShare.toFixed(1)}%</span></div><div className="pd-pulse-donut" style={{ background: `conic-gradient(#e5542d ${selectedShare}%, rgba(255,255,255,.1) 0)` }}><span>{selectedShare.toFixed(0)}%</span><small>전체</small></div></div><div className="pd-pulse-trend"><div className="pd-pulse-section-label"><span>연도별 예산 흐름</span><small>기투자 → 이후</small></div><svg viewBox="0 0 320 100" role="img" aria-label="연도별 예산 흐름"><defs><linearGradient id="budgetArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#e5542d" stopOpacity=".28" /><stop offset="100%" stopColor="#e5542d" stopOpacity="0" /></linearGradient></defs><polygon points={`15,84 ${points} 305,84`} fill="url(#budgetArea)" /><polyline points={points} fill="none" stroke="#e5542d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{flowValues.map((value, index) => <circle key={`flow-${index}`} cx={flowX(index)} cy={84 - (value / maxFlowValue) * 66} r="4.5" fill="#fff" stroke="#e5542d" strokeWidth="3" />)}</svg><div className="pd-pulse-axis"><span>기투자</span><span>2026년</span><span>2027년</span><span>이후</span></div></div><div className="pd-usage-progress-list">{usageRows.map(({ row, value }) => { const share = selectedTotal > 0 ? (value / selectedTotal) * 100 : 0; return <div className="pd-usage-progress-row" key={row.name}><div className="pd-usage-progress-label"><span>{displayBreakdownName(row.name)}</span><b>{formatMillion(value || null)}</b><strong>{share.toFixed(0)}%</strong></div><div className="pd-usage-progress-track"><span style={{ width: `${share}%`, background: usageColorFor(row.name) }} /></div></div>; })}</div><div className="pd-usage-legend">{usageColorNames.map((name, index) => <span key={name}><i style={{ background: usageColors[index] }} />{name}</span>)}</div>{note && <p className="pd-note-box mt-3 !text-[12px]">{note}</p>}</div>}</div>;
}

function formatMillion(value: number | null | undefined) {
  return value == null ? "-" : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function BudgetPanel({ project }: { project: Project }) {
  const total = project.card_total_budget_million_krw ?? project.total_cost_million_krw;
  const invested = project.card_invested_to_2025_million_krw ?? project.card_invested_to_2026_million_krw ?? project.invested_to_2026_million_krw;
  const budget = project.budget_2026_hide ? null : project.card_budget_2026_million_krw ?? project.budget_2027_million_krw;
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
      <div className="pd-budget-breakdown-grid"><FundingBreakdownCard rows={project.funding_breakdown} note={project.funding_breakdown_note} /><UsageBreakdownChart rows={project.usage_breakdown} note={project.usage_breakdown_note} /></div>
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
          <div className="pd-progress-heading"><DetailSectionHeading icon={Route} title="추진경과" /></div>
          {past.length > 0 ? <div className="pd-progress-vertical-list">{past.map((item, index) => <div key={index} className={`pd-progress-vertical-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{item.desc}</div></div></div>)}</div> : <div className="pd-note-box">등록된 추진현황이 없습니다.</div>}
        </section>
        <section className="pd-progress-section pd-progress-horizontal">
          <div className="pd-progress-heading"><DetailSectionHeading icon={CalendarClock} title="향후계획" /></div>
          {upcoming.length > 0 ? <div className="pd-progress-horizontal-track"><div className="pd-progress-horizontal-line" />{upcoming.map((item, index) => <div key={index} className={`pd-progress-horizontal-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{item.desc}</div></div></div>)}</div> : <div className="pd-note-box">등록된 향후 추진계획 정보가 없습니다.</div>}
        </section>
      </div>
    </div>
  );
}

function AdminPanel({ project }: { project: Project }) {
  const status = project.card_admin_status || {};
  const checks = [["중기재정", status.mid_term_fiscal], ["투·융자심사", status.investment_review], ["공유재산", status.public_property], ["해당없음", status.none]] as const;
  return <div className="pd-card pd-admin-card"><div className="pd-card-title"><DetailSectionHeading icon={ClipboardCheck} title="이행여부" /></div>{project.management_card_matched ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{checks.map(([label, checked]) => <div key={label} className={`rounded-xl border px-4 py-4 ${checked ? "border-[var(--pd-success)]/50 bg-[var(--pd-success)]/10" : "border-[var(--pd-border)] bg-white/[0.02]"}`}><span className="text-[13px] text-[var(--pd-text-muted)]">{checked ? "■" : "□"} {label}</span></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="pd-kv"><span className="pd-kv-label">선택된 절차</span><span className="pd-kv-value">{project.card_admin_procedures || "-"}</span></div><div className="pd-kv"><span className="pd-kv-label">법적근거</span><span className="pd-kv-value">{project.card_admin_legal_basis || "-"}</span></div></div></> : <div className="pd-note-box">해당 사업의 사업별 관리카드가 검색되지 않았습니다.</div>}</div>;
}

// Real lon/lat for a project, derived only from our own offline boundary
// data (dong centroid, or a named coastal/island point) — never from
// geocoding the project's actual address text through an outside service.
function realCoordsFor(project: Project): [number, number] | null {
  const text = `${project.project_name} ${project.district} ${project.overview}`;
  const keywordToPoint: Record<string, string> = { 궁평: "궁평항", 제부: "제부도", 국화도: "국화도", 입파도: "입파도" };
  const coastalKeyword = Object.keys(keywordToPoint).find((keyword) => text.includes(keyword));
  if (coastalKeyword) {
    const point = (coastalLonLat as unknown as Record<string, [number, number]>)[keywordToPoint[coastalKeyword]];
    if (point) return point;
  }
  const dongNames = (project.district ?? "").split(",").map((name) => name.trim()).filter(Boolean);
  const matches = dongNames.map((name) => (dongLonLat as unknown as Record<string, [number, number]>)[name]).filter((m): m is [number, number] => Boolean(m));
  if (matches.length === 0) return null;
  const avgLon = matches.reduce((sum, m) => sum + m[0], 0) / matches.length;
  const avgLat = matches.reduce((sum, m) => sum + m[1], 0) / matches.length;
  return [avgLon, avgLat];
}

function LocationPanel({ project }: { project: Project }) {
  const overviewPairs = parseKvPairs(project.overview);
  const address = overviewPairs.find((pair) => pair.label === "사업위치")?.value;
  const coords = realCoordsFor(project);
  const renderings = project.rendering_images ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="pd-card">
      <div className={`grid gap-4 ${renderings.length > 0 ? "lg:grid-cols-2" : ""}`}>
        <div>
          <div className="pd-card-title"><DetailSectionHeading icon={MapPin} title="위치도" /></div>
          <div className="pd-map-placeholder relative overflow-hidden">
            {coords ? (
              <HwaseongGLMap longitude={coords[0]} latitude={coords[1]} label={project.project_name} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><div><div className="pd-map-pin" /><span className="pd-map-caption">등록된 사업위치가 없습니다</span></div></div>
            )}
          </div>
        </div>
        {renderings.length > 0 && (
          <div>
            <div className="pd-card-title"><DetailSectionHeading icon={ImageIcon} title="조감도" /></div>
            <div className="pd-rendering-grid" data-count={Math.min(renderings.length, 4)}>
              {renderings.map((src, index) => (
                <button type="button" key={src} className="pd-rendering-thumb" onClick={() => setLightboxIndex(index)} aria-label={`${project.project_name} 조감도 ${index + 1} 확대 보기`}>
                  <img src={src} alt={`${project.project_name} 조감도 ${index + 1}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="pd-kv-row mt-4">
        <div className="pd-kv"><span className="pd-kv-label">사업위치</span><span className="pd-kv-value">{address ?? "등록된 정보가 없습니다."}</span></div>
        <div className="pd-kv"><span className="pd-kv-label">구청</span><span className="pd-kv-value">{project.contact || "-"}</span></div>
        <div className="pd-kv"><span className="pd-kv-label">읍면동</span><span className="pd-kv-value">{project.district || "-"}</span></div>
        <div className="pd-kv"><span className="pd-kv-label">선거구</span><span className="pd-kv-value">{project.town || "-"}</span></div>
      </div>
      {lightboxIndex !== null && (
        <RenderingLightbox
          images={renderings}
          index={lightboxIndex}
          projectName={project.project_name}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}

function RenderingLightbox({
  images,
  index,
  projectName,
  onClose,
  onNavigate,
}: {
  images: string[];
  index: number;
  projectName: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (event.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [index, images.length, onClose, onNavigate]);

  return (
    <div className="pd-lightbox-backdrop" onClick={onClose}>
      <button type="button" className="pd-lightbox-close" onClick={onClose} aria-label="닫기"><X size={20} /></button>
      {images.length > 1 && (
        <>
          <button type="button" className="pd-lightbox-nav is-prev" onClick={(event) => { event.stopPropagation(); onNavigate((index - 1 + images.length) % images.length); }} aria-label="이전 이미지"><ChevronLeft size={22} /></button>
          <button type="button" className="pd-lightbox-nav is-next" onClick={(event) => { event.stopPropagation(); onNavigate((index + 1) % images.length); }} aria-label="다음 이미지"><ChevronRight size={22} /></button>
        </>
      )}
      <div className="pd-lightbox-content" onClick={(event) => event.stopPropagation()}>
        <img src={images[index]} alt={`${projectName} 조감도 ${index + 1}`} />
        {images.length > 1 && <div className="pd-lightbox-counter">{index + 1} / {images.length}</div>}
      </div>
    </div>
  );
}
const TABS = ["사업개요", "예산현황", "추진현황"] as const;

function ProjectDetail({ project, lock }: { project: Project; lock?: { isUnlocked: boolean; onLock: () => void; onRequestUnlock: () => void } }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("사업개요");
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab("사업개요");
    setSelectedSubIndex(0);
  }, [project.id]);

  const hasSubProjects = (project.sub_projects?.length ?? 0) > 1;
  const activeProject: Project = hasSubProjects ? { ...project, ...project.sub_projects![selectedSubIndex] } : project;

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

  

  const percent = progressPercent(activeProject);
  const overviewPairs = parseKvPairs(activeProject.overview);
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

      <div className="flex flex-wrap items-center gap-4">
        <h1 className="max-w-4xl font-display text-2xl font-bold leading-[1.15] tracking-[-0.045em] text-white lg:text-4xl">
          {(() => {
            const match = project.project_name.match(/^(.*?)(\s*\([^)]+\))\s*$/);
            if (!match) return project.project_name;
            return (
              <>
                {match[1]}
                <br />
                <span className="text-base font-medium tracking-normal opacity-80 lg:text-xl">{match[2].trim()}</span>
              </>
            );
          })()}
        </h1>

        {hasSubProjects && (() => {
          const subCount = project.sub_projects!.length;
          const maxLabelLen = Math.max(...project.sub_projects!.map((sub) => sub.name.length));
          const subButtonWidth = Math.max(100, maxLabelLen * 15 + 52);
          return (
          <div className="radio-group" role="tablist" aria-label="세부 사업 선택" style={{ width: `${subButtonWidth * subCount}px` }}>
            <div key={selectedSubIndex} className="slider" style={{ width: `calc((100% - 8px) / ${subCount})`, transform: `translateX(${selectedSubIndex * 100}%)` }} />
            {project.sub_projects!.map((sub, index) => {
              const inputId = `detail-subproject-${project.id}-${index}`;
              return (
                <div key={sub.name} className="radio-option">
                  <input id={inputId} name={`detail-subproject-${project.id}`} type="radio" checked={selectedSubIndex === index} onChange={() => setSelectedSubIndex(index)} />
                  <label htmlFor={inputId} className={`radio-label${selectedSubIndex === index ? " is-active" : ""}`} role="tab" aria-selected={selectedSubIndex === index}>{sub.name}</label>
                </div>
              );
            })}
          </div>
          );
        })()}
      </div>

      <section className="pd-summary mt-8" aria-label="사업 요약">
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><Tag /> 사업구분 · 진행상태</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pd-pill pd-pill-new">{activeProject.region || "-"}</span>
            <span className="pd-pill pd-pill-status">{activeProject.current_stage || "-"}</span>
          </div>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label"><Coins /> 총사업비</span>
          <span className="pd-summary-value grad">
            {activeProject.total_cost_million_krw?.toLocaleString("ko-KR") ?? "-"}
            <small style={{ fontSize: 14, fontWeight: 700, background: "none", WebkitTextFillColor: "var(--pd-text-muted)", color: "var(--pd-text-muted)" }}> 백만원</small>
          </span>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label"><Activity /> 사업 전체 공정률</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge key={`${project.id}-${selectedSubIndex}`} percent={percent} />
            <span className="pd-summary-value grad">{percent}%</span>
          </div>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><TrendingUp /> 예산 집행률</span>
          <span className="pd-summary-value">{activeProject.execution_rate ?? 0}%</span>
        </div>
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><CalendarCheck /> 준공예정일</span>
          <span className="pd-summary-value" style={{ fontSize: 18 }}>{formatDateText(activeProject.inspection || "-")}</span>
        </div>
        <div className="pd-summary-cell pd-summary-cell-location">
          <span className="pd-summary-label"><MapPin /> 위치 · 선거구</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[activeProject.contact, activeProject.district, activeProject.town].filter(Boolean).map((tag, index) => (
              <span key={`${tag}-${index}`} className={`pd-pill ${index === 2 ? "pd-pill-district" : "pd-pill-tag"}`}>{tag}</span>
            ))}
            {!activeProject.contact && !activeProject.district && !activeProject.town && <span className="pd-empty text-[14px]">-</span>}
          </div>
          {lock && (
            <div className="sidebar-unlock sidebar-unlock-inline">
              <input
                id="inpLockInline"
                type="checkbox"
                checked={lock.isUnlocked}
                readOnly
                aria-label={lock.isUnlocked ? "잠금" : "비밀번호"}
                onClick={() => (lock.isUnlocked ? lock.onLock() : lock.onRequestUnlock())}
              />
              <label className="btn-lock" htmlFor="inpLockInline">
                <svg width="29" height="33" viewBox="0 0 36 40">
                  <path className="lockb" d="M27 27C27 34.1797 21.1797 40 14 40C6.8203 40 1 34.1797 1 27C1 19.8203 6.8203 14 14 14C21.1797 14 27 19.8203 27 27ZM15.6298 26.5191C16.4544 25.9845 17 25.056 17 24C17 22.3431 15.6569 21 14 21C12.3431 21 11 22.3431 11 24C11 25.056 11.5456 25.9845 12.3702 26.5191L11 32H17L15.6298 26.5191Z" />
                  <path className="lock" d="M6 21V10C6 5.58172 9.58172 2 14 2V2C18.4183 2 22 5.58172 22 10V21" />
                  <path className="bling" d="M29 20L31 22" />
                  <path className="bling" d="M31.5 15H34.5" />
                  <path className="bling" d="M29 10L31 8" />
                </svg>
              </label>
            </div>
          )}
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

      <div key={`${project.id}-${selectedSubIndex}-${activeTab}`} className="pd-panel-fade">
        {activeTab === "사업개요" && (
          <>
            <OverviewPanel project={activeProject} />
            <LocationPanel project={activeProject} />
          </>
        )}
        {activeTab === "예산현황" && <BudgetPanel project={activeProject} />}
        {activeTab === "추진현황" && (
          <>
            <ProgressPanel project={activeProject} />
            <AdminPanel project={activeProject} />
          </>
        )}
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

function formatBudgetNumber(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function formatDepartmentAmount(value: number) {
  return `${formatBudgetNumber(value)} 백만원`;
}

// Distinct, muted tint per 구 so the four districts read apart from each
// other on the map even without relying on the boundary-line/label alone.
const GU_COLORS: Record<string, { fill: string; accent: string }> = {
  효행구: { fill: "rgba(45,200,214,.46)", accent: "#5cd0d8" },
  만세구: { fill: "rgba(96,120,240,.46)", accent: "#7c92f0" },
  동탄구: { fill: "rgba(240,175,60,.42)", accent: "#e8b256" },
  병점구: { fill: "rgba(224,80,140,.42)", accent: "#e07fa8" },
};

// 사업 수가 가장 많은 문화관광시설은 기존 민트 톤을 유지하고,
// 나머지 분야는 서로 다른 색상군으로 분리해 작은 마커에서도 구분되도록 한다.
const CATEGORY_STYLES: Record<string, { id: string; hi: string; mid: string; lo: string }> = {
  문화관광시설: { id: "culture", hi: "#d1fae5", mid: "#34d399", lo: "#047857" },
  체육시설: { id: "sports", hi: "#cffafe", mid: "#22d3ee", lo: "#0e7490" },
  공공시설: { id: "public", hi: "#fef3c7", mid: "#f59e0b", lo: "#b45309" },
  "교육 및 도서관": { id: "edu", hi: "#ede9fe", mid: "#c084fc", lo: "#7e22ce" },
  "도로1(시도·농어촌)": { id: "road", hi: "#ffedd5", mid: "#fb923c", lo: "#c2410c" },
  기타: { id: "etc", hi: "#f1f5f9", mid: "#94a3b8", lo: "#475569" },
};
const DEFAULT_CATEGORY_STYLE = { id: "default", hi: "#d1fae5", mid: "#34d399", lo: "#047857" };
const categoryStyleFor = (category: string | undefined) => (category && CATEGORY_STYLES[category]) || DEFAULT_CATEGORY_STYLE;

function InvestmentDistribution({ projects, onBack, onSelectProject }: { projects: Project[]; onBack: () => void; onSelectProject: (project: Project) => void }) {
  const [selected, setSelected] = useState<Project | null>(null);
  const [hovered, setHovered] = useState<Project | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedPosition, setSelectedPosition] = useState({ x: 0, y: 0 });
  const [selectedOpensDown, setSelectedOpensDown] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [zoneFilter, setZoneFilter] = useState("전체");
  const [deptFilter, setDeptFilter] = useState("전체");
  const [isMapFilterOpen, setIsMapFilterOpen] = useState(false);
  const mapCategoryOptions = Object.keys(CATEGORY_STYLES);
  const mapZoneOptions = Object.keys(GU_COLORS);
  const mapDeptOptions = DEPARTMENT_ORDER.filter((name) => projects.some((project) => project.department === name));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 4;
  const clampPan = (nextPan: { x: number; y: number }, z: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || z <= 1) return { x: 0, y: 0 };
    const maxX = (rect.width * (z - 1)) / 2;
    const maxY = (rect.height * (z - 1)) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, nextPan.x)), y: Math.max(-maxY, Math.min(maxY, nextPan.y)) };
  };
  const applyZoom = (next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(next.toFixed(2))));
    setZoom(clamped);
    setPan((prev) => clampPan(prev, clamped));
  };
  const zoomIn = () => applyZoom(zoom + 0.5);
  const zoomOut = () => applyZoom(zoom - 0.5);
  const resetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.35 : 0.35;
      applyZoom(zoom + delta);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);
  const handlePanStart = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    dragState.current = { x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  };
  const handlePanMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = event.clientX - dragState.current.x;
    const dy = event.clientY - dragState.current.y;
    setPan(clampPan({ x: dragState.current.panX + dx, y: dragState.current.panY + dy }, zoom));
  };
  const handlePanEnd = () => setIsPanning(false);
  // project.contact already holds the real 구 name (효행구/만세구/병점구/동탄구)
  // — prefer that over guessing from free text. The regex fallback only
  // covers the rare project missing that field.
  const zoneFor = (project: Project) => {
    if (project.contact) return project.contact;
    const text = `${project.district} ${project.town} ${project.overview}`;
    if (/동탄/.test(text)) return "동탄구";
    if (/반월|병점|진안|화산동/.test(text)) return "병점구";
    if (/봉담|기배|매송|비봉|정남/.test(text)) return "효행구";
    if (/남양|마도|송산|서신|궁평|제부|국화도|우정|장안|향남|양감|팔탄|새솔/.test(text)) return "만세구";
    return "화성시";
  };
  // Fallback for the rare project whose district isn't one of the 29 dong
  // names in hwaseong-dong-centroids.json (e.g. free-text or missing data).
  const approxPositionFor = (project: Project, index: number) => {
    const text = `${project.district} ${project.town} ${project.overview}`;
    const areas: [RegExp, number, number][] = [
      [/동탄|반월|병점|진안/, 75, 47], [/봉담|기배|화산/, 49, 57], [/남양|마도|송산|비봉|매송/, 34, 38],
      [/향남|양감|팔탄|정남/, 43, 72], [/서신|궁평|제부|국화도/, 16, 68], [/우정|장안/, 23, 83],
    ];
    const hit = areas.find(([pattern]) => pattern.test(text));
    const base = hit ? [hit[1], hit[2]] : [52, 52];
    const spread = ((index * 17) % 7) - 3;
    return { x: Math.max(8, Math.min(92, base[0] + spread)), y: Math.max(12, Math.min(88, base[1] + (((index * 11) % 9) - 4))) };
  };
  // Places a project at its 읍면동 centroid — computed offline from public
  // administrative-boundary data (see scripts/generate_hwaseong_dong_centroids.mjs).
  // No address or project data is ever sent to an outside service for this.
  // Multi-site projects (district holds several dong names, comma-separated)
  // are placed at the average of their centroids. Projects that share a dong
  // (or otherwise land on the exact same spot) are spread apart afterward by
  // the de-clustering pass below — this function just returns the true point.
  const dongPositionFor = (project: Project) => {
    const dongNames = (project.district ?? "").split(",").map((name) => name.trim()).filter(Boolean);
    const matches = dongNames.map((name) => (dongCentroids as Record<string, { x: number; y: number }>)[name]).filter(Boolean);
    if (matches.length === 0) return null;
    const avgX = matches.reduce((sum, m) => sum + m.x, 0) / matches.length;
    const avgY = matches.reduce((sum, m) => sum + m.y, 0) / matches.length;
    return { x: Math.max(2, Math.min(98, avgX)), y: Math.max(2, Math.min(98, avgY)) };
  };

  // Named coastal/island landmarks (궁평항, 국화도, 제부도) are finer than the
  // 읍면동 centroids above — a project addressed to one of these was landing
  // at its whole township's inland center instead of on the coast. Check the
  // project text for these place names before falling back to the dong.
  const coastalPositionFor = (project: Project) => {
    const text = `${project.project_name} ${project.district} ${project.overview}`;
    // Match on the short place-name root, not the full landmark name — the
    // source address text says "궁평리"/"제부리", not "궁평항"/"제부도".
    const keywordToPoint: Record<string, string> = { 궁평: "궁평항", 제부: "제부도", 국화도: "국화도", 입파도: "입파도" };
    const hit = Object.keys(keywordToPoint).find((keyword) => text.includes(keyword));
    if (!hit) return null;
    return (coastalPoints as Record<string, { x: number; y: number }>)[keywordToPoint[hit]] ?? null;
  };
  // 국화도/입파도 and 제부도 are real islands (제부도 reachable only by a
  // tidal causeway) now drawn on the map as their own small shapes — but the
  // source data doesn't label its extra polygon rings individually, so which
  // ring is 국화도 vs 입파도 is inferred (by size/position), not certain.
  // Flag these so the UI can say so.
  const isIslandProject = (project: Project) => {
    const text = `${project.project_name} ${project.district} ${project.overview}`;
    return ["국화도", "입파도", "제부"].some((keyword) => text.includes(keyword));
  };

  const rawPoints = projects.map((project, index) => ({
    project,
    zone: zoneFor(project),
    isIsland: isIslandProject(project),
    ...(coastalPositionFor(project) ?? dongPositionFor(project) ?? approxPositionFor(project, index)),
  }));
  // Multiple projects sharing a dong (or otherwise landing on the exact same
  // spot) used to stack perfectly on top of each other — invisible and
  // unclickable underneath whichever marker happened to render last. Group
  // by (rounded) position and fan any group of 2+ out into a small ring so
  // every marker stays visible and separately clickable. Rounding to 1
  // decimal only catches true stacking, not projects that are merely close
  // together at different real locations.
  const positionGroups = new Map<string, typeof rawPoints>();
  for (const point of rawPoints) {
    const key = `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const group = positionGroups.get(key);
    if (group) group.push(point);
    else positionGroups.set(key, [point]);
  }
  const CLUSTER_RADIUS_UNITS = 14; // in the 1000-wide SVG viewBox
  const points = rawPoints.map((point) => {
    const key = `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
    const group = positionGroups.get(key)!;
    if (group.length < 2) return point;
    const slot = group.indexOf(point);
    const angle = (slot / group.length) * Math.PI * 2 - Math.PI / 2;
    const offsetXPercent = (Math.cos(angle) * CLUSTER_RADIUS_UNITS) / hwaseongBoundary.width * 100;
    const offsetYPercent = (Math.sin(angle) * CLUSTER_RADIUS_UNITS) / hwaseongBoundary.height * 100;
    return {
      ...point,
      x: Math.max(2, Math.min(98, point.x + offsetXPercent)),
      y: Math.max(2, Math.min(98, point.y + offsetYPercent)),
    };
  });
  // Filtering only trims which points render — it never recomputes position/
  // clustering, so the remaining markers don't shift around when a filter
  // changes. A project's zone can be a comma-separated list ("효행구,병점구")
  // for cross-district projects, so match with includes rather than ===.
  const visiblePoints = points.filter(
    (point) =>
      (categoryFilter === "전체" || point.project.category === categoryFilter) &&
      (zoneFilter === "전체" || point.zone.split(",").includes(zoneFilter)) &&
      (deptFilter === "전체" || point.project.department === deptFilter),
  );

  // Anchors the speech-bubble card to the marker's true geometric center via
  // getScreenCTM (not getBoundingClientRect on the core circle, which is
  // inflated by its glow filter's bleed region and would push the card too
  // far up) so the tail sits tight against the exact spot regardless of the
  // cursor position or how the map is zoomed/panned.
  const cardPositionFor = (event: ReactMouseEvent<SVGGElement>) => {
    const group = event.currentTarget;
    const svg = group.ownerSVGElement;
    const canvasRect = group.closest(".investment-map-canvas")?.getBoundingClientRect();
    const ctm = group.getScreenCTM();
    if (!svg || !canvasRect || !ctm) return null;
    const point = svg.createSVGPoint();
    point.x = 0;
    point.y = 0;
    const screenCenter = point.matrixTransform(ctm);
    const scale = Math.hypot(ctm.a, ctm.b);
    const core = group.querySelector(".investment-map-point-core");
    const baseR = core ? Number(core.getAttribute("r")) || 7 : 7;
    return { x: screenCenter.x - canvasRect.left, y: screenCenter.y - canvasRect.top - baseR * scale, screenY: screenCenter.y };
  };
  const showHoverCardFor = (project: Project, event: ReactMouseEvent<SVGGElement>) => {
    setHovered(project);
    const position = cardPositionFor(event);
    if (position) setHoverPosition(position);
  };
  // Clicking a marker pins its info card in place above that marker so it
  // stays visible after the cursor moves away, instead of just disappearing
  // like a plain hover tooltip once you're no longer pointing at it. If the
  // marker sits too close to the top of the screen for the card to fit
  // above it, flip it to open downward instead so it never gets clipped.
  const selectProjectAt = (project: Project, event: ReactMouseEvent<SVGGElement>) => {
    setSelected(project);
    setGalleryIndex(0);
    const position = cardPositionFor(event);
    if (position) {
      setSelectedPosition(position);
      setSelectedOpensDown(position.screenY < window.innerHeight / 2);
    }
  };

  const activeMapFilterCount = [categoryFilter, zoneFilter, deptFilter].filter((value) => value !== "전체").length;
  const renderMapFilterSection = (label: string, options: string[], value: string, setValue: (next: string) => void) => (
    <div className="investment-map-filter-section">
      <span className="investment-map-filter-section-label">{label}</span>
      <div className="investment-map-filter-chip-row">
        {["전체", ...options].map((option) => (
          <button
            key={option}
            type="button"
            className={value === option ? "is-active" : ""}
            onClick={() => setValue(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <section className="investment-map-page">
      <header className="investment-map-header">
        <div><p className="investment-map-eyebrow">HWASEONG · INVESTMENT DISTRIBUTION MAP</p><h1>주요 투자사업 분포도</h1></div>
      </header>
      <div className="investment-map-layout">
        <div
          className={`investment-map-canvas ${isPanning ? "is-panning" : ""} ${zoom > 1 ? "is-zoomed" : ""}`}
          role="group"
          aria-label="화성시 주요 투자사업 위치 분포도"
          ref={canvasRef}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
        >
          <div
            className="investment-map-zoom-layer"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transition: isPanning ? "none" : "transform .18s ease-out" }}
          >
            <div className="investment-map-grid" /><div className="investment-map-glow" />
            <svg className="investment-map-outline accurate" viewBox={`0 0 ${hwaseongBoundary.width} ${hwaseongBoundary.height}`} preserveAspectRatio="xMidYMid meet">
              <defs>
                {[...Object.values(CATEGORY_STYLES), DEFAULT_CATEGORY_STYLE].map((style) => (
                  <radialGradient key={style.id} id={`atlasPointGradient-${style.id}`} cx="35%" cy="30%" r="70%">
                    <stop offset="0%" stopColor={style.hi} />
                    <stop offset="45%" stopColor={style.mid} />
                    <stop offset="100%" stopColor={style.lo} />
                  </radialGradient>
                ))}
                <filter id="atlasPointGlow" x="-200%" y="-200%" width="500%" height="500%">
                  <feMorphology operator="dilate" radius="0.6" />
                  <feGaussianBlur stdDeviation="1.4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={hwaseongBoundary.d} />
              <g className="investment-map-islands">
                {Object.entries(islands as Record<string, { d: string }>).map(([name, island]) => (
                  <path key={name} d={island.d}><title>{name}</title></path>
                ))}
              </g>
              <g className="investment-map-gu-fills">
                {Object.entries(guOutlines as Record<string, { d: string; labelX: number; labelY: number }>).map(([name, gu]) => (
                  <path key={name} d={gu.d} fill={GU_COLORS[name]?.fill ?? "rgba(255,255,255,.05)"} />
                ))}
              </g>
              <g className="investment-map-dong-lines">
                {Object.values(dongOutlines as Record<string, string>).map((d, index) => (
                  <path key={index} d={d} />
                ))}
              </g>
              {Object.entries(guOutlines as Record<string, { d: string; labelX: number; labelY: number }>).map(([name, gu]) => {
                const lx = (gu.labelX / 100) * hwaseongBoundary.width;
                const ly = (gu.labelY / 100) * hwaseongBoundary.height;
                return (
                  <foreignObject key={name} x={lx - 52} y={ly - 20} width={104} height={40} className="investment-map-gu-label-box">
                    <div className="investment-map-gu-label-pill"><span>{name}</span></div>
                  </foreignObject>
                );
              })}
              {visiblePoints.map(({ project, x, y, isIsland }) => {
                const cx = (x / 100) * hwaseongBoundary.width;
                const cy = (y / 100) * hwaseongBoundary.height;
                const isSelected = selected?.id === project.id;
                const categoryStyle = categoryStyleFor(project.category);
                return (
                  <g
                    key={project.id}
                    className={`investment-map-point ${isSelected ? "is-selected" : ""}`}
                    transform={`translate(${cx} ${cy})`}
                    role="button"
                    tabIndex={0}
                    aria-label={`${project.project_name} 위치 보기${isIsland ? " (도서지역, 근사 위치)" : ""}`}
                    onClick={(event) => selectProjectAt(project, event)}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(project); setGalleryIndex(0); } }}
                    onMouseEnter={(event) => showHoverCardFor(project, event)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <title>{project.project_name} ({project.category || "미분류"}){isIsland ? " — 도서지역 (섬 위치는 추정)" : ""}</title>
                    {(() => {
                      const baseR = isSelected ? 9 : 7;
                      const fill = isSelected ? "#ffd83d" : `url(#atlasPointGradient-${categoryStyle.id})`;
                      return (
                        <>
                          <circle r={baseR} fill={fill} filter="url(#atlasPointGlow)" className="investment-map-point-core" />
                          <circle r={baseR} fill={fill} opacity="0.55" className="investment-map-point-ping">
                            <animate attributeName="r" from={baseR} to={baseR * 3.4} dur="2.2s" begin="0s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.55" to="0" dur="2.2s" begin="0s" repeatCount="indefinite" />
                          </circle>
                          {isIsland && <text className="investment-map-point-island-badge" y={-baseR - 5} textAnchor="middle">🏝</text>}
                        </>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="investment-map-filter-panel">
            <button
              type="button"
              className={`investment-map-filter-toggle ${isMapFilterOpen ? "is-open" : ""}`}
              onClick={() => setIsMapFilterOpen((open) => !open)}
            >
              조건별 분포보기{activeMapFilterCount > 0 ? ` (${activeMapFilterCount})` : ""} <ChevronDown size={12} />
            </button>
            {isMapFilterOpen && (
              <div className="investment-map-filter-options-combined">
                {renderMapFilterSection("사업분야", mapCategoryOptions, categoryFilter, setCategoryFilter)}
                {renderMapFilterSection("구청", mapZoneOptions, zoneFilter, setZoneFilter)}
                {renderMapFilterSection("소관부서", mapDeptOptions, deptFilter, setDeptFilter)}
                {activeMapFilterCount > 0 && (
                  <button
                    type="button"
                    className="investment-map-filter-reset"
                    onClick={() => { setCategoryFilter("전체"); setZoneFilter("전체"); setDeptFilter("전체"); }}
                  >
                    필터 초기화
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="investment-map-zoom-controls">
            <button type="button" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="지도 확대">+</button>
            <button type="button" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="지도 축소">−</button>
            <button type="button" className="is-reset" onClick={resetZoom} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label="지도 초기화">초기화</button>
          </div>
        </div>
        {/* Cards live outside the canvas (which clips overflow for panning/
            zoom) so they never get cut off near an edge; positioned via the
            same screen coordinates the canvas-relative math already computes. */}
        {hovered && hovered.id !== selected?.id && (
          <div className="investment-map-hover-card" style={{ left: `${hoverPosition.x}px`, top: `${hoverPosition.y}px` }}>
            <span>{hovered.category || "미등록"}</span>
            <strong>{hovered.project_name}</strong>
          </div>
        )}
        {selected && (() => {
          const gallery = selected.gallery_images ?? [];
          const active = gallery[galleryIndex] ?? gallery[0];
          const address = parseKvPairs(selected.overview).find((pair) => pair.label === "사업위치")?.value;
          return (
            <div className={`investment-map-select-card${selectedOpensDown ? " is-open-down" : ""}`} style={{ left: `${selectedPosition.x}px`, top: `${selectedPosition.y}px` }}>
              <button type="button" className="investment-map-select-card-close" onClick={() => setSelected(null)} aria-label="닫기"><X size={15} /></button>
              <div className="investment-map-select-card-media">
                {active ? (
                  <div className="investment-map-hero">
                    <img src={active.src} alt={active.alt || `${selected.project_name} 현장 이미지`} />
                    {gallery.length > 1 && <div className="investment-map-gallery-counter investment-map-hero-counter">{galleryIndex + 1} / {gallery.length}</div>}
                  </div>
                ) : (
                  <div className="investment-map-gallery-empty"><ImageIcon size={20} /><strong>현장 사진 준비 중</strong></div>
                )}
                {gallery.length > 1 && <div className="investment-map-gallery-thumbs">{gallery.map((image, index) => <button type="button" key={`${image.src}-${index}`} className={index === galleryIndex ? "is-active" : ""} onClick={() => setGalleryIndex(index)}><img src={image.src} alt="" /></button>)}</div>}
              </div>
              <div className="investment-map-select-card-body">
                <div className="investment-map-project-tags"><span>{selected.region || "주요사업"}</span><span>{selected.current_stage || "미등록"}</span></div>
                <h2>{selected.project_name}</h2>
                {address && <p className="investment-map-side-address">{address}</p>}
                <div className="investment-map-key-metrics">
                  <div><span>총사업비</span><strong>{formatBudgetNumber(selected.total_cost_million_krw ?? 0)}<small>백만원</small></strong></div>
                  <div><span>집행률</span><strong>{selected.execution_rate ?? selected.progress_rate ?? 0}<small>%</small></strong></div>
                </div>
                <div className="investment-map-progress">
                  <div><span>사업 전체 공정률</span><b>{selected.progress_rate ?? selected.execution_rate ?? 0}%</b></div>
                  <i><em style={{ width: `${Math.min(100, Math.max(0, selected.progress_rate ?? selected.execution_rate ?? 0))}%` }} /></i>
                </div>
                <dl className="investment-map-detail-list">
                  <div><dt>사업 유형</dt><dd>{selected.category || "미등록"}</dd></div>
                  <div><dt>준공 예정</dt><dd>{selected.inspection || "미등록"}</dd></div>
                </dl>
                <button type="button" className="investment-map-open-project" onClick={() => onSelectProject(selected)}>사업 상세 보기 <span>↗</span></button>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

function DepartmentDashboard({
  onSelectProject,
  initialDepartment,
}: {
  onSelectProject: (project: Project) => void;
  initialDepartment: string;
}) {
  const minBudget = "";
  const maxBudget = "";
  const [stageFilter, setStageFilter] = useState("전체");
  const [divisionFilter, setDivisionFilter] = useState("전체");
  const [isDivisionOpen, setIsDivisionOpen] = useState(false);
  const [isStageOpen, setIsStageOpen] = useState(false);
  const futurePlanBudgetFor = (project: Project) => project.card_budget_2028_plus_million_krw ?? 0;
  const departmentProjects = projects
    .filter((project) => project.department === initialDepartment)
    .sort((a, b) => a.serial - b.serial);
  const stageOptions = Array.from(new Set(departmentProjects.map((project) => project.current_stage).filter(Boolean))) as string[];
  const totalCost = departmentProjects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const investedAmount = departmentProjects.reduce((sum, project) => sum + (project.invested_to_2026_million_krw ?? 0), 0);
  const budget2027 = departmentProjects.reduce((sum, project) => sum + (project.budget_2027_million_krw ?? 0), 0);
  const futurePlanBudget = departmentProjects.reduce((sum, project) => sum + futurePlanBudgetFor(project), 0);
  const budgetValueFor = (project: Project) => futureBudgetFor(project);
  const filteredProjects = departmentProjects
    .filter((project) => stageFilter === "전체" || project.current_stage === stageFilter)
    .filter((project) => divisionFilter === "전체" || project.region === divisionFilter)
    .filter((project) => {
      const value = budgetValueFor(project);
      const min = minBudget === "" ? 0 : Number(minBudget);
      const max = maxBudget === "" ? Number.POSITIVE_INFINITY : Number(maxBudget);
      return value >= min && value <= max;
    });
  const filteredTotalCost = filteredProjects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const filteredInvested = filteredProjects.reduce((sum, project) => sum + (project.invested_to_2026_million_krw ?? 0), 0);
  const filteredBudget2027 = filteredProjects.reduce((sum, project) => sum + (project.budget_2027_million_krw ?? 0), 0);
  const filteredFuturePlan = filteredProjects.reduce((sum, project) => sum + futurePlanBudgetFor(project), 0);

  const exportBudgetCsv = () => {
    const headers = ["사업명", "추진단계", "총사업비", "기투자액", "2027년 편성예정액", "향후 계획예산액", "향후 필요예산", "진행률"];
    const rows = filteredProjects.map((project) => [
      project.project_name,
      project.current_stage || "미등록",
      project.total_cost_million_krw ?? 0,
      project.invested_to_2026_million_krw ?? 0,
      project.budget_2027_million_krw ?? 0,
      futurePlanBudgetFor(project),
      futureBudgetFor(project),
      `${parseProgress(project)}%`,
    ]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${initialDepartment}-추진현황-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <section className="dept-dashboard">
      <div className="dept-dashboard-header">
        <div>
          <p className="dept-dashboard-eyebrow">DEPARTMENT INVESTMENT CONTROL</p>
          <h1>{initialDepartment} 추진현황</h1>
        </div>
      </div>

      <div className="dept-kpi-grid dept-kpi-grid-selected">
        <div className="dept-kpi"><span>총사업비</span><strong>{formatDepartmentAmount(totalCost)}</strong></div>
        <div className="dept-kpi"><span>기투자액</span><strong>{formatDepartmentAmount(investedAmount)}</strong><small>2026년까지 누적 투자</small></div>
        <div className="dept-kpi dept-kpi-accent"><span>2027년 편성예정액</span><strong>{formatDepartmentAmount(budget2027)}</strong></div>
        <div className="dept-kpi"><span>향후 계획예산액</span><strong>{formatDepartmentAmount(futurePlanBudget)}</strong><small>2028년 이후 계획액</small></div>
      </div>

      <div className="dept-panel dept-panel-projects dept-panel-selected">
        <div className="dept-filter-row dept-budget-filter-row">
          <div className="dept-filter-accordion">
            <button type="button" className={`dept-filter-accordion-toggle ${isDivisionOpen ? "is-open" : ""}`} onClick={() => setIsDivisionOpen((open) => !open)}>구분{divisionFilter !== "전체" ? `: ${divisionFilter}` : ""} <ChevronDown size={13} /></button>
            {isDivisionOpen && (
              <div className="dept-filter-accordion-panel">
                {["전체", "신규", "계속"].map((option) => (
                  <button key={option} type="button" className={divisionFilter === option ? "is-active" : ""} onClick={() => { setDivisionFilter(option); setIsDivisionOpen(false); }}>{option}</button>
                ))}
              </div>
            )}
          </div>
          <div className="dept-filter-accordion">
            <button type="button" className={`dept-filter-accordion-toggle ${isStageOpen ? "is-open" : ""}`} onClick={() => setIsStageOpen((open) => !open)}>현추진단계{stageFilter !== "전체" ? `: ${stageFilter}` : ""} <ChevronDown size={13} /></button>
            {isStageOpen && (
              <div className="dept-filter-accordion-panel">
                <button type="button" className={stageFilter === "전체" ? "is-active" : ""} onClick={() => { setStageFilter("전체"); setIsStageOpen(false); }}>전체</button>
                {stageOptions.map((stage) => (
                  <button key={stage} type="button" className={stageFilter === stage ? "is-active" : ""} onClick={() => { setStageFilter(stage); setIsStageOpen(false); }}>{stage}</button>
                ))}
              </div>
            )}
          </div>
          <button type="button" className="dept-table-export" onClick={exportBudgetCsv}><Download size={14} /> CSV 출력</button>
          <span>(단위:백만원)</span>
        </div>
        <div className="dept-project-table-wrap">
          <table className="dept-project-table"><thead><tr><th>구분</th><th>사업명</th><th>현 추진단계</th><th>총사업비</th><th>기투자액</th><th>2027년 예산액</th><th>향후 계획예산액</th><th>집행률</th></tr></thead><tbody>
            {filteredProjects.length > 0 && <tr className="dept-total-row">
              <td></td><td><strong>합계</strong></td><td></td><td className="dept-amount-cell">{formatBudgetNumber(filteredTotalCost)}</td><td className="dept-amount-cell">{formatBudgetNumber(filteredInvested)}</td><td className="dept-amount-cell">{formatBudgetNumber(filteredBudget2027)}</td><td className="dept-amount-cell">{formatBudgetNumber(filteredFuturePlan)}</td><td></td>
            </tr>}
            {filteredProjects.map((project) => <tr key={project.id} onClick={() => onSelectProject(project)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onSelectProject(project); }}>
              <td><span className={`dept-project-type ${project.region === "신규" ? "is-new" : "is-continuing"}`}>{project.region === "신규" || project.region === "계속" ? project.region : "-"}</span></td><td><strong>{project.project_name}</strong><small>{project.district || project.town || "위치정보 미등록"}</small></td><td><span className="dept-stage-chip">{project.current_stage || "미등록"}</span></td><td className="dept-amount-cell">{formatBudgetNumber(project.total_cost_million_krw ?? 0)}</td><td className="dept-amount-cell">{formatBudgetNumber(project.invested_to_2026_million_krw ?? 0)}</td><td className="dept-amount-cell">{formatBudgetNumber(project.budget_2027_million_krw ?? 0)}</td><td className="dept-amount-cell">{formatBudgetNumber(futurePlanBudgetFor(project))}</td><td><div className="dept-progress"><span><em style={{ width: `${parseProgress(project)}%` }} /></span><b>{parseProgress(project)}%</b></div></td>
            </tr>)}
            {filteredProjects.length === 0 && <tr><td colSpan={8} className="dept-empty">조건에 맞는 사업이 없습니다.</td></tr>}
          </tbody></table>
        </div>
      </div>
    </section>
  );
}

function PodaSearch({ value, onChange, onFocus, onBlur }: { value: string; onChange: (value: string) => void; onFocus?: () => void; onBlur?: () => void }) {
  return (
    <div className="sidebar-search-simple">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
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
// Dot-matrix rotating globe behind the landing hero (WebGL via cobe),
// cropped by the panel so only its top arc shows, with a marker over
// Hwaseong. Auto-rotates; respects reduced-motion by freezing phi.
function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: 1600,
      height: 1600,
      phi: 0,
      theta: 0.32,
      dark: 1,
      diffuse: 1.2,
      scale: 1,
      mapSamples: 15000,
      mapBrightness: 14,
      baseColor: [0.55, 0.58, 0.66],
      markerColor: [0.31, 0.85, 0.77],
      glowColor: [0.4, 0.45, 0.55],
      markers: [],
    });
    let phi = 0;
    let frame = 0;
    if (!prefersReducedMotion) {
      const animate = () => {
        phi += 0.0022;
        globe.update({ phi });
        frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }
    return () => {
      cancelAnimationFrame(frame);
      globe.destroy();
    };
  }, []);

  return <canvas ref={canvasRef} className="landing-globe-canvas" aria-hidden="true" />;
}

// Floating pill nav, top-center, translucent glass style. Always shows all
// 3 items — HOME / MENU / MAP VIEW — in one static bar (ref: saasland.framer.media
// top-left pill, where only the active item gets a capsule background and
// the rest sit plain on the shared bar) so nothing shifts position on
// click. MENU toggles a horizontal strip of department links below the bar.
function FloatingNavBar({
  onGoHome,
  onOpenMap,
  onSelectDepartment,
  onSelectProject,
  activeDepartmentName,
}: {
  onGoHome: () => void;
  onOpenMap: () => void;
  onSelectDepartment: (departmentName: string) => void;
  onSelectProject: (project: Project) => void;
  activeDepartmentName: string | null;
  activeProjectDepartmentName: string | null;
}) {
  const floatingNavDepartments = ["문화예술과", "문화유산과", "관광진흥과", "도서관정책과", "체육진흥과", "전국체전추진단"];
  const projectsByDepartment = organization.flatMap((bureau) => bureau.departments);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [openDeptName, setOpenDeptName] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const openDept = openDeptName && showProjects ? projectsByDepartment.find((item) => item.name === openDeptName) : null;

  if (!isExpanded) {
    return (
      <nav className="floating-nav" aria-label="빠른 이동">
        <button type="button" className="floating-nav-link" onClick={() => setIsExpanded(true)}>MENU</button>
      </nav>
    );
  }

  return (
    <nav className="floating-nav" aria-label="빠른 이동">
      <button type="button" className="floating-nav-link" onClick={onGoHome}>HOME</button>
      <div className="floating-nav-item">
        <button
          type="button"
          className={`floating-nav-link ${isDeptOpen || activeDepartmentName ? "is-selected" : ""}`}
          onClick={() => setIsDeptOpen((open) => !open)}
          aria-expanded={isDeptOpen}
        >
          MENU
        </button>
        {isDeptOpen && (
          <div className="floating-nav-dropdown">
            <div className="floating-nav-dropdown-row">
              {floatingNavDepartments.map((name) => {
                const isSelected = openDeptName === name;
                return (
                  <button
                    type="button"
                    key={name}
                    className={isSelected ? "is-selected" : ""}
                    onClick={() => {
                      if (isSelected) {
                        setShowProjects((show) => !show);
                      } else {
                        onSelectDepartment(name);
                        setOpenDeptName(name);
                        setShowProjects(false);
                      }
                    }}
                  >
                    {isSelected && <i className="floating-nav-dot" />}
                    {name}
                  </button>
                );
              })}
            </div>
            {openDept && openDept.projects.length > 0 && (
              <div className="floating-nav-dropdown-projects">
                {openDept.projects.map((project) => (
                  <button
                    type="button"
                    key={project.id}
                    onClick={() => { onSelectProject(project); setIsDeptOpen(false); }}
                  >
                    {project.project_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <button type="button" className="floating-nav-link" onClick={onOpenMap}>MAP VIEW</button>
    </nav>
  );
}

// Counts up from 0 to `target` once on mount (landing hero metrics) using
// an eased requestAnimationFrame loop rather than a setInterval ticker, so
// the motion decelerates smoothly instead of stepping at a fixed rate.
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function LandingPage() {
  const totalBudget = projects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const averageExecution = projects.length > 0
    ? Math.round(projects.reduce((sum, project) => sum + parseProgress(project), 0) / projects.length)
    : 0;
  const projectCount = useCountUp(projects.length, 1100);
  const budgetCount = useCountUp(totalBudget, 1400);
  const executionCount = useCountUp(averageExecution, 1000);
  return (
    <section className="landing-page">
      <div className="hero-panel">
        <div className="landing-globe-wrap" aria-hidden="true">
          <Globe />
        </div>
        <div className="landing-orb landing-orb-a" />
        <div className="landing-orb landing-orb-b" />
        <div className="landing-orb landing-orb-c" />
        <div className="landing-noise" />
        <svg className="landing-arc" viewBox="0 0 1200 500" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="landingArcFade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#fff" stopOpacity="0" />
              <stop offset=".5" stopColor="#fff" stopOpacity=".5" />
              <stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 60 420 Q 600 -100 1140 170" stroke="url(#landingArcFade)" strokeWidth="0.7" fill="none" />
          <circle className="landing-arc-dot" cx="60" cy="420" r="2.2" />
          <circle className="landing-arc-dot" cx="1140" cy="170" r="2.2" />
        </svg>
        <div className="landing-content">
          <p className="landing-eyebrow"><span /> HWASEONG SPECIAL CITY <span /></p>
          <h1 className="landing-title"><span className="landing-title-line landing-title-line-a">MAJOR INVESTMENT</span><span className="landing-title-line landing-title-line-b">BUDGET</span></h1>
          <span className="landing-cta-pill">화성시 주요투자사업 대시보드</span>
        </div>
        <div className="landing-metrics" aria-label="주요 투자사업 요약">
          <div className="landing-metric"><span>전체 사업</span><strong>{Math.round(projectCount)}<em>개</em></strong><small>PROJECTS</small></div>
          <div className="landing-metric"><span>총사업비</span><strong>{formatBudgetNumber(Math.round(budgetCount))}<em>백만원</em></strong><small>TOTAL BUDGET</small></div>
          <div className="landing-metric"><span>평균 집행률</span><strong>{Math.round(executionCount)}%</strong><div className="landing-metric-track"><i style={{ width: `${averageExecution}%` }} /></div></div>
        </div>
      </div>
    </section>
  );
}

type LiquidMenuSection = {
  id: string;
  label: string;
  items: { label: string; onClick: () => void }[];
};

// Floating "liquid morph" pill (ref: a black capsule that widens into a
// bar with a CLOSE button, revealing a menu panel of sections/items below
// — sized down to match our compact button instead of the reference's
// full-width bar). The label and the right-side icon are separate click
// targets: the label navigates straight to the map, the icon toggles the
// menu panel open/closed.
// Builds a single crisp (unblurred) SVG outline for N side-by-side rounded
// segments joined by concave "pinched waist" curves — a vector version of
// the gooey-nav metaball look, exact instead of blur-approximated so it
// stays sharp at this small button scale.
function buildPinchedBarPath(segments: { left: number; width: number }[], height: number, neckDepth = 9) {
  if (segments.length === 0) return "";
  const r = height / 2;
  const first = segments[0];
  const last = segments[segments.length - 1];
  const top: string[] = [`M ${first.left + r} 0`];
  const bottom: string[] = [`L ${last.left + last.width - r} ${height}`];
  segments.forEach((segment, index) => {
    const right = segment.left + segment.width;
    top.push(`L ${index === segments.length - 1 ? right - r : right} 0`);
    if (index < segments.length - 1) {
      const next = segments[index + 1];
      const midX = (right + next.left) / 2;
      top.push(`Q ${midX} ${neckDepth} ${next.left} 0`);
    }
  });
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index];
    if (index === segments.length - 1) {
      bottom.push(`A ${r} ${r} 0 0 1 ${segment.left + segment.width} ${r}`, `L ${segment.left + segment.width} ${height - r}`, `A ${r} ${r} 0 0 1 ${segment.left + segment.width - r} ${height}`);
    }
    if (index > 0) {
      const prev = segments[index - 1];
      const midX = (segment.left + prev.left + prev.width) / 2;
      bottom.push(`L ${segment.left} ${height}`, `Q ${midX} ${height - neckDepth} ${prev.left + prev.width} ${height}`);
    } else {
      bottom.push(`L ${segment.left + r} ${height}`, `A ${r} ${r} 0 0 1 ${segment.left} ${height - r}`, `L ${segment.left} ${r}`, `A ${r} ${r} 0 0 1 ${segment.left + r} 0`);
    }
  }
  return [...top, ...bottom, "Z"].join(" ");
}

function LiquidMorphMenu({ label, onLabelClick, sections }: { label: string; onLabelClick: () => void; sections: LiquidMenuSection[] }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const barRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLButtonElement>(null);
  const infoRef = useRef<HTMLSpanElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [barPath, setBarPath] = useState("");
  const [barBox, setBarBox] = useState({ width: 0, height: 52 });

  useEffect(() => {
    if (!open) return;
    const measure = () => {
      const bar = barRef.current;
      if (!bar) return;
      const box = bar.getBoundingClientRect();
      const segments = [labelRef.current, infoRef.current, toggleRef.current]
        .filter((el): el is HTMLElement => el !== null)
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return { left: rect.left - box.left - 10, width: rect.width + 20 };
        });
      setBarBox({ width: box.width, height: box.height });
      setBarPath(buildPinchedBarPath(segments, box.height));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [open, label]);

  return (
    <div className="liquid-menu-wrap">
      <div className="liquid-menu-stack">
        <motion.div
          className="liquid-menu-shape"
          animate={{ width: open ? 340 : 224, height: 52, borderRadius: 18 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          {open ? (
            <div className="liquid-menu-bar" ref={barRef}>
              <svg className="liquid-menu-bar-svg" viewBox={`0 0 ${barBox.width} ${barBox.height}`} width={barBox.width} height={barBox.height} aria-hidden="true">
                <path d={barPath} className="liquid-menu-bar-fill" />
              </svg>
              <div className="liquid-menu-bar-labels">
                <button type="button" ref={labelRef} className="liquid-menu-label" onClick={onLabelClick}>
                  {label}
                </button>
                <span ref={infoRef} className="liquid-menu-info">전체 39개 사업</span>
                <button type="button" ref={toggleRef} className="liquid-menu-close" onClick={close} aria-label="메뉴 닫기">
                  CLOSE <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="liquid-menu-pill" onClick={() => setOpen(true)} aria-label="메뉴 열기">
              <span>{label}</span>
              <AlignRight size={18} strokeWidth={2.4} />
            </button>
          )}
        </motion.div>

        {open && (
          <div className="liquid-menu-panel-box" style={{ width: 340 }}>
            {sections.map((section) => (
              <div key={section.id} className="liquid-menu-section">
                <p className="liquid-menu-section-label">{section.label}</p>
                {section.items.map((item) => (
                  <button key={item.label} type="button" className="liquid-menu-item" onClick={() => { item.onClick(); close(); }}>
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {

  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDepartmentDashboard, setSelectedDepartmentDashboard] = useState("전체");
  const [activeView, setActiveView] = useState<"landing" | "project" | "department" | "map">("landing");

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
  const searchMatches = useMemo(
    () =>
      normalizedQuery
        ? visibleOrganization.flatMap((bureau) =>
            bureau.departments.flatMap((department) =>
              department.projects.map((project) => ({ project, departmentName: department.name })),
            ),
          )
        : [],
    [normalizedQuery, visibleOrganization],
  );

  const goLanding = () => {
    setSelectedProject(null);
    setActiveView("landing");
    setQuery("");
  };
  const goMap = () => {
    setSelectedProject(null);
    setActiveView("map");
  };
  const goDepartment = (departmentName: string) => {
    setSelectedDepartmentDashboard(departmentName);
    setSelectedProject(null);
    setActiveView("department");
  };
  const goProject = (project: Project) => {
    setSelectedProject(project);
    setActiveView("project");
    setQuery("");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--pd-ground)] text-white">
      {createPortal(
        <button type="button" className="site-logo-mark" onClick={goLanding} aria-label="홈으로 이동">
          HIB.
        </button>,
        document.body,
      )}
      <FloatingNavBar
        onGoHome={goLanding}
        onOpenMap={goMap}
        onSelectDepartment={goDepartment}
        onSelectProject={goProject}
        activeDepartmentName={activeView === "department" ? selectedDepartmentDashboard : null}
        activeProjectDepartmentName={activeView === "project" ? selectedProject?.department ?? null : null}
      />

      <main className={`app-main relative flex-1 overflow-hidden ${activeView === "landing" ? "app-main-flush" : ""}`}>
          <div className="pointer-events-none absolute right-[8%] top-[-8%] h-[520px] w-[170px] rotate-[24deg] rounded-full bg-[var(--pd-accent-a)]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8%] right-[17%] h-[440px] w-[145px] -rotate-[28deg] rounded-full bg-[var(--pd-accent-b)]/25 blur-3xl" />
          {selectedProject && <div className="app-panel-topbar" aria-hidden="true" />}
          {activeView === "map" ? (
            <InvestmentDistribution projects={projects} onBack={() => setActiveView("landing")} onSelectProject={(project) => { setSelectedProject(project); setActiveView("project"); }} />
          ) : activeView === "department" ? (
            <DepartmentDashboard key={selectedDepartmentDashboard} initialDepartment={selectedDepartmentDashboard} onSelectProject={(project) => { setSelectedProject(project); setActiveView("project"); }} />
          ) : activeView === "project" && selectedProject ? (
            <div className="detail-panel-shell">
              <ProjectDetail project={selectedProject} />
            </div>
          ) : (
            <LandingPage />
          )}
      </main>
    </div>
  );
}
