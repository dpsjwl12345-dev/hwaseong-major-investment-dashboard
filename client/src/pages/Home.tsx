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
import { ProjectLocationMap, type ProjectLocationMapData } from "../components/ProjectLocationMap";
import { InvestmentRealMap } from "../components/InvestmentRealMap";
import { InvestmentReviewBoard } from "../components/InvestmentReviewBoard";
// 예산 숫자는 화면마다 따로 읽지 않는다 — 전부 이 한 함수를 거친다.
import { deriveProjectBudget } from "../lib/projectBudget";

const pb = deriveProjectBudget;

type Project = {
  id: string;
  serial: number;
  department: string;
  project_name: string;
  // 스포츠시설추진TF 소관 사업(축구전용경기장~권역별 체육센터 건립) 제목 앞에 TF 뱃지를 붙인다.
  tf_badge?: boolean;
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
  // 이미지 묶음 제목(기본 "조감도"). 위치도만 있는 사업은 "위치도"로 바꿔 쓴다.
  rendering_images_title?: string;
  // 인터랙티브 위치도(벡터 지도 + 대상지 경계 + 주변 시설 마커). 있으면 "위치도" 탭 맨 위에 보인다.
  location_map?: ProjectLocationMapData;
  overview_map?: { title?: string; image?: string; basemap?: "illustration"; spots: { label: string; x: number; y: number; zoomImage: string; tracked?: boolean; detail?: string }[] };
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
  card_admin_status: { mid_term_fiscal?: boolean; investment_review?: boolean; public_property?: boolean; none?: boolean; mid_term_fiscal_date?: string; investment_review_date?: string; public_property_date?: string };
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
  // 핀은 상시 라벨(장소명)만 보여주고, 클릭하면 주소·규모 같은 상세 텍스트를 그 자리에 펼친다.
  // 배경(지도) 클릭은 그대로 전체 위치도 확대(lightbox)로 이어진다 - 핀 클릭만 막아서(stopPropagation)
  // 확대와 상세보기가 서로 안 겹치게 한다.
  const [openSpotLabel, setOpenSpotLabel] = useState<string | null>(null);
  const renderSpots = () => map.spots.map((spot, index) => (
    <span key={spot.label} className={`pd-spotmap-pin${spot.tracked ? " is-tracked" : ""}${openSpotLabel === spot.label ? " is-open" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }}>
      {spot.detail ? (
        <button
          type="button"
          className="pd-spotmap-pin-trigger"
          onClick={(event) => { event.stopPropagation(); setOpenSpotLabel((current) => (current === spot.label ? null : spot.label)); }}
        >
          <span className="pd-spotmap-pin-dot">{index + 1}</span>
          <span className="pd-spotmap-pin-label">{spot.label}</span>
        </button>
      ) : (
        <>
          <span className="pd-spotmap-pin-dot">{index + 1}</span>
          <span className="pd-spotmap-pin-label">{spot.label}</span>
        </>
      )}
      {spot.detail && openSpotLabel === spot.label && (
        <span className="pd-spotmap-pin-detail" onClick={(event) => event.stopPropagation()}>{spot.detail}</span>
      )}
    </span>
  ));
  const mapBackground = map.basemap === "illustration" ? (
    <svg className="pd-spotmap-illustration" viewBox={`0 0 ${hwaseongBoundary.width} ${hwaseongBoundary.height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${projectName} 위치도`}>
      <path d={hwaseongBoundary.d} />
    </svg>
  ) : (
    <img src={map.image} alt={`${projectName} 위치도`} />
  );
  return (
    <div className="pd-kv-row mt-4">
      <div className="pd-kv" style={{ gridColumn: "1 / -1" }}>
        <span className="pd-kv-label">{map.title || "거점 위치도"}</span>
        <div
          className={`pd-spotmap mt-1${map.basemap === "illustration" ? " is-illustration" : ""}`}
          onClick={() => setIsZoomed(true)}
          role="button"
          tabIndex={0}
          aria-label={`${map.title || "거점 위치도"} 확대 보기`}
          onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setIsZoomed(true); }}
        >
          <div className="pd-spotmap-bg">{mapBackground}</div>
          {renderSpots()}
        </div>
      </div>
      {isZoomed && (
        <div className="pd-lightbox-backdrop" onClick={() => setIsZoomed(false)}>
          <button type="button" className="pd-lightbox-close" onClick={() => setIsZoomed(false)} aria-label="닫기"><X size={20} /></button>
          <div className="pd-lightbox-content pd-spotmap-lightbox" onClick={(event) => event.stopPropagation()}>
            <div className="pd-spotmap is-illustration is-zoomed">
              <div className="pd-spotmap-bg">{mapBackground}</div>
              {renderSpots()}
            </div>
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

// 예산 집행 현황 = 집행액 ÷ 예산현액(2026년 편성액 + 이월액).
// 예전에는 사업 데이터에 손으로 적어둔 execution_rate를 그대로 찍어서, 집행액을
// 고쳐도 비율이 따라오지 않고 0%로 남아 있는 사업이 많았다.
function currentBudget(project: Project) {
  const budget2026 = project.card_budget_2026_million_krw ?? 0;
  const carryover = project.carryover_items?.length
    ? project.carryover_items.reduce((sum, item) => sum + (item.amount_million_krw ?? 0), 0)
    : project.carryover_million_krw ?? 0;
  return budget2026 + carryover;
}

function executionRate(project: Project) {
  const executed = project.card_execution_amount_million_krw;
  const base = currentBudget(project);
  if (executed == null || base <= 0) return project.execution_rate ?? 0;
  return Math.min(100, Math.max(0, Math.round((executed / base) * 100)));
}

type YearlyAllocationEntry = { key: string; label: string; rate: number; amount: number };

// 이 막대는 "그해 예산현액(편성액+이월액) 대비 얼마나 집행했는가"를 보여준다. 실제 집행액은
// 진행 중인 2026년에만 있고, 아직 시작하지 않은 2027년·2028년 이후는 집행액이 0이라
// 예산현액이 얼마든 0%로 나온다 — 이는 데이터 오류가 아니라 아직 집행할 수 없기 때문이다.
function buildYearlyExecution(project: Project): YearlyAllocationEntry[] {
  const entries: { key: string; label: string; executed: number; budget: number }[] = [
    { key: "2026", label: "2026년", executed: project.card_execution_amount_million_krw ?? 0, budget: currentBudget(project) },
    { key: "2027", label: "2027년", executed: 0, budget: pb(project).budget2027 },
    { key: "2028+", label: "2028년 이후", executed: 0, budget: pb(project).budget2028Plus },
  ];

  return entries.map(({ key, label, executed, budget }) => ({
    key,
    label,
    amount: executed,
    rate: budget > 0 ? Math.min(100, Math.max(0, Math.round((executed / budget) * 100))) : 0,
  }));
}

function FundingBreakdownCard({ rows, note, yearlyAllocation, projectId }: { rows: BreakdownRow[]; note?: string; yearlyAllocation: YearlyAllocationEntry[]; projectId: string }) {
  const columns: { key: keyof BreakdownRow; label: string }[] = [
    { key: "total", label: "재원별 총예산" },
    { key: "invested", label: "기투자" },
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "이후" },
  ];
  return <div className="pd-budget-panel"><div className="pd-budget-panel-heading"><DetailSectionHeading icon={SafeIcon} tone="budget" title="재원별 예산" /><span className="pd-budget-panel-caption">(단위:백만원)</span></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-funding-table-wrap"><table className="pd-funding-table"><thead><tr><th>구분</th>{columns.map((column) => <th key={String(column.key)}>{column.label}</th>)}</tr></thead><tbody><tr className="is-total"><th>총사업비</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(sumBreakdown(rows, column.key))}</td>)}</tr>{rows.map((row) => <tr key={row.name}><th>{displayFundingSourceName(row.name)}</th>{columns.map((column) => <td key={String(column.key)}>{formatMillion(row[column.key] as number | null | undefined)}</td>)}</tr>)}</tbody></table></div>}{note && <p className="pd-note-box mt-3 !text-[12px]">{note}</p>}<div className="pd-budget-panel-heading pd-exec-rate-heading"><DetailSectionHeading icon={CardSendIcon} tone="budget" title="연도별 집행 현황" /></div><div className="pd-yearly-exec">{yearlyAllocation.map(({ key, label, rate }) => <div className="pd-yearly-exec-col" key={`${projectId}-${key}`}><span className="pd-yearly-exec-value">{rate}%</span><div className="pd-yearly-exec-bar"><div className={`pd-yearly-exec-bar-fill ${key === "2026" ? "is-current" : "is-future"}`} style={{ height: `${rate}%` }} /></div><span className="pd-yearly-exec-label">{label}</span></div>)}</div></div>;
}

const usageColors = ["#5b7fbd", "#58c7b1", "#e8b84a", "#c9915a", "#8a8378"];
const usageColorNames = ["공사", "감리", "설계", "부대", "기타"];

// 요약 줄에 "[공사비 850백만원 · 설계비 200백만원]"처럼 항목별 금액을 같이 적어준다.
// 막대만 보면 각 항목이 얼마인지 눈으로 읽어야 해서, 금액을 글로도 남긴다.
const USAGE_COST_LABEL: Record<string, string> = { "설계": "설계비", "공사": "공사비", "감리": "감리비", "부대": "부대비" };
function usageCostLabel(name: string) {
  return USAGE_COST_LABEL[name] ?? displayBreakdownName(name);
}

function UsageBreakdownChart({ rows, note, yearlyTotals }: { rows: BreakdownRow[]; note?: string; yearlyTotals: { invested: number; budget2026: number; budget2027: number; budget2028Plus: number } }) {
  const years: { key: BudgetYearKey; label: string }[] = [
    { key: "budget_2026", label: "2026년" },
    { key: "budget_2027", label: "2027년" },
    { key: "budget_2028_plus", label: "2028년 이후" },
  ];
  // 성질별 예산은 2027년 편성을 기준으로 본다(예전 기본값이 2026년이라 화면을 열면 늘 지난해
  // 숫자가 먼저 보였다). 다만 2027년 편성 계획이 없는 사업은 빈 화면이 먼저 뜨므로
  // 그때는 2026년을 기본으로 둔다.
  const defaultYear: BudgetYearKey = sumBreakdown(rows, "budget_2027") > 0 ? "budget_2027" : "budget_2026";
  const [selectedYear, setSelectedYear] = useState<BudgetYearKey>(defaultYear);
  const selectedLabel = years.find((year) => year.key === selectedYear)?.label ?? "2026년";
  const selectedTotal = sumBreakdown(rows, selectedYear);
  const usageTotal = sumBreakdown(rows, "total");
  const selectedShare = usageTotal > 0 ? (selectedTotal / usageTotal) * 100 : 0;
  // 성질별(공사/감리/설계/부대/기타) 세부 항목 합계는 반올림·누락으로 공식 총액과
  // 어긋날 수 있어, 흐름 그래프는 상단 카드·재원별 예산과 같은 공식 총액을 그대로 쓴다.
  const flowValues = [yearlyTotals.invested, yearlyTotals.budget2026, yearlyTotals.budget2027, yearlyTotals.budget2028Plus];
  const maxFlowValue = Math.max(...flowValues, 1);
  const flowX = (index: number) => 20 + index * (280 / (flowValues.length - 1));
  const flowY = (value: number) => 46 - (value / maxFlowValue) * 30;
  const points = flowValues.map((value, index) => `${flowX(index)},${flowY(value)}`).join(" ");
  const usageRows = rows.map((row) => ({ row, value: (row[selectedYear] as number | null | undefined) ?? 0 })).sort((a, b) => b.value - a.value);
  const usageColorFor = (name: string) => usageColors[Math.max(0, usageColorNames.indexOf(name)) % usageColors.length];
  return <div className="pd-budget-panel pd-usage-panel"><div className="pd-budget-panel-heading"><DetailSectionHeading icon={LayersIcon} tone="budget" title="성질별 예산" /></div>{rows.length === 0 ? <div className="pd-note-box">등록된 세부 예산표가 없습니다.</div> : <div className="pd-pulse-content"><div className="pd-year-switcher" role="tablist" aria-label="예산 연도 선택">{years.map((year) => <button key={year.key} type="button" className={selectedYear === year.key ? "is-active" : ""} onClick={() => setSelectedYear(year.key)}>{year.label}</button>)}</div><div className="pd-pulse-summary"><div><span className="pd-pulse-eyebrow">{selectedLabel} 편성 예산</span><div className="pd-pulse-amount-row"><strong>{formatMillion(selectedTotal || null)}</strong>{usageRows.some(({ value }) => value > 0) && <span className="pd-pulse-detail">[{usageRows.filter(({ value }) => value > 0).map(({ row, value }) => `${usageCostLabel(row.name)} ${formatMillion(value)}`).join(" · ")}]</span>}</div><span className="pd-pulse-positive">전체 사업비의 {selectedShare.toFixed(1)}%</span></div></div><div className="pd-usage-split"><div className="pd-usage-left"><div className="pd-usage-progress-list">{usageRows.map(({ row, value }) => { const share = selectedTotal > 0 ? (value / selectedTotal) * 100 : 0; return <div className="pd-usage-progress-row" key={row.name}><div className="pd-usage-progress-label"><span>{displayBreakdownName(row.name)}</span><b>{formatMillion(value || null)}</b><strong>{share.toFixed(0)}%</strong></div><div className="pd-usage-progress-track"><span style={{ width: `${share}%`, background: usageColorFor(row.name) }} /></div></div>; })}</div><div className="pd-usage-legend pd-usage-legend-top">{usageColorNames.map((name, index) => <span key={name}><i style={{ background: usageColors[index] }} />{name}</span>)}</div></div><div className="pd-pulse-trend pd-usage-right"><div className="pd-pulse-section-label"><span className="pd-pulse-eyebrow">연도별 예산 흐름</span></div><svg viewBox="0 0 320 80" role="img" aria-label="연도별 예산 흐름"><polyline points={points} fill="none" stroke="var(--pd-accent-a)" strokeWidth="0.5" strokeDasharray="0.5 1.5" strokeLinecap="round" strokeLinejoin="round" />{flowValues.map((value, index) => <circle key={`flow-dot-${index}`} cx={flowX(index)} cy={flowY(value)} r="5" fill="var(--pd-accent-a)" />)}{flowValues.map((value, index) => <text key={`flow-num-${index}`} x={flowX(index)} y={flowY(value) - 9} textAnchor="middle" className="pd-pulse-flow-value">{formatMillion(value || null)}</text>)}{["기투자", "2026년", "2027년", "이후"].map((axisLabel, index) => <text key={axisLabel} x={flowX(index)} y="70" textAnchor="middle" className="pd-pulse-axis-label">{axisLabel}</text>)}</svg></div></div>{note && <p className="pd-note-box mt-3 !text-[12px]">{note}</p>}</div>}</div>;
}

function formatMillion(value: number | null | undefined) {
  return value == null ? "-" : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function BudgetPanel({ project }: { project: Project }) {
  // 재원별 표(국비/도비/시비...)와 연도별 집행률은 성질별 예산보다 한 단계 더 실무적인
  // 정보라 기본은 접어둔다 - 위 카드 5개 + 성질별(공사/설계/감리 등) 하나만 먼저 보여주고,
  // 필요한 사람만 "상세보기"로 펼쳐서 본다. 화면 하나에 표·도넛·막대·라인차트가 다 보여서
  // 한눈에 안 읽힌다는 지적을 반영했다.
  const [showFundingDetail, setShowFundingDetail] = useState(false);
  // 상단 카드·연도별 막대·연도별 흐름 그래프가 모두 같은 계산을 쓴다.
  const budgetOf = pb(project);
  const total = budgetOf.total || null;
  const invested = budgetOf.investedThrough2026 || null;
  const budget = project.budget_2026_hide ? null : budgetOf.budget2027 || null;
  const executionAmount = project.card_execution_amount_million_krw;
  const yearlyAllocation = buildYearlyExecution(project);
  const yearlyTotals = {
    invested: budgetOf.invested,
    budget2026: budgetOf.budget2026,
    budget2027: budgetOf.budget2027,
    budget2028Plus: budgetOf.budget2028Plus,
  };
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
      <div className="pd-budget-breakdown-grid">
        <UsageBreakdownChart rows={project.usage_breakdown} note={project.usage_breakdown_note} yearlyTotals={yearlyTotals} />
        <button type="button" className={`pd-budget-detail-toggle${showFundingDetail ? " is-open" : ""}`} onClick={() => setShowFundingDetail((open) => !open)}>
          재원별 예산·연도별 집행 현황 상세보기 <ChevronDown size={14} />
        </button>
        {showFundingDetail && <FundingBreakdownCard rows={project.funding_breakdown} yearlyAllocation={yearlyAllocation} projectId={project.id} />}
      </div>
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
              <div className="pd-progress-horizontal-track" style={{ ["--pd-progress-cols" as string]: Math.min(group.items.length, 7) } as CSSProperties}>{group.items.map((item, index) => <div key={index} className={`pd-progress-horizontal-item ${index === 0 ? "is-active" : ""}`}><div className="pd-progress-node">{String(index + 1).padStart(2, "0")}</div><div className="pd-progress-copy"><div className="pd-progress-date">{item.date || "-"}</div><div className="pd-progress-desc">{highlightMilestones(item.desc)}</div></div></div>)}</div>
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
                <p className="pd-progress-notes-empty">작성된 메모가 없습니다. "사업 정보 편집"에서 작성할 수 있습니다.</p>
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
  const checks = [
    ["중기재정", status.mid_term_fiscal, status.mid_term_fiscal_date],
    ["투·융자심사", status.investment_review, status.investment_review_date],
    ["공유재산", status.public_property, status.public_property_date],
    ["해당없음", status.none, undefined],
  ] as const;
  return <div className="pd-card pd-admin-card"><div className="pd-card-title"><DetailSectionHeading icon={ShieldCheckIcon} tone="budget" title="사전절차 이행여부" /></div>{project.management_card_matched ? <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{checks.map(([label, checked, date]) => <div key={label} className={`rounded-xl border px-4 py-4 ${checked ? "border-white/25 bg-white/[0.06]" : "border-[var(--pd-border)] bg-white/[0.02]"}`}><span className={`text-[15px] font-medium ${checked ? "text-[var(--pd-text)]" : "text-[var(--pd-text-muted)]"}`}>{checked ? "■" : "□"} {label}</span>{checked && date && <span className="pd-admin-check-date">{formatDateText(date)}</span>}</div>)}</div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="pd-kv"><span className="pd-kv-label">선택된 절차</span><span className="pd-kv-value">{project.card_admin_procedures || "-"}</span></div><div className="pd-kv"><span className="pd-kv-label">법적근거</span><span className="pd-kv-value">{project.card_admin_legal_basis || "-"}</span></div></div></> : <div className="pd-note-box">해당 사업의 사업별 관리카드가 검색되지 않았습니다.</div>}</div>;
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
  const imagesTitle = project.rendering_images_title || "조감도";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  if (renderings.length === 0) return null;

  return (
    <div className="pd-card">
      <div className="pd-card-title"><DetailSectionHeading icon={GalleryIcon} title={imagesTitle} /></div>
      <div className="pd-rendering-grid" data-count={Math.min(renderings.length, 4)}>
        {renderings.map((src, index) => (
          <button type="button" key={src} className="pd-rendering-thumb" onClick={() => setLightboxIndex(index)} aria-label={`${project.project_name} ${imagesTitle} ${index + 1} 확대 보기`}>
            <img src={src} alt={`${project.project_name} ${imagesTitle} ${index + 1}`} />
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

const TABS = ["사업개요·추진현황", "예산현황", "위치도"] as const;

function ProjectDetail({ project, lock, searchValue, onSearchChange, searchProjects, onSelectProject, isAdmin, onProjectUpdated }: { project: Project; lock?: { isUnlocked: boolean; onLock: () => void; onRequestUnlock: () => void }; searchValue: string; onSearchChange: (value: string) => void; searchProjects: Project[]; onSelectProject: (project: Project) => void; isAdmin?: boolean; onProjectUpdated?: (projectId: string, patch: Partial<Project>) => void }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("사업개요·추진현황");
  const [selectedSubIndex, setSelectedSubIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Project>>({});
  const saveProjectContent = trpc.projectContent.save.useMutation();
  const projectContentUtils = trpc.useUtils();
  useEffect(() => { setEditDraft({}); setIsEditing(false); }, [project.id]);
  const beginEdit = () => {
    setEditDraft({
      progress_notes: project.progress_notes, usage_breakdown_note: project.usage_breakdown_note ?? "",
    });
    setIsEditing(true);
  };
  const updateDraft = (key: keyof Project, value: string | number | null) => setEditDraft((draft) => ({ ...draft, [key]: value }));
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
          {project.tf_badge && <span className="pd-tf-badge">TF</span>}
          {(() => {
            // 축구전용경기장 건립(동탄여울공원)은 다른 사업과 달리 괄호를 줄바꿈 없이
            // 제목 옆에 그대로 붙여서 보여달라는 요청이 있어 자동 줄바꿈 대상에서 제외한다.
            if (project.project_name === "축구전용경기장 건립(동탄여울공원)") return project.project_name;
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
              <label className="pd-editor-wide"><span>진행사항 메모</span><textarea rows={3} value={String(editDraft.progress_notes ?? "")} onChange={(event) => updateDraft("progress_notes", event.target.value)} /></label>
              <label className="pd-editor-wide"><span>성질별 예산 안내문구</span><textarea rows={2} value={String(editDraft.usage_breakdown_note ?? "")} onChange={(event) => updateDraft("usage_breakdown_note", event.target.value)} /></label>
            </div>
            {saveProjectContent.isError && <p className="pd-editor-error">저장하지 못했습니다. 서버 연결을 확인해 주세요.</p>}
          </section>
        )}

        {hasSubProjects && (() => {
          const subCount = project.sub_projects!.length;
          const subLabels = project.sub_projects!.map((sub) => project.project_name === "서해안 관광벨트 주차장 및 도로 조성" && sub.name.startsWith("송교리 주차장") ? "송교리 주차장" : sub.name);
          const maxLabelLen = Math.max(...subLabels.map((label) => label.length));
          const subButtonWidth = Math.max(100, maxLabelLen * 15 + 52);
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
            {pb(activeProject).total ? pb(activeProject).total.toLocaleString("ko-KR") : "-"}
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
          <span className="pd-summary-formula">집행액 / 예산현액(편성액+이월액)</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Gauge key={`${project.id}-${selectedSubIndex}-exec`} percent={executionRate(activeProject)} />
            <span className="pd-summary-value grad">{executionRate(activeProject)}<small style={{ fontSize: 16, fontWeight: 700, color: "var(--pd-text-muted)" }}>%</small></span>
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
          const hasLocationMap = !!activeProject.location_map;
          const hasSpotMap = !!activeProject.overview_map;
          const hasRenderings = (activeProject.rendering_images?.length ?? 0) > 0;
          return (
            <div className="pd-detail-attached-group">
              {hasLocationMap && (
                <div className={`pd-stacked-panel${hasSpotMap || hasRenderings ? "" : " pd-attached-last"}`}>
                  <div className="pd-card">
                    <div className="pd-card-title"><DetailSectionHeading icon={GalleryIcon} title="위치도" /></div>
                    <ProjectLocationMap data={activeProject.location_map!} projectName={activeProject.project_name} />
                  </div>
                </div>
              )}
              {/* SpotMapCard는 원래 OverviewPanel의 pd-card 안에 얹혀 있던 하위 섹션이라 그 자체엔
                  pd-card 배경이 없다 - 여기서는 독립 카드로 보여야 하니 pd-card로 감싼다. */}
              {hasSpotMap && (
                <div className={`pd-stacked-panel${hasRenderings ? "" : " pd-attached-last"}`}>
                  <div className="pd-card"><SpotMapCard map={activeProject.overview_map!} projectName={activeProject.project_name} /></div>
                </div>
              )}
              {hasRenderings && <div className="pd-stacked-panel pd-attached-last"><LocationPanel project={activeProject} /></div>}
              {!hasLocationMap && !hasSpotMap && !hasRenderings && <div className="pd-note-box">등록된 위치도·조감도가 없습니다.</div>}
            </div>
          );
        })()}
      </div>
      {overviewPairs.length === 0 && activeTab === "사업개요·추진현황" && null}
    </section>
  );
}


function futureBudgetFor(project: Project) {
  const budget = pb(project);
  const planned = budget.budget2027 + budget.budget2028Plus;
  if (planned > 0) return planned;
  return Math.max(budget.total - budget.investedThrough2026, 0);
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
  const futurePlanBudgetFor = (project: Project) => pb(project).budget2028Plus;
  const departmentProjects = projects
    .filter((project) => project.department === initialDepartment)
    // 계속사업을 먼저, 신규사업을 뒤에 보여준다 - 같은 구분 안에서는 기존 serial 순서를 유지한다.
    .sort((a, b) => {
      const rank = (project: Project) => (project.region === "신규" ? 1 : 0);
      const diff = rank(a) - rank(b);
      return diff !== 0 ? diff : a.serial - b.serial;
    });
  const stageOptions = Array.from(new Set(departmentProjects.map((project) => project.current_stage).filter(Boolean))) as string[];
  const totalCost = departmentProjects.reduce((sum, project) => sum + pb(project).total, 0);
  const investedAmount = departmentProjects.reduce((sum, project) => sum + pb(project).investedThrough2026, 0);
  const budget2027 = departmentProjects.reduce((sum, project) => sum + pb(project).budget2027, 0);
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
    .filter((project) => inRange(pb(project).total, totalCostMin, totalCostMax))
    .filter((project) => inRange(pb(project).budget2027, budget2027Min, budget2027Max))
    .filter((project) => {
      const value = budgetValueFor(project);
      const min = minBudget === "" ? 0 : Number(minBudget);
      const max = maxBudget === "" ? Number.POSITIVE_INFINITY : Number(maxBudget);
      return value >= min && value <= max;
    })
    .sort((a, b) => {
      if (!sortColumn) return 0;
      const key = sortColumn === "total_cost" ? "total" : "budget2027";
      const diff = pb(a)[key] - pb(b)[key];
      return sortDir === "asc" ? diff : -diff;
    });
  const filteredTotalCost = filteredProjects.reduce((sum, project) => sum + pb(project).total, 0);
  const filteredInvested = filteredProjects.reduce((sum, project) => sum + pb(project).investedThrough2026, 0);
  const filteredBudget2027 = filteredProjects.reduce((sum, project) => sum + pb(project).budget2027, 0);
  const filteredFuturePlan = filteredProjects.reduce((sum, project) => sum + futurePlanBudgetFor(project), 0);

  const exportBudgetCsv = () => {
    const headers = ["사업명", "추진단계", "총사업비", "기투자액", "2027년 편성예정액", "향후 계획예산액", "향후 필요예산", "진행률"];
    const rows = filteredProjects.map((project) => [
      project.project_name,
      project.current_stage || "미등록",
      pb(project).total,
      pb(project).investedThrough2026,
      pb(project).budget2027,
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
              <td><span className={`dept-project-type ${project.region === "신규" ? "is-new" : "is-continuing"}`}>{project.region === "신규" || project.region === "계속" ? project.region : "-"}</span></td><td><strong>{formatProjectNameLines(project.project_name)}</strong></td><td><span className="dept-stage-chip">{project.current_stage || "미등록"}</span></td><td className="dept-amount-cell">{formatBudgetNumber(pb(project).total)}</td><td className="dept-amount-cell">{formatBudgetNumber(pb(project).investedThrough2026)}</td><td className="dept-amount-cell">{formatBudgetNumber(pb(project).budget2027)}</td><td className="dept-amount-cell">{formatBudgetNumber(futurePlanBudgetFor(project))}</td><td><div className="dept-progress"><b>{parseProgress(project)}%</b><span><em style={{ width: `${parseProgress(project)}%` }} /></span></div></td>
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
  onOpenInvestmentReview,
  onSelectDepartment,
  onSelectProject,
  activeDepartmentName,
  activeProjectDepartmentName,
  isInvestmentReviewActive,
  includeMapView = true,
}: {
  organization: Bureau[];
  onGoHome: () => void;
  onOpenMap: () => void;
  onOpenInvestmentReview: () => void;
  onSelectDepartment: (departmentName: string) => void;
  onSelectProject: (project: Project) => void;
  activeDepartmentName: string | null;
  activeProjectDepartmentName: string | null;
  isInvestmentReviewActive?: boolean;
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
          <div className="floating-nav-dept-item">
            <button
              type="button"
              className={`floating-nav-investment-review${isInvestmentReviewActive ? " is-selected" : ""}`}
              onClick={() => { onOpenInvestmentReview(); setOpenDeptName(null); setShowProjects(false); }}
            >
              {isInvestmentReviewActive && <i className="floating-nav-dot" />}
              투자심사
            </button>
          </div>
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
  const totalBudget = projects.reduce((sum, project) => sum + pb(project).total, 0);
  const investedTo2026 = projects.reduce((sum, project) => sum + pb(project).investedThrough2026, 0);
  const budgetRequest2027 = projects.reduce((sum, project) => sum + pb(project).budget2027, 0);
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
  // 로그인 없이 누구나 편집할 수 있도록 관리자 게이트를 없앴다 - isAdmin은 항상 true.
  const isAdmin = true;
  // 부서별 현황 표(DepartmentDashboard)와 동일하게 overrides가 반영된 순서로 상단 메뉴
  // 드롭다운을 채운다 — 검색어 필터는 적용하지 않는다(드롭다운은 검색과 무관하게 항상 전체 목록).
  const liveOrganization = useMemo(() => {
    const org = buildOrganization(liveProjects);
    // DepartmentDashboard(부서별 현황)와 똑같이 계속사업을 먼저, 신규사업을 뒤에 두고
    // 같은 구분 안에서는 serial 순서를 유지한다 - 안 맞추면 드롭다운과 표의 사업 순서가 어긋난다.
    org.forEach((bureau) =>
      bureau.departments.forEach((department) =>
        department.projects.sort((a, b) => {
          const rank = (project: Project) => (project.region === "신규" ? 1 : 0);
          const diff = rank(a) - rank(b);
          return diff !== 0 ? diff : a.serial - b.serial;
        }),
      ),
    );
    return org;
  }, [liveProjects]);

  const [query, setQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedDepartmentDashboard, setSelectedDepartmentDashboard] = useState("전체");
  const [activeView, setActiveView] = useState<"landing" | "project" | "department" | "investment-review">("landing");

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
  const goInvestmentReview = () => {
    setSelectedProject(null);
    setActiveView("investment-review");
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
            onOpenMap={goLanding}
            onOpenInvestmentReview={goInvestmentReview}
            onSelectDepartment={goDepartment}
            onSelectProject={goProject}
            activeDepartmentName={activeView === "department" ? selectedDepartmentDashboard : null}
            activeProjectDepartmentName={activeView === "project" ? selectedProject?.department ?? null : null}
            isInvestmentReviewActive={activeView === "investment-review"}
            includeMapView={false}
          />
        </div>
        {/* 로그인 없이 누구나 편집 가능해서 이 슬롯엔 더 이상 로그인 버튼이 없다 - 사업상세
            화면의 "사업 정보 편집" 버튼이 포털로 얹히는 자리로만 남겨둔다. */}
        <div id="pd-admin-login-slot" className="pd-admin-login-slot" />
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
          {activeView === "investment-review" ? (
            <InvestmentReviewBoard isAdmin={isAdmin} />
          ) : activeView === "department" ? (
            <DepartmentDashboard key={selectedDepartmentDashboard} projects={liveProjects} initialDepartment={selectedDepartmentDashboard} isAdmin={isAdmin} onSelectProject={(project) => { setSelectedProject(project); setActiveView("project"); }} />
          ) : activeView === "project" && selectedProject ? (
            <div className="detail-panel-shell">
              <ProjectDetail project={selectedProject} isAdmin={isAdmin} onProjectUpdated={(projectId, patch) => setSelectedProject((current) => current?.id === projectId ? { ...current, ...patch } : current)} searchValue={query} onSearchChange={setQuery} searchProjects={liveProjects} onSelectProject={goProject} />
            </div>
          ) : (
            <LandingPage />
          )}
      </main>
    </div>
  );
}





