import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type FormEvent as ReactFormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  ClipboardCheck,
  Download,
  AlignRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Search,
  Lock,
  ArrowRight,
  Pencil,
  Save,
  Plus,
  ChevronUp,
} from "lucide-react";
import {
  TagIcon,
  WalletMoneyIcon,
  ChartProgressIcon,
  CardSendIcon,
  CalendarMarkIcon,
  BuildingsIcon,
  GraphUpIcon,
  CalendarAddIcon,
  RefreshCircleIcon,
  SafeIcon,
  LayersIcon,
  ShieldCheckIcon,
  GalleryIcon,
} from "@/components/icons/solar";
import dataset from "../data/dashboard_projects.json";
import hwaseongBoundary from "../data/hwaseong-boundary.json";
import dongOutlines from "../data/hwaseong-dong-outlines.json";
import guOutlines from "../data/hwaseong-gu-outlines.json";
import islands from "../data/hwaseong-islands.json";
import dongLonLat from "../data/hwaseong-dong-lonlat.json";
import coastalLonLat from "../data/hwaseong-coastal-lonlat.json";
import { HwaseongGLMap } from "../components/HwaseongGLMap";
import { InvestmentRealMap } from "../components/InvestmentRealMap";

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

// 이 대시보드의 모든 금액은 2027년 본예산 요구시기(2026.9.)에 제출된 자료가 기준이다.
// 그래서 연도별로 갈리는 화면(성질별 예산 등)도 2027년을 먼저 보여준다. 숫자를 읽는 사람이
// "언제 기준인지"를 화면에서 바로 알 수 있도록 부서 현황과 사업 예산현황에 함께 표기한다.
const BUDGET_BASELINE_LABEL = "기준 2026.9. · 2027년 본예산 요구";
const bureauFor = (department: string) =>
  ["문화예술과", "문화유산과", "독립기념관", "관광진흥과"].includes(department) ? "문화관광국" : "교육체육국";

const BUREAU_ORDER = ["문화관광국", "교육체육국"];
const DEPARTMENT_ORDER = ["문화예술과", "문화유산과", "독립기념관", "관광진흥과", "도서관정책과", "체육진흥과", "전국체전추진단"];

const buildOrganization = (sourceProjects: Project[]): Bureau[] => Object.values(
  sourceProjects.reduce<Record<string, Bureau>>((acc, project) => {
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

// One consistent teal accent across every department's project detail page —
// used to be a different color per department, which read as inconsistent
// alongside the department dashboard's single gold accent.
const DEFAULT_COLOR = { from: "#2fb8c4", to: "#5cd6e0" };
const colorFor = (_department: string) => DEFAULT_COLOR;

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

type TimelineGroup = { label: string; items: TimelineEntry[] };
// 향후계획을 "[구간명] 내용" 형태로 태그해두면 여러 세부사업(예: 공원 조성 + 진입도로 개설)을
// 한 박스 안에 위아래로 나눠서 보여준다. 태그가 없으면 기존처럼 그룹 구분 없이 하나로 표시된다.
function groupTimeline(entries: TimelineEntry[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];
  const indexByLabel = new Map<string, number>();
  entries.forEach((entry) => {
    const match = entry.desc.match(/^\[([^\]]+)\]\s*(.*)$/);
    const label = match ? match[1] : "";
    const desc = match ? match[2] : entry.desc;
    if (!indexByLabel.has(label)) {
      indexByLabel.set(label, groups.length);
      groups.push({ label, items: [] });
    }
    groups[indexByLabel.get(label)!].items.push({ date: entry.date, desc });
  });
  return groups;
}

const MILESTONE_WORDS = ["준공", "개관"];
const milestoneRegex = new RegExp(`(${MILESTONE_WORDS.join("|")})`, "g");
function highlightMilestones(text: string): ReactNode {
  const parts = text.split(milestoneRegex);
  if (parts.length === 1) return text;
  return parts.map((part, index) =>
    MILESTONE_WORDS.includes(part) ? <span key={index} className="pd-progress-milestone">{part}</span> : part
  );
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
      {/* 거점 위치도(SpotMapCard)는 여기 있었는데, 조감도와 함께 "위치도" 탭으로 옮겼다
          (ProjectDetail의 activeTab === "위치도" 분기 참고). */}
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

// 재원별 예산(funding source) rows label their "기타" bucket 지방채 — this is
// a different taxonomy from 성질별 예산's 기타 (expense nature), so the
// rename is scoped to just the funding table, not the shared helper above.
function displayFundingSourceName(name: string) {
  const cleaned = displayBreakdownName(name);
  return cleaned === "기타" ? "지방채" : cleaned;
}

function DetailSectionHeading({ icon: Icon, title, subtitle, tone = "neutral" }: { icon: ComponentType<{ size?: number; strokeWidth?: number }>; title: string; subtitle?: string; tone?: "neutral" | "budget" }) {
  return <div className="pd-section-heading"><span className={`pd-section-icon pd-section-icon-${tone}`}><Icon size={17} strokeWidth={2.1} />{tone === "budget" && <i aria-hidden="true" />}</span><div><p className="pd-section-heading-title">{title}</p>{subtitle && <p className="pd-section-heading-subtitle">{subtitle}</p>}</div></div>;
}

type YearlyExecutionEntry = { key: string; label: string; kind: "execution" | "allocation"; rate: number };

// 2026 is the only year with a real before/after investment snapshot
// (card_invested_to_2025 → card_invested_to_2026), so it's the only year we
// can report a genuine execution rate for. 2027 and beyond haven't happened
// yet, so they're shown as an allocation share of the total project cost
// instead of a fabricated execution number.
function buildYearlyExecution(project: Project, total: number | null): YearlyExecutionEntry[] {
  const investedTo2025 = project.card_invested_to_2025_million_krw;
  const investedTo2026 = project.card_invested_to_2026_million_krw ?? project.invested_to_2026_million_krw;
  const executed2026 = investedTo2025 != null && investedTo2026 != null ? Math.max(0, investedTo2026 - investedTo2025) : null;

  const entries: { key: string; label: string; budget: number; executed: number | null }[] = [
    { key: "2026", label: "2026년", budget: project.card_budget_2026_million_krw ?? 0, executed: executed2026 },
    { key: "2027", label: "2027년", budget: project.card_budget_2027_million_krw ?? project.budget_2027_million_krw ?? 0, executed: null },
    { key: "2028+", label: "2028년 이후", budget: project.card_budget_2028_plus_million_krw ?? 0, executed: null },
  ];

  return entries.map(({ key, label, budget, executed }) => {
    if (executed != null && budget > 0) {
      return { key, label, kind: "execution" as const, rate: Math.min(100, Math.max(0, Math.round((executed / budget) * 100))) };
    }
    const share = total && total > 0 ? Math.min(100, Math.max(0, Math.round((budget / total) * 100))) : 0;
    return { key, label, kind: "allocation" as const, rate: share };
  });
}

function FundingBreakdownCard({ rows, note, yearlyExecution, projectId }: { rows: BreakdownRow[]; note?: string; yearlyExecution: YearlyExecutionEntry[]; projectId: string }) {
  const columns: { key: keyof BreakdownRow; label: string }[] = [
    { key: "total", label: "재원별 총예산" },
    { key: "invested", label: "기투자" },
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "이후" },
  ];
  return <div className="pd-budget-panel"><div className="pd-budget-panel-heading"><DetailSectionHeading icon={SafeIcon} tone="budget" title="재원별 예산" /><span className="pd-budget-panel-caption">(단위:백만원)</span></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-funding-table-wrap"><table className="pd-funding-table"><thead><tr><th>구분</th>{columns.map((column) => <th key={String(column.key)}>{column.label}</th>)}</tr></thead><tbody><tr className="is-total"><th>총사업비</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(sumBreakdown(rows, column.key))}</td>)}</tr>{rows.map((row) => <tr key={row.name}><th>{displayFundingSourceName(row.name)}</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(row[column.key] as number | null | undefined)}</td>)}</tr>)}</tbody></table></div>}{note && <p className="pd-note-box mt-3 !text-[12px]">{note}</p>}<div className="pd-budget-panel-heading pd-exec-rate-heading"><DetailSectionHeading icon={CardSendIcon} tone="budget" title="예산 집행률" /></div><div className="pd-yearly-exec">{yearlyExecution.map(({ key, label, rate }) => <div className="pd-yearly-exec-col" key={`${projectId}-${key}`}><span className="pd-yearly-exec-value">{rate}%</span><div className="pd-yearly-exec-bar"><div className={`pd-yearly-exec-bar-fill ${key === "2026" ? "is-current" : "is-future"}`} style={{ height: `${rate}%` }} /></div><span className="pd-yearly-exec-label">{label}</span></div>)}</div></div>;
}

const usageColors = ["#5b7fbd", "#58c7b1", "#e8b84a", "#c9915a", "#8a8378"];
const usageColorNames = ["공사", "감리", "설계", "부대", "기타"];

function UsageBreakdownChart({ rows, note }: { rows: BreakdownRow[]; note?: string }) {
  const years: { key: BudgetYearKey; label: string }[] = [
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "2028년 이후" },
  ];
  // 성질별 예산은 2027년 편성을 기준으로 본다(예전 기본값이 2026년이라 화면을 열면 늘 지난해
  // 숫자가 먼저 보였다).
  const [selectedYear, setSelectedYear] = useState<BudgetYearKey>("budget_2027");
  const selectedLabel = years.find((year) => year.key === selectedYear)?.label ?? "2026년";
  const selectedTotal = sumBreakdown(rows, selectedYear);
  const usageTotal = sumBreakdown(rows, "total");
  const selectedShare = usageTotal > 0 ? (selectedTotal / usageTotal) * 100 : 0;
  const yearTotals = years.map((year) => sumBreakdown(rows, year.key));
  const flowValues = [sumBreakdown(rows, "invested"), ...yearTotals];
  const maxFlowValue = Math.max(...flowValues, 1);
  const flowX = (index: number) => 20 + index * (280 / (flowValues.length - 1));
  const flowY = (value: number) => 46 - (value / maxFlowValue) * 30;
  const points = flowValues.map((value, index) => `${flowX(index)},${flowY(value)}`).join(" ");
  const usageRows = rows.map((row) => ({ row, value: (row[selectedYear] as number | null | undefined) ?? 0 })).sort((a, b) => b.value - a.value);
  const usageColorFor = (name: string) => usageColors[Math.max(0, usageColorNames.indexOf(name)) % usageColors.length];
  return <div className="pd-budget-panel pd-usage-panel"><div className="pd-budget-panel-heading"><DetailSectionHeading icon={LayersIcon} tone="budget" title="성질별 예산" /></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-pulse-content"><div className="pd-year-switcher" role="tablist" aria-label="예산 연도 선택">{years.map((year) => <button key={year.key} type="button" className={selectedYear === year.key ? "is-active" : ""} onClick={() => setSelectedYear(year.key)}>{year.label}</button>)}</div><div className="pd-pulse-summary"><div><span className="pd-pulse-eyebrow">{selectedLabel} 편성 예산</span><strong>{formatMillion(selectedTotal || null)}</strong><span className="pd-pulse-positive">전체 사업비의 {selectedShare.toFixed(1)}%</span></div><div className="pd-pulse-donut" style={{ background: `conic-gradient(var(--pd-accent-a) ${selectedShare}%, rgba(255,255,255,.1) 0)` }}><span>{selectedShare.toFixed(0)}%</span><small>전체</small></div></div><div className="pd-usage-progress-list">{usageRows.map(({ row, value }) => { const share = selectedTotal > 0 ? (value / selectedTotal) * 100 : 0; return <div className="pd-usage-progress-row" key={row.name}><div className="pd-usage-progress-label"><span>{displayBreakdownName(row.name)}</span><b>{formatMillion(value || null)}</b><strong>{share.toFixed(0)}%</strong></div><div className="pd-usage-progress-track"><span style={{ width: `${share}%`, background: usageColorFor(row.name) }} /></div></div>; })}</div><div className="pd-usage-legend pd-usage-legend-top">{usageColorNames.map((name, index) => <span key={name}><i style={{ background: usageColors[index] }} />{name}</span>)}</div><div className="pd-pulse-trend"><div className="pd-pulse-section-label"><span className="pd-pulse-eyebrow">연도별 예산 흐름</span></div><svg viewBox="0 0 320 80" role="img" aria-label="연도별 예산 흐름"><polyline points={points} fill="none" stroke="var(--pd-accent-a)" strokeWidth="0.5" strokeDasharray="0.5 1.5" strokeLinecap="round" strokeLinejoin="round" />{flowValues.map((value, index) => <circle key={`flow-dot-${index}`} cx={flowX(index)} cy={flowY(value)} r="5" fill="var(--pd-accent-a)" />)}{flowValues.map((value, index) => <text key={`flow-num-${index}`} x={flowX(index)} y={flowY(value) - 9} textAnchor="middle" className="pd-pulse-flow-value">{formatMillion(value || null)}</text>)}{["기투자", "2026년", "2027년", "이후"].map((axisLabel, index) => <text key={axisLabel} x={flowX(index)} y="70" textAnchor="middle" className="pd-pulse-axis-label">{axisLabel}</text>)}</svg></div>{note && <p className="pd-note-box mt-3 !text-[12px]">{note}</p>}</div>}</div>;
}

function formatMillion(value: number | null | undefined) {
  return value == null ? "-" : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function BudgetPanel({ project }: { project: Project }) {
  const total = project.card_total_budget_million_krw ?? project.total_cost_million_krw;
  const invested = project.card_invested_to_2026_million_krw ?? project.invested_to_2026_million_krw ?? project.card_invested_to_2025_million_krw;
  const budget = project.budget_2026_hide ? null : project.card_budget_2027_million_krw ?? project.budget_2027_million_krw;
  const executionAmount = project.card_execution_amount_million_krw;
  const yearlyExecution = buildYearlyExecution(project, total);
  const carryoverItems = project.carryover_items?.length
    ? project.carryover_items
    : project.carryover_million_krw != null
      ? [{ label: project.project_name, type: project.carryover_type ?? "이월", amount_million_krw: project.carryover_million_krw }]
      : [];
  const carryoverTotal = carryoverItems.length ? carryoverItems.reduce((sum, item) => sum + item.amount_million_krw, 0) : null;
  const carryoverLabel = carryoverItems.length === 1 ? `이월액 · ${carryoverItems[0].type}` : "이월액";
  const budgetCards = [
    { label: "총사업비", value: total, icon: WalletMoneyIcon, tone: "teal", carryoverItems: undefined },
    { label: "기투자액 (~2026)", value: invested, icon: GraphUpIcon, tone: "teal", carryoverItems: undefined },
    { label: "2027년 예산액", value: budget, icon: CalendarAddIcon, tone: "teal", carryoverItems: undefined },
    { label: carryoverLabel, value: carryoverTotal, icon: RefreshCircleIcon, tone: "teal", carryoverItems },
    { label: "집행액", value: executionAmount, icon: CardSendIcon, tone: "teal", carryoverItems: undefined },
  ] as const;
  return (
    <div className="pd-card">
      <p className="pd-baseline-note">{BUDGET_BASELINE_LABEL}</p>
      <div className="pd-exec-grid">{budgetCards.map(({ label, value, icon: Icon, tone, carryoverItems: items }, index) => <div key={label} className={`pd-exec-card pd-exec-card-${tone} ${index === 0 ? "is-primary" : ""}`}><div className="pd-exec-card-top"><span className="pd-exec-icon"><Icon size={17} strokeWidth={2.2} /></span><span className="label">{label}</span></div><span className="num">{formatMillion(value)}<small>백만원</small></span>{items && items.length > 1 && <div className="pd-carryover-list">{items.map((item) => <span key={`${item.label}-${item.type}`}><b>{item.type}</b> {formatMillion(item.amount_million_krw)}</span>)}</div>}<span className="pd-exec-card-glow" aria-hidden="true" /></div>)}</div>
      <div className="pd-budget-breakdown-grid"><FundingBreakdownCard rows={project.funding_breakdown} yearlyExecution={yearlyExecution} projectId={project.id} /><UsageBreakdownChart rows={project.usage_breakdown} note={project.usage_breakdown_note} /></div>
      {!project.management_card_matched && <p className="pd-note-box mt-4 text-amber-300">해당 사업의 사업별 관리카드가 검색되지 않아 총괄표 기준으로 표시합니다.</p>}
    </div>
  );
}

function ProgressPanel({ project }: { project: Project }) {
  const percent = progressPercent(project);
  const past = parseTimeline(project.progress_status);
  const upcoming = parseTimeline(project.future_plan);
  const upcomingGroups = groupTimeline(upcoming);
  return (
    <div className="pd-card">
      <div className="pd-progress-summary mb-6 flex flex-wrap gap-8">
        <div><p className="pd-summary-label !text-[16px]">사업 진척도</p><p className="pd-summary-value mt-1 !text-[20px]">{percent}%</p></div>
        <div><p className="pd-summary-label !text-[16px]">추진상황 점검</p><p className="pd-summary-value mt-1 !text-[20px] text-[var(--pd-success)]">{project.delay_reason || "-"}</p></div>
        <div><p className="pd-summary-label !text-[16px]">준공예정일</p><p className="pd-summary-value mt-1 !text-[20px]">{formatDateText(project.inspection || "-")}</p></div>
      </div>
      <div className="pd-progress-layout">
        <section className="pd-progress-section pd-progress-vertical">
          <div className="pd-progress-heading"><DetailSectionHeading icon={ChartProgressIcon} tone="budget" title="추진경과" /></div>
          {past.length > 0 ? <div className="pd-progress-vertical-list">{past.map((item, index) => <div key={index} className={`pd-progress-vertical-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{item.desc}</div></div></div>)}</div> : <div className="pd-note-box">등록된 추진현황이 없습니다.</div>}
        </section>
        <section className="pd-progress-section pd-progress-horizontal">
          <div className="pd-progress-heading"><DetailSectionHeading icon={CalendarAddIcon} tone="budget" title="향후계획" /></div>
          {upcoming.length > 0 ? upcomingGroups.map((group, gi) => (
            <div className="pd-progress-horizontal-group" key={gi}>
              {group.label && <div className="pd-progress-group-label">{group.label}</div>}
              <div className="pd-progress-horizontal-track" style={{ ["--pd-progress-cols" as string]: Math.min(group.items.length, 7) } as CSSProperties}><div className="pd-progress-horizontal-line" />{group.items.map((item, index) => <div key={index} className={`pd-progress-horizontal-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{highlightMilestones(item.desc)}</div></div></div>)}</div>
            </div>
          )) : <div className="pd-note-box">등록된 향후 추진계획 정보가 없습니다.</div>}
          {/* 향후계획 박스는 왼쪽 추진경과보다 보통 짧아서 아래에 빈 공간이 남는다(그리드
              align-items:stretch로 두 박스 높이가 맞춰지기 때문) - 그 공간에 자유 메모(진행사항)
              박스를 붙인다. 편집은 "사업 정보 편집" 폼의 progress_notes 칸에서 한다. */}
          <div className="pd-progress-notes">
            <div className="pd-progress-notes-inner">
              <p className="pd-progress-notes-title">진행사항</p>
              {project.progress_notes && project.progress_notes.trim() && project.progress_notes.trim() !== "0" ? (
                <p className="pd-progress-notes-body">{project.progress_notes}</p>
              ) : (
                <p className="pd-progress-notes-empty">작성된 메모가 없습니다. 관리자 로그인 후 "사업 정보 편집"에서 작성할 수 있습니다.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminPanel({ project }: { project: Project }) {
  const status = project.card_admin_status || {};
  const checks = [["중기재정", status.mid_term_fiscal], ["투·융자심사", status.investment_review], ["공유재산", status.public_property], ["해당없음", status.none]] as const;
  return <div className="pd-card pd-admin-card"><div className="pd-card-title"><DetailSectionHeading icon={ShieldCheckIcon} tone="budget" title="사전절차 이행여부" /></div>{project.management_card_matched ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{checks.map(([label, checked]) => <div key={label} className={`rounded-xl border px-4 py-4 ${checked ? "border-white/25 bg-white/[0.06]" : "border-[var(--pd-border)] bg-white/[0.02]"}`}><span className={`text-[15px] font-medium ${checked ? "text-[var(--pd-text)]" : "text-[var(--pd-text-muted)]"}`}>{checked ? "■" : "□"} {label}</span></div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="pd-kv"><span className="pd-kv-label">선택된 절차</span><span className="pd-kv-value">{project.card_admin_procedures || "-"}</span></div><div className="pd-kv"><span className="pd-kv-label">법적근거</span><span className="pd-kv-value">{project.card_admin_legal_basis || "-"}</span></div></div></> : <div className="pd-note-box">해당 사업의 사업별 관리카드가 검색되지 않았습니다.</div>}</div>;
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
  const renderings = project.rendering_images ?? [];
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (renderings.length === 0) return null;

  return (
    <div className="pd-card">
      <div className="pd-card-title"><DetailSectionHeading icon={GalleryIcon} title="조감도" /></div>
      <div className="pd-rendering-grid" data-count={Math.min(renderings.length, 4)}>
        {renderings.map((src, index) => (
          <button type="button" key={src} className="pd-rendering-thumb" onClick={() => setLightboxIndex(index)} aria-label={`${project.project_name} 조감도 ${index + 1} 확대 보기`}>
            <img src={src} alt={`${project.project_name} 조감도 ${index + 1}`} />
          </button>
        ))}
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

  return createPortal(
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
    </div>,
    document.body,
  );
}
const SITE_PASSWORD = "51897225";
const SITE_UNLOCK_STORAGE_KEY = "hib-site-unlocked";

function SitePasswordButton({ unlocked, onUnlock }: { unlocked: boolean; onUnlock: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    if (value === SITE_PASSWORD) {
      localStorage.setItem(SITE_UNLOCK_STORAGE_KEY, "1");
      onUnlock();
      setValue("");
      setError(false);
    } else {
      setError(true);
    }
  };

  if (unlocked) {
    return (
      <button
        type="button"
        className="styled-button-circle"
        aria-label="다시 잠그기"
        title="다시 잠그기"
        onClick={() => { localStorage.removeItem(SITE_UNLOCK_STORAGE_KEY); onUnlock(); }}
      >
        <Lock className="icon" />
      </button>
    );
  }

  return (
    <div className="site-password-hover">
      {open ? (
        <form className="styled-button-pill" onSubmit={submit}>
          <input
            type="text"
            value={value}
            onChange={(event) => { setValue(event.target.value); setError(false); }}
            placeholder="비밀번호"
            className={`styled-button-input ${error ? "is-error" : ""}`}
          />
          <button
            type={value.trim() ? "submit" : "button"}
            className="inner-button"
            aria-label={value.trim() ? "입장" : "비밀번호 입력창 닫기"}
            onClick={() => { if (!value.trim()) { setOpen(false); setError(false); } }}
          >
            <ArrowRight className="icon" />
          </button>
        </form>
      ) : (
        <button type="button" className="styled-button-circle" aria-label="비밀번호 입력창 열기" title="비밀번호" onClick={() => setOpen(true)}>
          <ArrowRight className="icon" />
        </button>
      )}
    </div>
  );
}

// Inline admin login: swaps a "관리자 로그인" button for a small password
// field on click, submits it via tRPC, and reports success so the caller can
// refetch auth.me. Used in both the project-detail header and the map view.
function AdminLoginControl({ className, onLoggedIn }: { className?: string; onLoggedIn: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setOpen(false);
      setValue("");
      setError(null);
      onLoggedIn();
    },
    onError: (mutationError) => setError(mutationError.message || "로그인에 실패했습니다."),
  });

  const submit = (event: ReactFormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim() || loginMutation.isPending) return;
    loginMutation.mutate({ password: value });
  };

  return (
    <div className="pd-admin-login-wrap">
      {open ? (
        <form className="pd-admin-login-form" onSubmit={submit}>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(event) => { setValue(event.target.value); setError(null); }}
            onBlur={() => { if (!value.trim()) setOpen(false); }}
            placeholder="관리자 비밀번호"
            className={error ? "is-error" : ""}
          />
          <button type="submit" disabled={loginMutation.isPending} aria-label="로그인">
            <ArrowRight size={13} />
          </button>
          {error && <span className="pd-admin-login-error">{error}</span>}
        </form>
      ) : (
        <button type="button" className={className} onClick={() => setOpen(true)}>
          <Lock size={14} /> 관리자 로그인
        </button>
      )}
    </div>
  );
}

const TABS = ["사업개요·추진현황", "예산현황", "위치도"] as const;

function ProjectDetail({ project, lock, searchValue, onSearchChange, searchProjects, onSelectProject, isAdmin, onProjectUpdated, onAdminLoggedIn }: { project: Project; lock?: { isUnlocked: boolean; onLock: () => void; onRequestUnlock: () => void }; searchValue: string; onSearchChange: (value: string) => void; searchProjects: Project[]; onSelectProject: (project: Project) => void; isAdmin?: boolean; onProjectUpdated?: (projectId: string, patch: Partial<Project>) => void; onAdminLoggedIn: () => void }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("사업개요·추진현황");
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Project>>({});
  const saveProjectContent = trpc.projectContent.save.useMutation();
  const projectContentUtils = trpc.useUtils();
  useEffect(() => { setEditDraft({}); setIsEditing(false); }, [project.id]);
  const beginEdit = () => {
    setEditDraft({
      project_name: project.project_name, region: project.region, current_stage: project.current_stage,
      total_cost_million_krw: project.total_cost_million_krw, card_total_budget_million_krw: project.card_total_budget_million_krw,
      invested_to_2026_million_krw: project.invested_to_2026_million_krw, card_invested_to_2025_million_krw: project.card_invested_to_2025_million_krw, card_invested_to_2026_million_krw: project.card_invested_to_2026_million_krw,
      card_budget_2026_million_krw: project.card_budget_2026_million_krw,
      budget_2027_million_krw: project.budget_2027_million_krw, card_budget_2027_million_krw: project.card_budget_2027_million_krw,
      card_execution_amount_million_krw: project.card_execution_amount_million_krw,
      carryover_million_krw: project.carryover_million_krw ?? null,
      execution_rate: project.execution_rate, progress_rate: project.progress_rate, inspection: project.inspection,
      district: project.district, town: project.town, contact: project.contact,
      overview: project.overview, progress_status: project.progress_status, future_plan: project.future_plan,
      progress_notes: project.progress_notes,
      card_admin_procedures: project.card_admin_procedures, card_admin_status: { ...project.card_admin_status },
      funding_breakdown: project.funding_breakdown.map((row) => ({ ...row })),
      usage_breakdown: project.usage_breakdown.map((row) => ({ ...row })),
    });
    setIsEditing(true);
  };
  const updateDraft = (key: keyof Project, value: string | number | null) => setEditDraft((draft) => ({ ...draft, [key]: value }));
  const updateDraftGroup = (keys: (keyof Project)[], value: number | null) =>
    setEditDraft((draft) => { const patch: Partial<Project> = {}; keys.forEach((key) => { (patch as Record<string, unknown>)[key] = value; }); return { ...draft, ...patch }; });
  const updateBreakdownRow = (kind: "funding_breakdown" | "usage_breakdown", index: number, field: keyof BreakdownRow, value: number | null) =>
    setEditDraft((draft) => {
      const rows = (draft[kind] ?? project[kind]).map((row, i) => (i === index ? { ...row, [field]: value } : row));
      return { ...draft, [kind]: rows };
    });
  const updateAdminStatus = (field: keyof Project["card_admin_status"], value: boolean) =>
    setEditDraft((draft) => ({ ...draft, card_admin_status: { ...(draft.card_admin_status ?? project.card_admin_status), [field]: value } }));
  const renderBreakdownEditor = (kind: "funding_breakdown" | "usage_breakdown", title: string) => {
    const rows = editDraft[kind] ?? project[kind];
    return (
      <label className="pd-editor-wide pd-editor-breakdown" key={kind}>
        <span>{title}</span>
        <div className="pd-editor-breakdown-table">
          <div className="pd-editor-breakdown-row pd-editor-breakdown-head"><span>구분</span><span>총계</span><span>기투자</span><span>2026년</span><span>2027년</span></div>
          {rows.map((row, index) => (
            <div className="pd-editor-breakdown-row" key={`${kind}-${row.name}-${index}`}>
              <span>{displayBreakdownName(row.name)}</span>
              {(["total", "invested", "budget_2026", "budget_2027"] as (keyof BreakdownRow)[]).map((field) => (
                <input key={String(field)} type="number" value={String((row[field] as number | null) ?? "")} onChange={(event) => updateBreakdownRow(kind, index, field, event.target.value === "" ? null : Number(event.target.value))} />
              ))}
            </div>
          ))}
        </div>
      </label>
    );
  };
  const commitEdit = async () => {
    // 저장은 병합이 아니라 덮어쓰기라서, 정적 데이터셋에 없는 "행 추가"로 만든 사업(id가
    // custom-row- 로 시작)은 이 편집 폼에 없는 필드(부서·구분 등)까지 포함해 전체를 다시 보내야
    // 한다 - editDraft만 보내면 그 필드들이 통째로 사라진다. 기존 사업은 정적 베이스가 있어서
    // 지금처럼 editDraft(부분)만 보내도 안전하다.
    const payload = isCustomRowId(project.id) ? { ...project, ...editDraft } : editDraft;
    const result = await saveProjectContent.mutateAsync({ projectId: project.id, payload: payload as Record<string, unknown> });
    onProjectUpdated?.(project.id, result.payload as Partial<Project>);
    await projectContentUtils.projectContent.list.invalidate();
    setIsEditing(false);
  };
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab("사업개요·추진현황");
    setSelectedSubIndex(0);
  }, [project.id]);

  const hasSubProjects = (project.sub_projects?.length ?? 0) > 1 || project.project_name === "서해안 관광벨트 주차장 및 도로 조성";
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

      <div className={`pd-detail-title-row flex flex-wrap items-center gap-4${hasSubProjects ? " is-inline-subproject" : ""}`}>
        <div className="pd-detail-title-block">
          <p className="pd-detail-eyebrow">PROJECT INVESTMENT DETAIL</p>
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
          {/* 로그인 자체는 헤더가 전역으로 담당한다(Home 컴포넌트, isAdmin 기준) - 여기서는 이미
              로그인된 상태에서만 이 사업의 편집을 시작하는 버튼을 같은 슬롯에 포개 얹는다. */}
          {isAdmin && !isEditing && typeof document !== "undefined" && document.getElementById("pd-admin-login-slot") && createPortal(
            <button type="button" className="pd-edit-trigger" onClick={beginEdit}><Pencil size={14} /> 사업 정보 편집</button>,
            document.getElementById("pd-admin-login-slot")!
          )}
        </div>

        {isAdmin && isEditing && (
          <section className="pd-editor" aria-label="사업 정보 편집">
            <div className="pd-editor-heading"><div><span className="pd-detail-eyebrow">ADMIN CONTENT EDITOR</span><strong>사업 정보 편집</strong></div><div className="pd-editor-actions"><button type="button" className="pd-editor-cancel" onClick={() => setIsEditing(false)}>취소</button><button type="button" className="pd-editor-save" onClick={commitEdit} disabled={saveProjectContent.isPending}><Save size={14} /> {saveProjectContent.isPending ? "저장 중…" : "저장"}</button></div></div>
            <div className="pd-editor-grid">
              {([["project_name", "사업명"], ["region", "사업 성격"], ["current_stage", "추진 단계"], ["contact", "선거구"], ["district", "읍·면·동"], ["town", "선거구 세부"]] as [keyof Project, string][]).map(([key, label]) => <label key={String(key)}><span>{label}</span><input value={String(editDraft[key] ?? "")} onChange={(event) => updateDraft(key, event.target.value)} /></label>)}
              {([
                { keys: ["total_cost_million_krw", "card_total_budget_million_krw"], label: "총사업비(백만원)" },
                { keys: ["invested_to_2026_million_krw", "card_invested_to_2025_million_krw", "card_invested_to_2026_million_krw"], label: "기투자액(~2026, 백만원)" },
                { keys: ["card_budget_2026_million_krw"], label: "2026년 예산(백만원)" },
                { keys: ["budget_2027_million_krw", "card_budget_2027_million_krw"], label: "2027년 예산(백만원)" },
                { keys: ["card_execution_amount_million_krw"], label: "집행액(백만원)" },
                { keys: ["carryover_million_krw"], label: "이월액(백만원)" },
              ] as { keys: (keyof Project)[]; label: string }[]).map(({ keys, label }) => <label key={keys[0]}><span>{label}</span><input type="number" value={String(editDraft[keys[0]] ?? "")} onChange={(event) => updateDraftGroup(keys, event.target.value === "" ? null : Number(event.target.value))} /></label>)}
              {([["execution_rate", "예산 집행률(%)"], ["progress_rate", "사업 진척도(%)"]] as [keyof Project, string][]).map(([key, label]) => <label key={String(key)}><span>{label}</span><input type="number" min="0" max="100" value={String(editDraft[key] ?? "")} onChange={(event) => updateDraft(key, event.target.value === "" ? null : Number(event.target.value))} /></label>)}
              {([["inspection", "준공 목표"], ["overview", "사업 개요"], ["progress_status", "추진 경과"], ["future_plan", "향후 계획"], ["progress_notes", "진행사항 메모"], ["card_admin_procedures", "사전절차"]] as [keyof Project, string][]).map(([key, label]) => <label className="pd-editor-wide" key={String(key)}><span>{label}</span><textarea rows={key === "overview" ? 4 : key === "card_admin_procedures" ? 2 : 3} value={String(editDraft[key] ?? "")} onChange={(event) => updateDraft(key, event.target.value)} /></label>)}
              <div className="pd-editor-wide pd-editor-checkrow">
                <span>사전절차 체크</span>
                <div className="pd-editor-checks">
                  {([["mid_term_fiscal", "중기재정"], ["investment_review", "투·융자심사"], ["public_property", "공유재산"], ["none", "해당없음"]] as [keyof Project["card_admin_status"], string][]).map(([field, label]) => <label key={String(field)} className="pd-editor-check"><input type="checkbox" checked={!!(editDraft.card_admin_status ?? project.card_admin_status)[field]} onChange={(event) => updateAdminStatus(field, event.target.checked)} /> {label}</label>)}
                </div>
              </div>
              {renderBreakdownEditor("funding_breakdown", "재원별 예산 (총계 / 기투자 / 2026년 / 2027년, 백만원)")}
              {renderBreakdownEditor("usage_breakdown", "성질별 예산 (총계 / 기투자 / 2026년 / 2027년, 백만원)")}
            </div>
            {saveProjectContent.isError && <p className="pd-editor-error">저장하지 못했습니다. 관리자 로그인 상태와 서버 연결을 확인해 주세요.</p>}
          </section>
        )}

        {hasSubProjects && (() => {
          const subCount = project.sub_projects!.length;
          const subLabels = project.sub_projects!.map((sub) => project.project_name === "서해안 관광벨트 주차장 및 도로 조성" && sub.name.startsWith("송교리 주차장") ? "송교리 주차장" : sub.name);
          const maxLabelLen = Math.max(...subLabels.map((label) => label.length));
          const isParkingLot = project.project_name === "서해안 관광벨트 주차장 및 도로 조성";
          const subButtonWidth = isParkingLot ? Math.max(84, maxLabelLen * 11 + 28) : Math.max(100, maxLabelLen * 15 + 52);
          return (
          <div className="radio-group" role="tablist" aria-label="세부 사업 선택" style={{ width: `${subButtonWidth * subCount}px` }}>
            <div key={selectedSubIndex} className="slider" style={{ width: `calc((100% - 8px) / ${subCount})`, transform: `translateX(${selectedSubIndex * 100}%)` }} />
            {project.sub_projects!.map((sub, index) => {
              const inputId = `detail-subproject-${project.id}-${index}`;
              return (
                <div key={sub.name} className="radio-option">
                  <input id={inputId} name={`detail-subproject-${project.id}`} type="radio" checked={selectedSubIndex === index} onChange={() => setSelectedSubIndex(index)} />
                  <label htmlFor={inputId} className={`radio-label${selectedSubIndex === index ? " is-active" : ""}`} role="tab" aria-selected={selectedSubIndex === index}>{subLabels[index]}</label>
                </div>
              );
            })}
          </div>
          );
        })()}

        <div className="pd-detail-search"><PodaSearch value={searchValue} onChange={onSearchChange} projects={searchProjects} onSelectProject={onSelectProject} /></div>
      </div>

      <section className="pd-summary mt-8" aria-label="사업 요약">
        <div className="pd-summary-cell">
          <span className="pd-summary-label"><TagIcon /> 사업 성격 · 추진 단계</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="pd-pill pd-pill-new">{activeProject.region || "-"}</span>
            <span className="pd-pill pd-pill-status">{activeProject.current_stage || "-"}</span>
          </div>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label pd-summary-label-amount"><WalletMoneyIcon /> 총사업비</span>
          <span className="pd-summary-value grad">
            {activeProject.total_cost_million_krw?.toLocaleString("ko-KR") ?? "-"}
            <small style={{ fontSize: 16, fontWeight: 700, background: "none", WebkitTextFillColor: "var(--pd-text-muted)", color: "var(--pd-text-muted)" }}> 백만원</small>
          </span>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label pd-summary-label-progress"><ChartProgressIcon /> 사업 진척도</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge key={`${project.id}-${selectedSubIndex}`} percent={percent} />
            <span className="pd-summary-value grad">{percent}<small style={{ fontSize: 16, fontWeight: 700, color: "var(--pd-text-muted)" }}>%</small></span>
          </div>
        </div>
        <div className="pd-summary-cell hero">
          <span className="pd-summary-label pd-summary-label-execution"><CardSendIcon /> 예산 집행 현황</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge key={`${project.id}-${selectedSubIndex}-exec`} percent={activeProject.execution_rate ?? 0} />
            <span className="pd-summary-value grad">{activeProject.execution_rate ?? 0}<small style={{ fontSize: 16, fontWeight: 700, color: "var(--pd-text-muted)" }}>%</small></span>
          </div>
        </div>
        <div className="pd-summary-cell pd-summary-cell-date">
          <span className="pd-summary-label pd-summary-label-schedule"><CalendarMarkIcon /> 준공 목표</span>
          <span className="pd-summary-value" style={{ fontSize: 18 }}>{formatDateText(activeProject.inspection || "-")}</span>
        </div>
        <div className="pd-summary-cell pd-summary-cell-location">
          <span className="pd-summary-label pd-summary-label-location"><BuildingsIcon /> 사업 위치 · 선거구</span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[activeProject.contact, activeProject.district, activeProject.town].filter(Boolean).map((tag, index) => (
              <span key={`${tag}-${index}`} className={`pd-pill ${index === 0 ? "pd-pill-status" : index === 2 ? "pd-pill-district" : "pd-pill-tag"}`}>{tag}</span>
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
              <label htmlFor={inputId} role="tab" aria-selected={activeTab === tab}>
                {tab}
              </label>
            </span>
          );
        })}
        <div ref={indicatorRef} className="pill-indicator" aria-hidden="true" />
      </div>

      <div key={`${project.id}-${selectedSubIndex}-${activeTab}`} className="pd-panel-fade">
        {activeTab === "사업개요·추진현황" && (
          <>
            <OverviewPanel project={activeProject} />
            <div className="pd-detail-attached-group">
              <ProgressPanel project={activeProject} />
              <div className="pd-stacked-panel pd-attached-last"><AdminPanel project={activeProject} /></div>
            </div>
          </>
        )}
        {activeTab === "예산현황" && <BudgetPanel project={activeProject} />}
        {activeTab === "위치도" && (() => {
          const hasSpotMap = !!activeProject.overview_map;
          const hasRenderings = (activeProject.rendering_images?.length ?? 0) > 0;
          return (
            <div className="pd-detail-attached-group">
              {/* SpotMapCard는 원래 OverviewPanel의 pd-card 안에 얹혀 있던 하위 섹션이라 그 자체엔
                  pd-card 배경이 없다 - 여기서는 독립 카드로 보여야 하니 pd-card로 감싼다. */}
              {hasSpotMap && (
                <div className={`pd-stacked-panel${hasRenderings ? "" : " pd-attached-last"}`}>
                  <div className="pd-card"><SpotMapCard map={activeProject.overview_map!} projectName={activeProject.project_name} /></div>
                </div>
              )}
              {hasRenderings && <div className="pd-stacked-panel pd-attached-last"><LocationPanel project={activeProject} /></div>}
              {!hasSpotMap && !hasRenderings && <div className="pd-note-box">등록된 위치도·조감도가 없습니다.</div>}
            </div>
          );
        })()}
      </div>
      {overviewPairs.length === 0 && activeTab === "사업개요·추진현황" && null}
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

// 부서별 현황 표에서 관리자가 "행 추가"로 만드는 사업은 정적 데이터셋(dashboard_projects.json)에
// 없는 완전히 새 사업이라, projectContent_overrides에 이 id로 저장된 payload 자체가 사업 전체를
// 대신한다(기존 사업처럼 "일부 필드만 덮어쓰기"가 아니라 그 자체가 사업 데이터 전부). id를 이
// 접두사로 시작하게 해서 liveProjects 계산에서 "새로 만든 사업"과 "기존 사업 덮어쓰기"를 구분한다.
const NEW_ROW_ID_PREFIX = "custom-row-";
function isCustomRowId(id: string) {
  return id.startsWith(NEW_ROW_ID_PREFIX);
}
function createBlankProject(department: string, serial: number): Project {
  return {
    id: `${NEW_ROW_ID_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    serial,
    department,
    project_name: "",
    overview: "",
    category: "",
    current_stage: "",
    funding_type: "",
    total_cost_million_krw: null,
    invested_to_2026_million_krw: null,
    budget_2027_million_krw: null,
    execution_rate: null,
    progress_status: "",
    progress_rate: null,
    expected_completion: "",
    progress_notes: "",
    future_plan: "",
    inspection: "",
    delay_reason: "",
    administrative_procedures: "",
    project_type: "",
    region: "신규",
    district: "",
    town: "",
    contact: "",
    last_saved: new Date().toISOString().slice(0, 10),
    management_card_matched: false,
    management_card_source: "",
    card_total_budget_million_krw: null,
    card_invested_to_2025_million_krw: null,
    card_invested_to_2026_million_krw: null,
    card_budget_2026_million_krw: null,
    card_budget_2026_base_million_krw: null,
    card_budget_2026_first_extra_million_krw: null,
    card_budget_2026_second_extra_million_krw: null,
    card_budget_2026_third_extra_million_krw: null,
    card_budget_2026_additional_million_krw: null,
    card_budget_2027_million_krw: null,
    card_budget_2028_plus_million_krw: null,
    card_execution_budget_million_krw: null,
    card_execution_amount_million_krw: null,
    card_execution_rate: null,
    card_inspection: "",
    funding_breakdown: [],
    usage_breakdown: [],
    card_admin_procedures: "",
    card_admin_legal_basis: "",
    card_admin_status: {},
  };
}

function formatBudgetNumber(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function formatDepartmentAmount(value: number) {
  return `${formatBudgetNumber(value)} 백만원`;
}

// Breaks long project names at a natural point (before a trailing
// parenthetical, or after a standalone "외") instead of letting the table
// column wrap wherever it happens to run out of width.
function formatProjectNameLines(name: string) {
  const parenMatch = name.match(/^(.*?)\s*(\([^)]+\))\s*$/);
  if (parenMatch) return <>{parenMatch[1]}<br />{parenMatch[2]}</>;
  const suffixMatch = name.match(/^(.*\s외)\s+(\S.*)$/);
  if (suffixMatch) return <>{suffixMatch[1]}<br />{suffixMatch[2]}</>;
  return name;
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

// 민선9기(2026~2030) 공약사항. 구분(대주제) 아래에 공약명·실국소명·부서를 묶어 보여준다.
// 공약별 상세 자료(detail)가 채워진 항목은 행을 눌러 펼쳐볼 수 있다 - 아직 상세가
// 없는 공약은 이름/국/부서만 보여준다.
type PledgeDetailTable = { columns: string[]; rows: { label: string; values: string[] }[] };
type PledgeDetail = {
  termScope: string; // 임기내 / 임기후
  operator: string; // 사업주체: 국가/도/자체/민간
  isNew: string; // 신규 / 계속
  budgetType: string; // 예산 / 비예산
  metrics: string[]; // 성과 지표
  centralHelp: string; // 중앙정부 도움 필요성
  leadDepartment: string; // 추진부서
  cooperatingAgency?: string; // 협조기관(부서)
  goals: string[]; // Ⅰ. 사업목표
  overview?: { label: string; value: string | string[]; note?: string }[]; // Ⅱ. 개요 - 공약마다 항목명이 달라(추진기간/교육기간, 사업위치/교육대상 등) 라벨·값 쌍으로 둔다
  overviewSites?: PledgeDetailTable; // Ⅱ. 개요를 지역별 시설 표로 대신하는 경우(파크골프장처럼 여러 부지가 있는 사업)
  policyTargets: PledgeDetailTable; // Ⅲ. 정책목표
  yearlyBudget: PledgeDetailTable; // Ⅳ. 연도별 예산계획
  plan: { year: string; content: string[] }[]; // Ⅴ. 추진계획
  departmentOpinions?: string[]; // Ⅵ. 부서의견
};
type Pledge = { theme: string; name: string; bureau: string; department: string; note?: string; detail?: PledgeDetail };
const PLEDGES: Pledge[] = [
  { theme: "모두가 즐거운 글로벌 관광도시", name: "화성형 문화자치제 도입", bureau: "문화관광국", department: "문화예술과" },
  {
    theme: "모두가 즐거운 글로벌 관광도시",
    name: "AI 기반 新화성8경 선정",
    bureau: "문화관광국",
    department: "관광진흥과",
    detail: {
      termScope: "임기내",
      operator: "자체",
      isNew: "신규",
      budgetType: "예산",
      metrics: ["①AI관광 플랫폼 기본계획", "②AI관광 플랫폼 시스템 구축", "③민간협력 정보모델 운영"],
      centralHelp: "해당없음",
      leadDepartment: "관광진흥과 관광정책팀(☎6017)",
      cooperatingAgency: "AI스마트전략실",
      goals: [
        "관광플랫폼 구축, 운영 기본 계획 수립",
        "초개인화 관광홍보 시스템 구축, 관광-소비 연계 관광모델 운영",
      ],
      overview: [
        { label: "추진기간", value: "2026. 9. ~ 2028. 12." },
        { label: "사업대상", value: "시 소재 관광자원과 편의시설 등(지역 관광상권 포함)" },
        { label: "사업주체", value: "자체사업" },
        { label: "사업량", value: "기본 계획, 시스템 구축과 운영" },
        { label: "사업내용", value: [
          "AI·데이터 수집, 분석, 관광 핫플레이스(AI Golden Pick) 선정 기본계획",
          "超개인화 맞춤형 명소 안내, 관광객과 지역상권 연계 촉진체계 구축",
          "민관 연계, 협력 관광상품 및 정보모델 운영",
        ] },
        { label: "사업비", value: "382백만원", note: "'AI관광 플랫폼 기본계획' 완료 후 2028년 포함 플랫폼 고도화 확정 예산 산출" },
      ],
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "①AI관광 플랫폼 기본계획 (건)", values: ["1건", "", "", "", ""] },
          { label: "②AI관광 플랫폼 시스템 구축 (건)", values: ["", "1건", "", "", ""] },
          { label: "③민간협력 정보모델 운영 (-)", values: ["", "", "1건", "", ""] },
          { label: "공약 달성률(%)", values: ["10", "70", "100", "", ""] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["382", "0", "22", "360", "미정", "0", "0", "0"] },
          { label: "국비", values: ["0", "", "", "", "", "", "", ""] },
          { label: "도비", values: ["0", "", "", "", "", "", "", ""] },
          { label: "시비", values: ["382", "", "22", "360", "미정", "", "", ""] },
          { label: "기타", values: ["0", "", "", "", "", "", "", ""] },
        ],
      },
      plan: [
        { year: "2026년", content: ["AI 기반 데이터 활용 관광 플랫폼 구축 기본 계획"] },
        { year: "2027년", content: ["AI 기반 데이터 활용 관광 플랫폼 시스템 구축, 운영"] },
        { year: "2028년", content: ["관광객, 지역상권, 정책 연계 통합 플랫폼 기능 확산"] },
      ],
    },
  },
  {
    theme: "미래세대와 함께하는 평생교육도시",
    name: "최고의 인재를 만드는 영재교육원 확대",
    bureau: "교육체육국",
    department: "교육지원과",
    detail: {
      termScope: "임기내",
      operator: "자체",
      isNew: "신규",
      budgetType: "예산",
      metrics: ["교육 분야 확대 추진", "교육 공간 조성 추진"],
      centralHelp: "해당없음",
      leadDepartment: "교육지원과 교육특화팀(☎7472)",
      cooperatingAgency: "화성시인재육성재단 영재교육원",
      goals: [
        "인공지능(AI) 등 미래사회를 준비하는 창의융합형 핵심인재를 양성하기 위한 화성시 영재교육원 확대·운영",
      ],
      overview: [
        { label: "교육기간", value: "2026. 5. 16.(토) ~ 11. 21.(토)" },
        { label: "교육대상", value: "관내 초등(5·6학년), 중등(1·2학년) 120명", note: "'26학년도 교육대상자 총 117명 선발" },
        { label: "교육장소", value: "[과학] 화성시민대학 / [정보] 서연이음터" },
        { label: "교육내용", value: "STEM+I 영재교육과정 중 과학, 정보영역 영재교육 프로그램 운영" },
        { label: "교육방법", value: "대면수업 및 캠프 (교과활동 80시간, 비교과활동 20시간/총 100시간)" },
        { label: "소요예산", value: "470백만원" },
      ],
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "교육 분야 확대 추진 (%)", values: ["영재교육원 개원·운영", "AI·융합 교육 강화", "문화예술 분야 시범 확대 운영", "문화예술 분야 확대 운영", "확대 운영 체계 안정화"] },
          { label: "교육 공간 조성 추진 (%)", values: ["법률검토 및 안전관리 자문", "구조안전진단, 기본 및 실시설계", "공사 착공", "공사 준공", "개관"] },
          { label: "공약 달성률(%)", values: ["15", "30", "50", "70", "100"] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["0", "0", "470", "1,100", "11,344", "920", "670", "670"] },
          { label: "국비", values: ["0", "0", "0", "0", "0", "0", "0", "0"] },
          { label: "도비", values: ["0", "0", "0", "0", "0", "0", "0", "0"] },
          { label: "시비", values: ["0", "0", "470", "1,100", "11,344", "920", "670", "670"] },
          { label: "기타", values: ["0", "0", "0", "0", "0", "0", "0", "0"] },
        ],
      },
      plan: [
        { year: "2026년", content: [
          "영재교육원 운영(1기) - 초등(5·6학년), 중등(1·2학년) 대상, [과학] 화성시민대학 / [정보] 서연이음터",
          "교육공간 조성을 위한 법률 검토 및 부서 협의, 안전관리 자문",
        ] },
        { year: "2027년", content: [
          "AI·융합 교육 강화 - 융합과학·융합정보 분야 안착, 교육분야 확대 검토 및 연구, 관내 기업 연계 MOU 체결",
          "교육공간 조성을 위한 정밀구조안전진단, 기본 및 실시설계",
        ] },
        { year: "2028년", content: [
          "영재교육 분야 확대 시범 운영 - 문화예술 분야 시범적 확대 운영, 자체 교육공간 확보 및 조성 추진",
          "교육공간 조성 공사 착공",
        ] },
        { year: "2029년", content: [
          "영재교육 분야 확대 운영 - 문화예술 등 교육 분야 확대 운영",
          "교육공간 조성 공사 준공 및 2030년 개관 목표 교육 운영 준비",
        ] },
        { year: "2030년", content: [
          "영재교육 확대 운영 체계 안정화 - 문화예술 분야 운영 정착 및 교육과정 고도화",
          "교육공간 개관",
        ] },
      ],
    },
  },
  {
    theme: "미래세대와 함께하는 평생교육도시",
    name: "화성교육지원청 유치",
    bureau: "교육체육국",
    department: "교육지원과",
    detail: {
      termScope: "임기내",
      operator: "도",
      isNew: "신규",
      budgetType: "예산",
      metrics: ["분리 교육지원청 출범"],
      centralHelp: "해당없음",
      leadDepartment: "교육지원과 교육정책팀(☎3480)",
      cooperatingAgency: "화성오산교육지원청 기획경영과",
      goals: [
        "화성시 교육격차 해소 및 신속한 행정 대응을 위한 독립적 교육행정 체계 구축",
      ],
      overview: [
        { label: "추진기간", value: "2026. 5. ~ 2027." },
        { label: "사업위치", value: "미정" },
        { label: "사업주체", value: "화성오산교육지원청" },
        { label: "사업량", value: "미정" },
        { label: "사업내용", value: "화성교육지원청 분리·유치" },
        { label: "사업비", value: "미정" },
      ],
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "분리 교육지원청 출범 (%)", values: ["주민설명회 개최 및 분청 신청서 제출", "화성교육지원청 출범 및 임시청사 운영", "", "", ""] },
          { label: "공약 달성률(%)", values: ["50", "100", "", "", ""] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["0", "0", "0", "0", "0", "0", "0", "0"] },
          { label: "국비", values: ["0", "", "", "", "", "", "", ""] },
          { label: "도비", values: ["0", "", "", "", "", "", "", ""] },
          { label: "시비", values: ["0", "", "", "", "", "", "", ""] },
          { label: "기타", values: ["0", "", "", "", "", "", "", ""] },
        ],
      },
      plan: [
        { year: "2026년", content: ["주민설명회 개최 및 분청 신청서 제출"] },
        { year: "2027년", content: ["화성교육지원청 출범 및 임시청사 운영"] },
      ],
    },
  },
  {
    theme: "미래세대와 함께하는 평생교육도시",
    name: "지역도서관 추가건립",
    bureau: "교육체육국",
    department: "도서관정책과",
    detail: {
      termScope: "임기후",
      operator: "자체",
      isNew: "계속",
      budgetType: "예산",
      metrics: ["도서관 건립(3개소)"],
      centralHelp: "해당없음",
      leadDepartment: "도서관정책과 도서관시설팀(☎6119)",
      cooperatingAgency: "공공건축과",
      goals: [
        "일상생활 속 지식과 쉼을 누리는 문화 거점 조성을 위해 지역도서관을 추가 확충하여 시민의 복합문화활동 지원",
      ],
      overview: [
        { label: "추진기간", value: "2026년 ~ 2030년" },
        { label: "사업위치", value: "봉담읍 동화리 11-1 외 2개소" },
        { label: "사업주체", value: "화성시(자체사업)" },
        { label: "사업량", value: "건립중 2개소, 추가건립 1개소" },
        { label: "사업내용", value: ["지역 신규 도서관 추가 건립"] },
        { label: "사업비", value: "58,200백만원", note: "도비 4,500, 시비 48,400, 기타 5,300" },
      ],
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "도서관 건립(3개소) (개소)", values: ["", "준공 2개소", "기본 및 실시설계", "착공", "공사진행"] },
          { label: "공약 달성률(%)", values: ["", "60", "70", "80", "100"] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["58,200", "30,840", "11,400", "3,010", "6,450", "6,500", "0", "0"] },
          { label: "국비", values: ["0", "-", "-", "-", "-", "-", "-", "-"] },
          { label: "도비", values: ["4,500", "2,500", "2,000", "-", "-", "-", "-", "-"] },
          { label: "시비", values: ["48,400", "23,040", "9,400", "3,010", "6,450", "6,500", "-", "-"] },
          { label: "기타", values: ["5,300", "5,300", "-", "-", "-", "-", "-", "-"] },
        ],
      },
      plan: [
        { year: "2026년", content: [
          "(가칭)반월도서관: 공사 재착수(26. 3.)",
          "(가칭)독서문화공간: 내부공간 디자인 기본계획 용역(26. 6. ~ 7.)",
          "(가칭)다올공원도서관: 기본계획 수립 및 타당성 조사 용역(26. 4. ~ 9.)",
        ] },
        { year: "2027년", content: [
          "(가칭)반월도서관: 공사준공(27. 5.) 및 도서관 개관(27. 8.)",
          "(가칭)독서문화공간: 공사준공(27. 1.) 및 도서관 개관(27. 4.)",
          "(가칭)다올공원도서관: 건축기획 용역, 공공건축 심의, 설계공모, 기본 및 실시설계 용역 착수",
        ] },
        { year: "2028년", content: ["(가칭)다올공원도서관: 기본 및 실시설계 용역 준공"] },
        { year: "2029년", content: ["(가칭)다올공원도서관: 공사 착공"] },
        { year: "2030년", content: ["(가칭)다올공원도서관: 공사 준공(30. 8.) 및 도서관 개관(30. 11.)"] },
      ],
      departmentOpinions: [
        "기존 신규 건립 2개소(반월, 독서문화공간): 2027년 준공 및 개관 가능",
        "추가 신규 건립 1개소(다올공원도서관) - 조달청 계약, 혹서기·동절기, 설계변경 등 사업 추진시 다양한 변수 발생으로 공기 연장 가능성",
      ],
    },
  },
  {
    theme: "미래세대와 함께하는 평생교육도시",
    name: "파크골프장 확대",
    bureau: "교육체육국",
    department: "체육진흥과",
    detail: {
      termScope: "임기내",
      operator: "자체",
      isNew: "신규",
      budgetType: "예산",
      metrics: ["파크골프장 3개소 준공"],
      centralHelp: "도움 필요",
      leadDepartment: "체육진흥과 체육시설건립팀(☎6188)",
      cooperatingAgency: "국토교통부, 한강유역환경청",
      goals: [
        "최근 고령화 사회에 적합한 여가문화로 자리잡은 파크골프에 대한 관심과 수요가 증가함에 따라, 파크골프 기반 확충을 통해 건전한 여가문화 조성과 지속 가능한 체육 인프라 마련",
      ],
      overviewSites: {
        columns: ["시설명", "지번", "홀", "면적(㎡)", "예상사업비(백만원)"],
        rows: [
          { label: "합계", values: ["4개소", "", "", "", "9,690"] },
          { label: "만세", values: ["우정읍 매향리 파크골프장", "우정읍 매향리 986", "36", "33,000", "1,990"] },
          { label: "만세", values: ["남양하수처리장 파크골프장", "남양읍 남양리 967-11", "18", "9,453", "1,000"] },
          { label: "효행", values: ["개발제한구역 파크골프장", "봉담, 비봉, 매송 일원", "36이상", "40,000", "4,800"] },
          { label: "동탄", values: ["오산천 파크골프장", "방교동 872-192", "27", "25,810", "1,900"] },
        ],
      },
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "파크골프장 조성", values: ["-", "1개소", "2개소", "계속추진", "계속추진"] },
          { label: "공약 달성률(%)", values: ["-", "30", "100", "-", "-"] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["9,690", "0", "300", "4,790", "1,000", "3,600", "0", "0"] },
          { label: "시비", values: ["0", "", "300", "4,790", "1,000", "3,600", "", ""] },
        ],
      },
      plan: [
        { year: "2026년", content: ["매향리 파크골프장 실시설계"] },
        { year: "2027년", content: ["매향리 파크골프장 준공", "오산천 파크골프장 실시설계", "개발제한구역 파크골프장 기본계획 수립"] },
        { year: "2028년", content: ["오산천 파크골프장 준공", "남양 하수처리장 파크골프장 준공"] },
        { year: "2029년", content: ["개발제한구역 파크골프장 GB관리계획 승인"] },
        { year: "2030년", content: ["개발제한구역 파크골프장 착공"] },
        { year: "임기후", content: ["개발제한구역 파크골프장 준공"] },
      ],
    },
  },
  {
    theme: "미래세대와 함께하는 평생교육도시",
    name: "화성 돔 야구장 건립 · 프로야구단 유치 기반 조성",
    bureau: "교육체육국",
    department: "체육진흥과",
    detail: {
      termScope: "임기후",
      operator: "자체",
      isNew: "신규",
      budgetType: "예산",
      metrics: ["돔야구장 건립 추진"],
      centralHelp: "해당없음",
      leadDepartment: "체육진흥과 체육시설건립팀(☎6189)",
      goals: [
        "시민의 스포츠·문화 향유 기회를 확대하고 대규모 체육·문화행사를 유치할 수 있는 돔야구장 건립",
      ],
      overview: [
        { label: "추진기간", value: "2026. 10. ~ 2035. 12." },
        { label: "사업위치", value: "화성시 전역(대상지 미정)" },
        { label: "사업주체", value: "자체사업" },
        { label: "사업량", value: "대지면적 60,000㎡ 이상/건축면적 40,000㎡ 이상" },
        { label: "사업내용", value: ["돔야구장(복합체육센터 포함) 건립"] },
        { label: "사업비", value: "약 526,500백만원" },
      ],
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "돔야구장 건립 추진", values: ["기본계획 수립 및 타당성조사 용역 착수", "지방재정투자사업 타당성조사 의뢰", "지방재정투자심사, 설계공모", "설계완료", "실시계획 작성"] },
          { label: "공약 달성률(%)", values: ["20", "40", "60", "80", "100"] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["526,500", "0", "100", "900", "8,500", "9,900", "83,000", "424,100"] },
          { label: "시비", values: ["526,500", "-", "100", "900", "8,500", "9,900", "83,000", "424,100"] },
        ],
      },
      plan: [
        { year: "2026년", content: ["기본계획 수립 및 타당성조사 용역 발주"] },
        { year: "2027년", content: ["기본계획 수립 완료 및 지방재정투자사업 타당성조사 의뢰"] },
        { year: "2028년", content: ["타당성조사 완료, 지방재정투자심사 완료 후 설계공모"] },
        { year: "2029년", content: ["설계완료"] },
        { year: "2030년", content: ["실시계획 작성, 보상 착수"] },
        { year: "임기후", content: ["보상완료 및 공사 착공"] },
      ],
    },
  },
  { theme: "미래세대와 함께하는 평생교육도시", name: "패밀리풀 권역별 확대 조성", bureau: "교육체육국", department: "체육진흥과" },
  {
    theme: "미래세대와 함께하는 평생교육도시",
    name: "화성 롤러경기장 건립",
    bureau: "교육체육국",
    department: "전국체전추진단",
    detail: {
      termScope: "임기내",
      operator: "자체",
      isNew: "계속",
      budgetType: "예산",
      metrics: ["경기장 준공"],
      centralHelp: "해당없음",
      leadDepartment: "전국체전추진단 전국체전시설팀(☎7009)",
      goals: [
        "2027년 제108회 전국체육대회 및 제47회 전국장애인체육대회 주 개최도시 선정 및 롤러스포츠 종목 유치함에 따라 신규 체육시설 조성",
      ],
      overview: [
        { label: "추진기간", value: "2024. 5. ~ 2027. 5." },
        { label: "사업위치", value: "화성시 동탄구 반송동 59번지" },
        { label: "사업주체", value: "자체사업" },
        { label: "사업량", value: "4,000㎡(100m×40m), 200m 트랙" },
        { label: "사업내용", value: ["롤러스포츠 경기장 1면 건립"] },
        { label: "사업비", value: "2,000백만원" },
      ],
      policyTargets: {
        columns: ["2026", "2027", "2028", "2029", "2030"],
        rows: [
          { label: "경기장 준공 (개소)", values: ["공사 착공", "공사 준공", "", "", ""] },
          { label: "공약 달성률(%)", values: ["50", "100", "", "", ""] },
        ],
      },
      yearlyBudget: {
        columns: ["총계", "기투자액", "2026년", "2027년", "2028년", "2029년", "2030년", "임기 후"],
        rows: [
          { label: "계", values: ["2,000", "50", "1,950", "0", "0", "0", "0", "0"] },
          { label: "국비", values: ["585", "-", "585", "-", "-", "-", "-", "-"] },
          { label: "도비", values: ["956", "-", "956", "-", "-", "-", "-", "-"] },
          { label: "시비", values: ["459", "50", "409", "-", "-", "-", "-", "-"] },
          { label: "기타", values: ["-", "-", "-", "-", "-", "-", "-", "-"] },
        ],
      },
      plan: [
        { year: "2026년", content: ["공원조성계획 변경 및 실시설계", "공사 착공"] },
        { year: "2027년", content: ["공사 준공"] },
      ],
      departmentOpinions: [
        "경기장 주변 대회운영시설(본부석, 계측실 등) 설치공간 확보를 위해 관련부서(동부공원관리과 등)와 협의 필요",
        "기존 X-게임장 철거에 따른 대체부지 확보 및 설치를 위해 관련부서(동부공원관리과, 체육진흥과, 동탄1동 등)와 협의 필요",
      ],
    },
  },
];

function PledgeDetailPanel({ detail }: { detail: PledgeDetail }) {
  const renderTable = (table: PledgeDetailTable, firstColumnLabel: string) => (
    <table className="pledge-detail-table">
      <thead>
        <tr>
          <th>{firstColumnLabel}</th>
          {table.columns.map((column) => <th key={column} className={column === "2027년" ? "is-target-year" : undefined}>{column}</th>)}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            <td>{row.label}</td>
            {row.values.map((value, index) => <td key={index} className={table.columns[index] === "2027년" ? "is-target-year" : undefined}>{value || "-"}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="pledge-detail" onClick={(event) => event.stopPropagation()}>
      <div className="pledge-detail-chips">
        <span className="pledge-detail-chip">{detail.termScope}</span>
        <span className="pledge-detail-chip">사업주체 · {detail.operator}</span>
        <span className="pledge-detail-chip">{detail.isNew}</span>
        <span className="pledge-detail-chip">{detail.budgetType}</span>
      </div>
      <dl className="pledge-detail-dl">
        <div><dt>성과 지표</dt><dd>{detail.metrics.join(" ")}</dd></div>
        <div><dt>중앙정부 도움 필요성</dt><dd>{detail.centralHelp}</dd></div>
        <div><dt>추진부서</dt><dd>{detail.leadDepartment}</dd></div>
        {detail.cooperatingAgency && <div><dt>협조기관(부서)</dt><dd>{detail.cooperatingAgency}</dd></div>}
      </dl>

      <h4 className="pledge-detail-heading">Ⅰ. 사업목표</h4>
      <ul className="pledge-detail-list">
        {detail.goals.map((goal, index) => <li key={index}>{goal}</li>)}
      </ul>

      <h4 className="pledge-detail-heading">Ⅱ. 개요</h4>
      {detail.overview && (
        <dl className="pledge-detail-dl">
          {detail.overview.map((field, index) => (
            <div key={index}>
              <dt>{field.label}</dt>
              <dd>
                {Array.isArray(field.value)
                  ? <ul className="pledge-detail-list">{field.value.map((line, lineIndex) => <li key={lineIndex}>{line}</li>)}</ul>
                  : field.value}
                {field.note && <span className="pledge-detail-note"> ※ {field.note}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {detail.overviewSites && renderTable(detail.overviewSites, "지역")}

      <h4 className="pledge-detail-heading">Ⅲ. 정책목표 (단위: 건)</h4>
      {renderTable(detail.policyTargets, "성과 지표명")}

      <h4 className="pledge-detail-heading">Ⅳ. 연도별 예산계획 (단위: 백만원)</h4>
      {renderTable(detail.yearlyBudget, "구분")}

      <h4 className="pledge-detail-heading">Ⅴ. 추진계획</h4>
      <dl className="pledge-detail-dl">
        {detail.plan.map((item) => (
          <div key={item.year} className={item.year === "2027년" ? "is-target-year" : undefined}>
            <dt>{item.year}</dt>
            <dd><ul className="pledge-detail-list">{item.content.map((line, index) => <li key={index}>{line}</li>)}</ul></dd>
          </div>
        ))}
      </dl>

      {detail.departmentOpinions && (
        <>
          <h4 className="pledge-detail-heading">Ⅵ. 부서의견</h4>
          <ul className="pledge-detail-list">
            {detail.departmentOpinions.map((opinion, index) => <li key={index}>{opinion}</li>)}
          </ul>
        </>
      )}
    </div>
  );
}

function PledgeBoard({ isAdmin }: { isAdmin?: boolean }) {
  const [expandedPledge, setExpandedPledge] = useState<string | null>(null);
  const themes = Array.from(new Set(PLEDGES.map((pledge) => pledge.theme))).map((theme) => ({
    theme,
    pledges: PLEDGES.filter((pledge) => pledge.theme === theme),
  }));

  const headerRef = useRef<HTMLElement>(null);
  const nineRef = useRef<HTMLSpanElement>(null);
  const [boardIndent, setBoardIndent] = useState(0);

  useEffect(() => {
    const alignBoard = () => {
      if (!headerRef.current || !nineRef.current) return;
      // 좁은 화면(태블릿/모바일)에서는 인덴트를 주면 리스트가 지나치게 좁아지므로 그대로 좌측 정렬 유지
      if (window.innerWidth < 900) {
        setBoardIndent(0);
        return;
      }
      const delta = nineRef.current.getBoundingClientRect().left - headerRef.current.getBoundingClientRect().left;
      setBoardIndent(Math.max(0, delta));
    };
    alignBoard();
    window.addEventListener("resize", alignBoard);
    return () => window.removeEventListener("resize", alignBoard);
  }, []);

  return (
    <section className="investment-map-page">
      <header className="investment-map-header" ref={headerRef}>
        <div>
          <p className="investment-map-eyebrow">HWASEONG · 9TH ELECTED TERM</p>
          <h1>민선<span ref={nineRef}>9</span>기 공약사항</h1>
        </div>
        {isAdmin && <span className="investment-map-admin-action investment-map-admin-badge"><Pencil size={14} /> 공약 정보 편집</span>}
      </header>
      <div className="pledge-board" style={{ marginLeft: boardIndent, marginRight: "auto" }}>
        {themes.map((group) => (
          <div className="pledge-theme" key={group.theme}>
            <h2
              className="pledge-theme-name"
              style={group.theme === "미래세대와 함께하는 평생교육도시" ? { marginBottom: 28 } : undefined}
            >
              {group.theme}
            </h2>
            <div className="pledge-list">
              {group.pledges.map((pledge) => {
                const isOpen = expandedPledge === pledge.name;
                return (
                  <div key={pledge.name}>
                    <div
                      className={`pledge-row ${pledge.detail ? "is-clickable" : ""} ${isOpen ? "is-open" : ""}`}
                      onClick={() => pledge.detail && setExpandedPledge(isOpen ? null : pledge.name)}
                    >
                      <span className="pledge-name">{pledge.name}</span>
                      <span className="pledge-tags">
                        <span className="pledge-tag pledge-tag-bureau">{pledge.bureau}</span>
                        <span className="pledge-tag pledge-tag-department">{pledge.department}</span>
                      </span>
                      {pledge.note && <span className="pledge-note">{pledge.note}</span>}
                    </div>
                    {isOpen && pledge.detail && <PledgeDetailPanel detail={pledge.detail} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DepartmentDashboard({
  onSelectProject,
  initialDepartment,
  projects,
  isAdmin,
}: {
  onSelectProject: (project: Project) => void;
  initialDepartment: string;
  projects: Project[];
  isAdmin?: boolean;
}) {
  const minBudget = "";
  const maxBudget = "";
  const [stageFilter, setStageFilter] = useState("전체");
  const [divisionFilter, setDivisionFilter] = useState("전체");
  const [projectSearch, setProjectSearch] = useState("");
  const [isDivisionOpen, setIsDivisionOpen] = useState(false);
  const [isStageOpen, setIsStageOpen] = useState(false);
  const [totalCostMin, setTotalCostMin] = useState("");
  const [totalCostMax, setTotalCostMax] = useState("");
  const [budget2027Min, setBudget2027Min] = useState("");
  const [budget2027Max, setBudget2027Max] = useState("");
  const [isTotalCostOpen, setIsTotalCostOpen] = useState(false);
  const [isBudget2027Open, setIsBudget2027Open] = useState(false);
  const [sortColumn, setSortColumn] = useState<"total_cost" | "budget_2027" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // 새 행 추가: 표 안에서 바로 입력받는 임시 상태. 저장 전까지는 서버에 아무것도 안 남는다.
  const [newRowDraft, setNewRowDraft] = useState<Project | null>(null);
  const [isSavingNewRow, setIsSavingNewRow] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const saveProjectContent = trpc.projectContent.save.useMutation();
  const departmentUtils = trpc.useUtils();
  const inRange = (value: number, min: string, max: string) => {
    const lo = min === "" ? Number.NEGATIVE_INFINITY : Number(min);
    const hi = max === "" ? Number.POSITIVE_INFINITY : Number(max);
    return value >= lo && value <= hi;
  };
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

  // 검색/필터/정렬이 하나라도 걸려 있으면 화면에 보이는 순서가 실제 저장 순서(serial)와 달라져서
  // "위/아래로 옮기기"가 눈에 보이는 것과 다르게 동작할 수 있다 - 그런 혼란을 막기 위해 아무 필터도
  // 없을 때만(= departmentProjects와 filteredProjects가 같은 순서일 때만) 순서 변경을 허용한다.
  const isFiltered = Boolean(
    projectSearch.trim() || stageFilter !== "전체" || divisionFilter !== "전체" ||
    totalCostMin || totalCostMax || budget2027Min || budget2027Max || sortColumn
  );

  const startNewRow = () => {
    const maxSerial = departmentProjects.reduce((max, project) => Math.max(max, project.serial), 0);
    setNewRowDraft(createBlankProject(initialDepartment, maxSerial + 1));
  };
  const cancelNewRow = () => setNewRowDraft(null);
  const updateNewRowDraft = (patch: Partial<Project>) => setNewRowDraft((draft) => (draft ? { ...draft, ...patch } : draft));
  const saveNewRow = async () => {
    if (!newRowDraft) return;
    if (!newRowDraft.project_name.trim()) return; // 사업명 없이는 저장하지 않는다
    setIsSavingNewRow(true);
    try {
      await saveProjectContent.mutateAsync({ projectId: newRowDraft.id, payload: newRowDraft as unknown as Record<string, unknown> });
      await departmentUtils.projectContent.list.invalidate();
      setNewRowDraft(null);
    } finally {
      setIsSavingNewRow(false);
    }
  };

  // 두 사업의 serial을 맞바꿔서 저장한다 - 표에서 "위로/아래로"는 이 결과로 나타난다.
  const swapSerial = async (a: Project, b: Project) => {
    setReorderingId(a.id);
    // 저장은 병합이 아니라 덮어쓰기다. 정적 데이터셋에 있는 사업은 serial만 보내도 나머지는
    // 렌더링 시 정적 베이스와 합쳐지니 안전하지만, "행 추가"로 만든 사업(custom row)은 저장된
    // payload 자체가 사업 전체라 serial만 보내면 나머지가 전부 사라진다 - 그 경우 전체를 다시 보낸다.
    const payloadFor = (project: Project, newSerial: number) =>
      (isCustomRowId(project.id) ? { ...project, serial: newSerial } : { serial: newSerial }) as unknown as Record<string, unknown>;
    try {
      await Promise.all([
        saveProjectContent.mutateAsync({ projectId: a.id, payload: payloadFor(a, b.serial) }),
        saveProjectContent.mutateAsync({ projectId: b.id, payload: payloadFor(b, a.serial) }),
      ]);
      await departmentUtils.projectContent.list.invalidate();
    } finally {
      setReorderingId(null);
    }
  };
  const moveRow = (project: Project, direction: "up" | "down") => {
    const index = departmentProjects.findIndex((p) => p.id === project.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= departmentProjects.length) return;
    swapSerial(project, departmentProjects[targetIndex]);
  };
  const filteredProjects = departmentProjects
    .filter((project) => {
      const normalizedSearch = projectSearch.trim().toLowerCase();
      if (!normalizedSearch) return true;
      return `${project.project_name} ${project.department} ${project.category} ${project.project_type} ${project.region} ${project.district} ${project.town}`.toLowerCase().includes(normalizedSearch);
    })
    .filter((project) => stageFilter === "전체" || project.current_stage === stageFilter)
    .filter((project) => divisionFilter === "전체" || project.region === divisionFilter)
    .filter((project) => inRange(project.total_cost_million_krw ?? 0, totalCostMin, totalCostMax))
    .filter((project) => inRange(project.budget_2027_million_krw ?? 0, budget2027Min, budget2027Max))
    .filter((project) => {
      const value = budgetValueFor(project);
      const min = minBudget === "" ? 0 : Number(minBudget);
      const max = maxBudget === "" ? Number.POSITIVE_INFINITY : Number(maxBudget);
      return value >= min && value <= max;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const key = sortColumn === "total_cost" ? "total_cost_million_krw" : "budget_2027_million_krw";
      const diff = (a[key] ?? 0) - (b[key] ?? 0);
      return sortDir === "asc" ? diff : -diff;
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
        <div className="dept-dashboard-search">
          <PodaSearch value={projectSearch} onChange={setProjectSearch} projects={departmentProjects} onSelectProject={onSelectProject} />
        </div>
      </div>

      <p className="dept-baseline-note">{BUDGET_BASELINE_LABEL}</p>
      <div className="dept-kpi-grid dept-kpi-grid-selected">
        <div className="dept-kpi"><span>총사업비</span><strong>{formatDepartmentAmount(totalCost)}</strong></div>
        <div className="dept-kpi"><span>기투자액</span><strong>{formatDepartmentAmount(investedAmount)}</strong><small>2026년까지 누적 투자</small></div>
        <div className="dept-kpi dept-kpi-accent"><span>2027년 편성예정액</span><strong>{formatDepartmentAmount(budget2027)}</strong></div>
        <div className="dept-kpi"><span>향후 계획예산액</span><strong>{formatDepartmentAmount(futurePlanBudget)}</strong><small>2028년 이후 계획액</small></div>
      </div>

      <div className="dept-panel dept-panel-projects dept-panel-selected">
        <div className="dept-filter-row dept-budget-filter-row">
          <button type="button" className="dept-table-export" onClick={exportBudgetCsv}><Download size={14} /> CSV 출력</button>
          {isAdmin && !newRowDraft && <button type="button" className="dept-table-export" onClick={startNewRow}><Plus size={14} /> 행 추가</button>}
          <span>(단위:백만원)</span>
          {isAdmin && isFiltered && <span className="dept-reorder-hint">필터·정렬이 걸려 있으면 순서를 바꿀 수 없습니다 - 초기화 후 이용해 주세요.</span>}
        </div>
        <div className="dept-project-table-wrap">
          <table className="dept-project-table"><thead><tr>
            <th className="dept-filter-accordion">
              <button type="button" className={`dept-filter-accordion-toggle ${isDivisionOpen ? "is-open" : ""}`} onClick={() => setIsDivisionOpen((open) => !open)}>구분{divisionFilter !== "전체" ? `: ${divisionFilter}` : ""} <ChevronDown size={13} /></button>
              {isDivisionOpen && (
                <div className="dept-filter-accordion-panel">
                  {["전체", "신규", "계속"].map((option) => (
                    <button key={option} type="button" className={divisionFilter === option ? "is-active" : ""} onClick={() => { setDivisionFilter(option); setIsDivisionOpen(false); }}>{option}</button>
                  ))}
                </div>
              )}
            </th>
            <th>사업명</th>
            <th className="dept-filter-accordion">
              <button type="button" className={`dept-filter-accordion-toggle ${isStageOpen ? "is-open" : ""}`} onClick={() => setIsStageOpen((open) => !open)}>현추진단계{stageFilter !== "전체" ? `: ${stageFilter}` : ""} <ChevronDown size={13} /></button>
              {isStageOpen && (
                <div className="dept-filter-accordion-panel">
                  <button type="button" className={stageFilter === "전체" ? "is-active" : ""} onClick={() => { setStageFilter("전체"); setIsStageOpen(false); }}>전체</button>
                  {stageOptions.map((stage) => (
                    <button key={stage} type="button" className={stageFilter === stage ? "is-active" : ""} onClick={() => { setStageFilter(stage); setIsStageOpen(false); }}>{stage}</button>
                  ))}
                </div>
              )}
            </th>
            <th className="dept-filter-accordion dept-filter-accordion-amount">
              <button type="button" className={`dept-filter-accordion-toggle ${isTotalCostOpen ? "is-open" : ""}`} onClick={() => setIsTotalCostOpen((open) => !open)}>총사업비{(totalCostMin || totalCostMax) ? " •" : ""} <ChevronDown size={13} /></button>
              {isTotalCostOpen && (
                <div className="dept-filter-accordion-panel dept-filter-range-panel">
                  <button type="button" className={sortColumn === "total_cost" && sortDir === "desc" ? "is-active" : ""} onClick={() => { setSortColumn("total_cost"); setSortDir("desc"); }}>큰 금액순</button>
                  <button type="button" className={sortColumn === "total_cost" && sortDir === "asc" ? "is-active" : ""} onClick={() => { setSortColumn("total_cost"); setSortDir("asc"); }}>작은 금액순</button>
                  <div className="dept-filter-range-divider" />
                  <div className="dept-filter-range-row">
                    <input type="number" placeholder="최소" value={totalCostMin} onChange={(event) => setTotalCostMin(event.target.value)} />
                    <span>~</span>
                    <input type="number" placeholder="최대" value={totalCostMax} onChange={(event) => setTotalCostMax(event.target.value)} />
                  </div>
                  <button type="button" onClick={() => { setTotalCostMin(""); setTotalCostMax(""); if (sortColumn === "total_cost") setSortColumn(null); }}>초기화</button>
                </div>
              )}
            </th>
            <th>기투자액</th>
            <th className="dept-filter-accordion dept-filter-accordion-amount">
              <button type="button" className={`dept-filter-accordion-toggle ${isBudget2027Open ? "is-open" : ""}`} onClick={() => setIsBudget2027Open((open) => !open)}>2027년 예산액{(budget2027Min || budget2027Max) ? " •" : ""} <ChevronDown size={13} /></button>
              {isBudget2027Open && (
                <div className="dept-filter-accordion-panel dept-filter-range-panel">
                  <button type="button" className={sortColumn === "budget_2027" && sortDir === "desc" ? "is-active" : ""} onClick={() => { setSortColumn("budget_2027"); setSortDir("desc"); }}>큰 금액순</button>
                  <button type="button" className={sortColumn === "budget_2027" && sortDir === "asc" ? "is-active" : ""} onClick={() => { setSortColumn("budget_2027"); setSortDir("asc"); }}>작은 금액순</button>
                  <div className="dept-filter-range-divider" />
                  <div className="dept-filter-range-row">
                    <input type="number" placeholder="최소" value={budget2027Min} onChange={(event) => setBudget2027Min(event.target.value)} />
                    <span>~</span>
                    <input type="number" placeholder="최대" value={budget2027Max} onChange={(event) => setBudget2027Max(event.target.value)} />
                  </div>
                  <button type="button" onClick={() => { setBudget2027Min(""); setBudget2027Max(""); if (sortColumn === "budget_2027") setSortColumn(null); }}>초기화</button>
                </div>
              )}
            </th>
            <th>향후 계획예산액</th><th>예산집행률</th>
            {isAdmin && <th className="dept-reorder-col">순서</th>}
          </tr></thead><tbody>
            {filteredProjects.length > 0 && <tr className="dept-total-row">
              <td></td><td><strong>합계</strong></td><td></td><td className="dept-amount-cell">{formatBudgetNumber(filteredTotalCost)}</td><td className="dept-amount-cell">{formatBudgetNumber(filteredInvested)}</td><td className="dept-amount-cell">{formatBudgetNumber(filteredBudget2027)}</td><td className="dept-amount-cell">{formatBudgetNumber(filteredFuturePlan)}</td><td></td>{isAdmin && <td></td>}
            </tr>}
            {isAdmin && newRowDraft && (
              <tr className="dept-new-row" onClick={(event) => event.stopPropagation()}>
                <td>
                  <select value={newRowDraft.region} onChange={(event) => updateNewRowDraft({ region: event.target.value })}>
                    <option value="신규">신규</option>
                    <option value="계속">계속</option>
                  </select>
                </td>
                <td><input type="text" placeholder="사업명 입력" value={newRowDraft.project_name} onChange={(event) => updateNewRowDraft({ project_name: event.target.value })} autoFocus /></td>
                <td><input type="text" placeholder="추진단계" value={newRowDraft.current_stage} onChange={(event) => updateNewRowDraft({ current_stage: event.target.value })} /></td>
                <td className="dept-amount-cell"><input type="number" placeholder="0" value={newRowDraft.total_cost_million_krw ?? ""} onChange={(event) => updateNewRowDraft({ total_cost_million_krw: event.target.value === "" ? null : Number(event.target.value) })} /></td>
                <td className="dept-amount-cell"><input type="number" placeholder="0" value={newRowDraft.invested_to_2026_million_krw ?? ""} onChange={(event) => updateNewRowDraft({ invested_to_2026_million_krw: event.target.value === "" ? null : Number(event.target.value) })} /></td>
                <td className="dept-amount-cell"><input type="number" placeholder="0" value={newRowDraft.budget_2027_million_krw ?? ""} onChange={(event) => updateNewRowDraft({ budget_2027_million_krw: event.target.value === "" ? null : Number(event.target.value) })} /></td>
                <td className="dept-amount-cell"><input type="number" placeholder="0" value={newRowDraft.card_budget_2028_plus_million_krw ?? ""} onChange={(event) => updateNewRowDraft({ card_budget_2028_plus_million_krw: event.target.value === "" ? null : Number(event.target.value) })} /></td>
                <td className="dept-amount-cell"><input type="number" min="0" max="100" placeholder="0" value={newRowDraft.expected_completion || ""} onChange={(event) => updateNewRowDraft({ expected_completion: event.target.value })} /></td>
                <td className="dept-new-row-actions">
                  <button type="button" className="dept-new-row-save" onClick={saveNewRow} disabled={isSavingNewRow || !newRowDraft.project_name.trim()}><Save size={13} /> {isSavingNewRow ? "저장 중…" : "저장"}</button>
                  <button type="button" className="dept-new-row-cancel" onClick={cancelNewRow} disabled={isSavingNewRow}><X size={13} /></button>
                </td>
              </tr>
            )}
            {filteredProjects.map((project, index) => <tr key={project.id} onClick={() => onSelectProject(project)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onSelectProject(project); }}>
              <td><span className={`dept-project-type ${project.region === "신규" ? "is-new" : "is-continuing"}`}>{project.region === "신규" || project.region === "계속" ? project.region : "-"}</span></td><td><strong>{formatProjectNameLines(project.project_name)}</strong></td><td><span className="dept-stage-chip">{project.current_stage || "미등록"}</span></td><td className="dept-amount-cell">{formatBudgetNumber(project.total_cost_million_krw ?? 0)}</td><td className="dept-amount-cell">{formatBudgetNumber(project.invested_to_2026_million_krw ?? 0)}</td><td className="dept-amount-cell">{formatBudgetNumber(project.budget_2027_million_krw ?? 0)}</td><td className="dept-amount-cell">{formatBudgetNumber(futurePlanBudgetFor(project))}</td><td><div className="dept-progress"><b>{parseProgress(project)}%</b><span><em style={{ width: `${parseProgress(project)}%` }} /></span></div></td>
              {isAdmin && (
                <td className="dept-reorder-col" onClick={(event) => event.stopPropagation()}>
                  <button type="button" aria-label="위로 이동" disabled={isFiltered || index === 0 || reorderingId !== null} onClick={() => moveRow(project, "up")}><ChevronUp size={14} /></button>
                  <button type="button" aria-label="아래로 이동" disabled={isFiltered || index === filteredProjects.length - 1 || reorderingId !== null} onClick={() => moveRow(project, "down")}><ChevronDown size={14} /></button>
                </td>
              )}
            </tr>)}
            {filteredProjects.length === 0 && <tr><td colSpan={isAdmin ? 9 : 8} className="dept-empty">조건에 맞는 사업이 없습니다.</td></tr>}
          </tbody></table>
        </div>
      </div>
    </section>
  );
}

function PodaSearch({ value, onChange, projects, onSelectProject }: { value: string; onChange: (value: string) => void; projects: Project[]; onSelectProject: (project: Project) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedSearch = value.trim().toLowerCase();
  const matches = normalizedSearch
    ? projects.filter((project) => `${project.project_name} ${project.department} ${project.category} ${project.project_type} ${project.region} ${project.district} ${project.town}`.toLowerCase().includes(normalizedSearch)).slice(0, 8)
    : [];

  const toggleSearch = () => {
    setIsOpen((open) => {
      const nextOpen = !open;
      if (nextOpen) window.requestAnimationFrame(() => inputRef.current?.focus());
      return nextOpen;
    });
  };

  return (
    <div className={`site-search dept-inline-search${isOpen ? " is-open" : ""}`}>
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
        placeholder="사업명 검색"
        type="text"
        name="department-project-search"
        className="site-search-input"
        aria-label="사업명·부서·분야 검색"
      />
      <button type="button" className="site-search-toggle" onClick={toggleSearch} aria-label={isOpen ? "검색 닫기" : "검색 열기"}>
        <Search size={18} strokeWidth={2.2} />
      </button>
      {isOpen && normalizedSearch && (
        <div className="site-search-results dept-inline-search-results">
          {matches.length > 0 ? matches.map((project) => (
            <button type="button" key={project.id} className="site-search-result" onMouseDown={(event) => event.preventDefault()} onClick={() => { onSelectProject(project); setIsOpen(false); }}>
              <span>{project.project_name}</span>
              <small>{project.department} · {project.current_stage || "미등록"}</small>
            </button>
          )) : <div className="site-search-empty">검색 결과가 없습니다.</div>}
        </div>
      )}
    </div>
  );
}
// Floating pill nav, top-center, translucent glass style. Always shows all
// 3 items — HOME / MENU / MAP VIEW — in one static bar (ref: saasland.framer.media
// top-left pill, where only the active item gets a capsule background and
// the rest sit plain on the shared bar) so nothing shifts position on
// click. MENU toggles a horizontal strip of department links below the bar.
function FloatingNavBar({
  organization: navOrganization,
  onGoHome,
  onOpenMap,
  onSelectDepartment,
  onSelectProject,
  activeDepartmentName,
  activeProjectDepartmentName,
  includeMapView = true,
}: {
  organization: Bureau[];
  onGoHome: () => void;
  onOpenMap: () => void;
  onSelectDepartment: (departmentName: string) => void;
  onSelectProject: (project: Project) => void;
  activeDepartmentName: string | null;
  activeProjectDepartmentName: string | null;
  includeMapView?: boolean;
}) {
  // DEPARTMENT_ORDER와 같은 순서로 맞춘다. 새 부서가 생겨도(예: 독립기념관) 실제 사업이 있어야만
  // 여기 나열된 것 중 반영되므로(projectsByDepartment 필터링), 이 배열엔 앞으로 생길 수 있는
  // 문화관광국 소속 부서까지 미리 다 적어둔다.
  const floatingNavDepartments = ["문화예술과", "문화유산과", "독립기념관", "관광진흥과", "도서관정책과", "체육진흥과", "전국체전추진단"];
  // navOrganization은 overrides가 반영된 liveOrganization이어야 한다 — 관리자가 부서별
  // 현황 표에서 사업 순서를 바꾸면(serial 변경) 이 드롭다운도 같은 순서로 보여야 하기 때문.
  const projectsByDepartment = navOrganization.flatMap((bureau) => bureau.departments);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [openDeptName, setOpenDeptName] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const openDept = openDeptName && showProjects ? projectsByDepartment.find((item) => item.name === openDeptName) : null;

  useEffect(() => {
    if (!activeDepartmentName && !activeProjectDepartmentName) {
      setIsDeptOpen(false);
      setOpenDeptName(null);
      setShowProjects(false);
    }
  }, [activeDepartmentName, activeProjectDepartmentName]);

  if (!isExpanded) {
    return (
      <nav className="floating-nav" aria-label="빠른 이동">
        <button type="button" className="floating-nav-link" onClick={() => setIsExpanded(true)}>MENU</button>
      </nav>
    );
  }

  return (
    <nav className="floating-nav" aria-label="빠른 이동">
      <button
        type="button"
        className="floating-nav-link"
        onClick={() => { onGoHome(); setIsDeptOpen(false); setOpenDeptName(null); setShowProjects(false); }}
      >
        HOME
      </button>
      <div className="floating-nav-item">
        <button
          type="button"
          className={`floating-nav-link ${activeDepartmentName ? "is-selected" : ""}`}
          onClick={() => { setIsExpanded(false); setOpenDeptName(null); setShowProjects(false); }}
        >
          MENU
        </button>
        <div className="floating-nav-dropdown-row-static">
          {floatingNavDepartments.map((name) => {
            const isOpen = openDeptName === name;
            const isActive = activeDepartmentName === name;
            return (
              <div className="floating-nav-dept-item" key={name}>
                <button
                  type="button"
                  className={isOpen ? "is-selected" : ""}
                  onClick={() => {
                    if (isOpen && showProjects) {
                      // 사업명 드롭다운이 이미 열려있는 상태에서 부서명을 한 번 더 누르면 - 프로젝트
                      // 상세 페이지 등 부서현황이 아닌 곳에 있었더라도 - 그 부서의 부서현황 페이지로
                      // 이동하고 드롭다운은 닫는다.
                      onSelectDepartment(name);
                      setShowProjects(false);
                    } else if (isOpen) {
                      setShowProjects(true);
                    } else {
                      onSelectDepartment(name);
                      setOpenDeptName(name);
                      setShowProjects(false);
                    }
                  }}
                >
                  {isActive && <i className="floating-nav-dot" />}
                  {name}
                </button>
                {isOpen && showProjects && openDept && openDept.projects.length > 0 && (
                  <div className="floating-nav-dropdown-projects-anchored">
                    {openDept.projects.map((project) => (
                      <button
                        type="button"
                        key={project.id}
                        onClick={() => { onSelectProject(project); setShowProjects(false); }}
                      >
                        {project.project_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {includeMapView && (
        <button
          type="button"
          className="floating-nav-link"
          onClick={() => { onOpenMap(); setIsDeptOpen(false); setOpenDeptName(null); setShowProjects(false); }}
        >
          MAP VIEW
        </button>
      )}
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

// Positions the hero's compositional grid (two full-height verticals tied
// to the stat row's own column dividers, plus a stepped pair of horizontal
// segments in the clear space above the eyebrow / below the cta-pill) by
// measuring real DOM rects instead of guessing fixed percentages — the
// only way to keep the lines from ever crossing the title text at any
// viewport width.
function useHeroGridPosition() {
  const heroRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLHeadingElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const statRowRef = useRef<HTMLDivElement>(null);
  const statLeftRef = useRef<HTMLDivElement>(null);
  const statMidRef = useRef<HTMLDivElement>(null);
  const statRightRef = useRef<HTMLDivElement>(null);
  const vLeftRef = useRef<HTMLSpanElement>(null);
  const vRightRef = useRef<HTMLSpanElement>(null);
  const hTopRef = useRef<HTMLSpanElement>(null);
  const dotTopLRef = useRef<HTMLSpanElement>(null);
  const dotTopMidRef = useRef<HTMLSpanElement>(null);
  const dotBot25Ref = useRef<HTMLSpanElement>(null);
  const dotBot50Ref = useRef<HTMLSpanElement>(null);
  const dotBotRightRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const position = () => {
      const hero = heroRef.current;
      const eyebrow = eyebrowRef.current;
      const statRow = statRowRef.current;
      const leftStat = statLeftRef.current;
      const midStat = statMidRef.current;
      const rightStat = statRightRef.current;
      if (!hero || !eyebrow || !statRow || !leftStat || !midStat || !rightStat) return;
      const heroRect = hero.getBoundingClientRect();
      const eyebrowRect = eyebrow.getBoundingClientRect();
      const rowRect = statRow.getBoundingClientRect();
      const leftRect = leftStat.getBoundingClientRect();
      const midRect = midStat.getBoundingClientRect();
      const rightRect = rightStat.getBoundingClientRect();

      const leftX = leftRect.left - heroRect.left;
      const midX = midRect.left - heroRect.left;
      const rightX = rightRect.left - heroRect.left;
      const leftPct = (leftX / heroRect.width) * 100;
      const midPct = (midX / heroRect.width) * 100;
      const rightPct = (rightX / heroRect.width) * 100;
      const topY = heroRect.top + (eyebrowRect.top - heroRect.top) * 0.7 - heroRect.top;
      // The real "bottom" line is the stat row's own top border — anchor every
      // bottom-tier dot/bracket to that instead of an independently computed
      // Y, so they can never drift apart from the line they're supposed to mark.
      const botY = rowRect.top - heroRect.top;

      if (vLeftRef.current) vLeftRef.current.style.left = `${leftX}px`;
      if (vRightRef.current) vRightRef.current.style.left = `${rightX}px`;
      if (hTopRef.current) { hTopRef.current.style.top = `${topY}px`; hTopRef.current.style.left = `${leftX}px`; }
      statRow.style.setProperty("--hero-stat-line-right", `${Math.max(0, heroRect.width - rightX)}px`);
      if (dotTopLRef.current) { dotTopLRef.current.style.top = `${topY}px`; dotTopLRef.current.style.left = `${leftPct}%`; }
      if (dotTopMidRef.current) { dotTopMidRef.current.style.top = `${topY}px`; dotTopMidRef.current.style.left = `${rightPct}%`; }
      if (dotBot25Ref.current) { dotBot25Ref.current.style.top = `${botY}px`; dotBot25Ref.current.style.left = `${leftPct}%`; }
      if (dotBot50Ref.current) { dotBot50Ref.current.style.top = `${botY}px`; dotBot50Ref.current.style.left = `${midPct}%`; }
      if (dotBotRightRef.current) { dotBotRightRef.current.style.top = `${botY}px`; dotBotRightRef.current.style.left = `${rightPct}%`; }
    };
    position();
    window.addEventListener("resize", position);
    // Custom fonts load with font-display:swap, so the very first measurement
    // (taken against fallback-font metrics) can land a few px off the text's
    // final position — re-measure once webfonts finish swapping in.
    document.fonts?.ready?.then(position).catch(() => {});
    return () => window.removeEventListener("resize", position);
  }, []);

  return { heroRef, eyebrowRef, pillRef, statRowRef, statLeftRef, statMidRef, statRightRef, vLeftRef, vRightRef, hTopRef, dotTopLRef, dotTopMidRef, dotBot25Ref, dotBot50Ref, dotBotRightRef };
}

function LandingPage() {
  const totalBudget = projects.reduce((sum, project) => sum + (project.total_cost_million_krw ?? 0), 0);
  const investedTo2026 = projects.reduce((sum, project) => sum + (project.invested_to_2026_million_krw ?? 0), 0);
  const budgetRequest2027 = projects.reduce((sum, project) => sum + (project.budget_2027_million_krw ?? 0), 0);
  const projectCount = useCountUp(projects.length, 1100);
  const budgetCount = useCountUp(totalBudget, 1400);
  const budgetRequestCount = useCountUp(budgetRequest2027, 1200);
  const investedCount = useCountUp(investedTo2026, 1200);
  const grid = useHeroGridPosition();

  return (
    <section className="landing-page">
      <div className="hero-panel landing-hero-panel" ref={grid.heroRef}>
        <div className="landing-hero-bg" aria-hidden="true" />
        <div className="landing-noise" aria-hidden="true" />
        <span className="landing-hero-v" ref={grid.vLeftRef} aria-hidden="true" />
        <span className="landing-hero-v" ref={grid.vRightRef} aria-hidden="true" />
        <span className="landing-hero-h" ref={grid.hTopRef} aria-hidden="true" />
        <span className="landing-hero-dot" ref={grid.dotTopLRef} aria-hidden="true" />
        <span className="landing-hero-dot" ref={grid.dotTopMidRef} aria-hidden="true" />
        <span className="landing-hero-dot" ref={grid.dotBot25Ref} aria-hidden="true" />
        <span className="landing-hero-dot" ref={grid.dotBot50Ref} aria-hidden="true" />
        <span className="landing-hero-dot" ref={grid.dotBotRightRef} aria-hidden="true" />

        <div className="landing-hero-content">
          <div className="landing-hero-title-group">
            <h1 ref={grid.eyebrowRef} className="landing-hero-title"><span className="landing-hero-title-line landing-hero-title-line-a">MAJOR INVESTMENT</span><span className="landing-hero-title-line landing-hero-title-line-b">BUDGET</span></h1>
          </div>
          <span className="landing-hero-pill" ref={grid.pillRef}>화성시 주요투자사업 대시보드</span>
        </div>

        <div className="landing-hero-statrow" ref={grid.statRowRef}>
          <span className="landing-hero-dot" style={{ top: 0, left: "1.5%" }} aria-hidden="true" />
          <div className="landing-hero-stat">
            <em>관리사업</em>
            <b>{Math.round(projectCount)}<small>개</small></b>
          </div>
          <div className="landing-hero-stat" ref={grid.statLeftRef}>
            <em>총사업비</em>
            <b>{formatBudgetNumber(Math.round(budgetCount))}<small>백만원</small></b>
          </div>
          <div className="landing-hero-stat" ref={grid.statMidRef}>
            <em>2027년 예산 요구액</em>
            <b>{formatBudgetNumber(Math.round(budgetRequestCount))}<small>백만원</small></b>
          </div>
          <div className="landing-hero-stat" ref={grid.statRightRef}>
            <em>2026년까지 누적 투자액</em>
            <b>{formatBudgetNumber(Math.round(investedCount))}<small>백만원</small></b>
          </div>
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
  const [siteUnlocked, setSiteUnlocked] = useState(() => typeof window !== "undefined" && localStorage.getItem(SITE_UNLOCK_STORAGE_KEY) === "1");
  const authQuery = trpc.auth.me.useQuery();
  const overridesQuery = trpc.projectContent.list.useQuery();
  const liveProjects = useMemo(() => {
    const overridden = projects.map((project) => {
      const override = overridesQuery.data?.find((item) => item.projectId === project.id);
      return override ? { ...project, ...(override.payload as Partial<Project>) } : project;
    });
    // 부서별 현황 표에서 관리자가 새로 추가한 사업은 정적 데이터셋에 없어서 위 map으로는 안 잡힌다.
    // custom-row- 로 시작하는 id의 override는 그 payload 자체가 사업 전체 데이터다.
    const customRows = (overridesQuery.data ?? [])
      .filter((item: { projectId: string }) => isCustomRowId(item.projectId))
      .map((item: { payload: unknown }) => item.payload as unknown as Project);
    return [...overridden, ...customRows];
  }, [overridesQuery.data]);
  const isAdmin = authQuery.data?.role === "admin";
  // 부서별 현황 표(DepartmentDashboard)와 동일하게 overrides가 반영된 순서로 상단 메뉴
  // 드롭다운을 채운다 — 검색어 필터는 적용하지 않는다(드롭다운은 검색과 무관하게 항상 전체 목록).
  const liveOrganization = useMemo(() => {
    const org = buildOrganization(liveProjects);
    org.forEach((bureau) =>
      bureau.departments.forEach((department) => department.projects.sort((a, b) => a.serial - b.serial)),
    );
    return org;
  }, [liveProjects]);

  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDepartmentDashboard, setSelectedDepartmentDashboard] = useState("전체");
  const [activeView, setActiveView] = useState<"landing" | "project" | "department" | "pledges">("landing");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleOrganization = useMemo(
    () =>
      buildOrganization(liveProjects)
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
    [normalizedQuery, liveProjects],
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
    window.scrollTo(0, 0);
  };
  const goPledges = () => {
    setSelectedProject(null);
    setActiveView("pledges");
    window.scrollTo(0, 0);
  };
  const goDepartment = (departmentName: string) => {
    setSelectedDepartmentDashboard(departmentName);
    setSelectedProject(null);
    setActiveView("department");
    window.scrollTo(0, 0);
  };
  const goProject = (project: Project) => {
    setSelectedProject(project);
    setActiveView("project");
    setQuery("");
    window.scrollTo(0, 0);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--pd-ground)] text-white">
      {/* On the landing page the header floats over the full-height hero
          (no reserved space). On every other page it sits in normal flow
          and scrolls away with the content instead of staying pinned. */}
      <div className={`site-header-sticky ${activeView === "landing" ? "site-header-sticky-overlay" : ""}`}>
        <button type="button" className="site-logo-mark" onClick={goLanding} aria-label="홈으로 이동">
          <span className="site-logo-mark-word">HIB.</span>
          <span className="site-logo-mark-tagline"><span>화성시</span><span>주요투자사업</span></span>
        </button>
        <div className="floating-nav-row">
          <FloatingNavBar
            organization={liveOrganization}
            onGoHome={goLanding}
            onOpenMap={goPledges}
            onSelectDepartment={goDepartment}
            onSelectProject={goProject}
            activeDepartmentName={activeView === "department" ? selectedDepartmentDashboard : null}
            activeProjectDepartmentName={activeView === "project" ? selectedProject?.department ?? null : null}
            includeMapView={false}
          />
        </div>
        <button type="button" className={`landing-map-button${activeView === "pledges" ? " is-map-active" : ""}`} onClick={goPledges}>민선9기 공약</button>
        {/* 예전엔 지도 화면에서만 로그인 버튼이 보였다 - 헤더는 모든 화면(홈/메뉴/지도/사업상세)에서
            항상 떠 있으니 여기서 전역으로 하나만 노출한다. 관리자로 로그인된 뒤에는 여기엔 아무것도
            띄우지 않고, 사업상세 화면의 "사업 정보 편집" 버튼처럼 화면별로 의미 있는 편집 트리거만
            그 화면 안에서 계속 보여준다(ProjectDetail이 이 슬롯에 포털로 얹는 부분 참고). */}
        <div id="pd-admin-login-slot" className="pd-admin-login-slot">
          {!isAdmin && <AdminLoginControl className="pd-edit-login" onLoggedIn={() => authQuery.refetch()} />}
        </div>
        {/* 검색 기능은 유지하되, 당분간 화면에서는 노출하지 않음 */}
        {false && activeView !== "landing" && (
          <div className={`site-search ${isSearchFocused ? "is-open" : ""}`}>
            <input
              type="text"
              className="site-search-input"
              placeholder="사업명 검색"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 150)}
            />
            <button
              type="button"
              className="site-search-toggle"
              aria-label="검색"
              onClick={() => setIsSearchFocused((open) => !open)}
            >
              <Search />
            </button>
            {isSearchFocused && normalizedQuery && (
              <div className="site-search-results">
                {searchMatches.length > 0 ? (
                  searchMatches.slice(0, 8).map(({ project, departmentName }) => (
                    <button
                      type="button"
                      key={project.id}
                      className="site-search-result"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        goProject(project);
                        setIsSearchFocused(false);
                      }}
                    >
                      <span>{project.project_name}</span>
                      <small>{departmentName}</small>
                    </button>
                  ))
                ) : (
                  <div className="site-search-empty">검색 결과가 없습니다</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <main className={`app-main relative flex-1 overflow-hidden ${activeView === "landing" ? "app-main-flush" : ""}`}>
          <div className="pointer-events-none absolute right-[8%] top-[-8%] h-[520px] w-[170px] rotate-[24deg] rounded-full bg-[var(--pd-accent-a)]/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-8%] right-[17%] h-[440px] w-[145px] -rotate-[28deg] rounded-full bg-[var(--pd-accent-b)]/25 blur-3xl" />
          {selectedProject && <div className="app-panel-topbar" aria-hidden="true" />}
          {activeView === "pledges" ? (
            <PledgeBoard isAdmin={isAdmin} />
          ) : activeView === "department" ? (
            <DepartmentDashboard key={selectedDepartmentDashboard} projects={liveProjects} initialDepartment={selectedDepartmentDashboard} isAdmin={isAdmin} onSelectProject={(project) => { setSelectedProject(project); setActiveView("project"); }} />
          ) : activeView === "project" && selectedProject ? (
            <div className="detail-panel-shell">
              <ProjectDetail project={selectedProject} isAdmin={isAdmin} onAdminLoggedIn={() => authQuery.refetch()} onProjectUpdated={(projectId, patch) => setSelectedProject((current) => current?.id === projectId ? { ...current, ...patch } : current)} searchValue={query} onSearchChange={setQuery} searchProjects={liveProjects} onSelectProject={goProject} />
            </div>
          ) : (
            <LandingPage />
          )}
      </main>
    </div>
  );
}
