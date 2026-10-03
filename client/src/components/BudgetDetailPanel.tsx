import type { ReactNode } from "react";
import budgetDetailData from "../data/budget_detail.json";

type DetailRow = {
  kind?: "total";
  l1?: string;
  l2?: string;
  l3?: string;
  total: string;
  values: string[];
  extra?: string[];
  highlight?: number[];
};

type MatrixSection = {
  kind?: "matrix";
  title: string;
  unit: string;
  years: string[];
  stages: string[];
  extraColumns: string[];
  rows: DetailRow[];
};

// 연도×예산과목 모양이 아닌 표(계산표, 상세내역표 등)를 칸 그대로 옮기는 단순 표.
type GridSection = {
  kind: "grid";
  title: string;
  unit?: string;
  columns: string[];
  widths: number[];
  align: ("left" | "center" | "right")[];
  boldRows?: number[];
  // 개월·비율처럼 금액이 아닌 보조 행
  metaRows?: number[];
  // 표에서 기준이 되는 금액 열(예: 총사업비) 하나를 강조
  accentColumn?: number;
  // 열이 많은 표를 가로 스크롤 없이 한 줄에 맞추기 위해 글씨·여백을 줄인다
  compact?: boolean;
  // "plan": 비목×연도 표를 연도별 한 줄(그해 단계·비목·금액)로 바꿔 보여준다. 데이터는 원본 그대로 둔다.
  variant?: "plan";
  rows: string[][];
};

type DetailSection = MatrixSection | GridSection;

const detailByProject = budgetDetailData as unknown as Record<string, { sections: DetailSection[] }>;

export function hasBudgetDetail(projectId: string) {
  return projectId in detailByProject;
}

export function hasBudgetPlan(projectId: string) {
  return !!detailByProject[projectId]?.sections.some((section) => section.kind === "grid" && section.variant === "plan");
}

export type PlanYearKey = "budget_2026" | "budget_2027" | "budget_2028_plus";

// 빈 칸은 위 행과 병합된 칸이다. l1/l2는 아래로 이어지는 행 수만큼 rowSpan을 준다.
function rowSpanFor(rows: DetailRow[], index: number, key: "l1" | "l2") {
  const isContinuation = (row: DetailRow) => (key === "l1" ? !row.l1 : !row.l2 && !!row.l3);
  let span = 1;
  for (let next = index + 1; next < rows.length; next++) {
    if (rows[next].kind === "total" || !isContinuation(rows[next])) break;
    span++;
  }
  return span;
}

function Cell({ value, highlighted, stickyLeft }: { value: string; highlighted?: boolean; stickyLeft?: number }) {
  const sticky = stickyLeft != null;
  return <td className={`bd-num${value === "-" ? " is-dash" : ""}${highlighted ? " is-highlight" : ""}${sticky ? " bd-sticky bd-sticky-edge" : ""}`} style={sticky ? { left: stickyLeft } : undefined}>{value}</td>;
}

// 연도 칸은 모두 같은 너비, 비고·불용은 좁게. 표 전체 너비는 칸 너비의 합으로 고정한다.
const LABEL_COLUMN_WIDTHS = [96, 110, 170];
const TOTAL_COLUMN_WIDTH = 124;
const YEAR_COLUMN_WIDTH = 120;
// 연도가 많아 옆으로 넘기는 표에서 과목·구분·계 칸은 왼쪽에 고정해, 어느 연도를 보든 행 이름이 보이게 한다.
const STICKY_LEFT = [0, LABEL_COLUMN_WIDTHS[0], LABEL_COLUMN_WIDTHS[0] + LABEL_COLUMN_WIDTHS[1], LABEL_COLUMN_WIDTHS[0] + LABEL_COLUMN_WIDTHS[1] + LABEL_COLUMN_WIDTHS[2]];
const stick = (index: number) => ({ style: { left: STICKY_LEFT[index] } });
const EXTRA_COLUMN_WIDTHS: Record<string, number> = { 비고: 64, 불용: 76 };

function SectionTable({ section }: { section: MatrixSection }) {
  const extraWidths = section.extraColumns.map((name) => EXTRA_COLUMN_WIDTHS[name] ?? 64);
  const tableWidth =
    LABEL_COLUMN_WIDTHS.reduce((sum, width) => sum + width, 0) +
    TOTAL_COLUMN_WIDTH +
    YEAR_COLUMN_WIDTH * section.years.length +
    extraWidths.reduce((sum, width) => sum + width, 0);
  return (
    <div className="pd-card bd-card">
      {/* 제목줄을 표 너비로 맞춰 단위가 표 오른쪽 끝에 붙게 한다 */}
      <div className="pd-card-title" style={{ maxWidth: tableWidth }}>
        <span>{section.title}</span>
        <span className="bd-unit">[단위: {section.unit}]</span>
      </div>
      <div className="bd-scroll">
        <table className="bd-table" style={{ width: tableWidth }}>
          <colgroup>
            {LABEL_COLUMN_WIDTHS.map((width, index) => <col key={`label-${index}`} style={{ width: width }} />)}
            <col style={{ width: TOTAL_COLUMN_WIDTH }} />
            {section.years.map((year) => <col key={year} style={{ width: YEAR_COLUMN_WIDTH }} />)}
            {extraWidths.map((width, index) => <col key={`extra-${index}`} style={{ width: width }} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="bd-sticky" {...stick(0)}>예산과목</th>
              <th colSpan={2} className="bd-sticky" {...stick(1)}>구 분</th>
              <th className="bd-sticky bd-sticky-edge" {...stick(3)}>계</th>
              {section.years.map((year) => <th key={year}>{year}</th>)}
              {section.extraColumns.map((name) => <th key={name} className={name === "불용" ? "is-unused" : undefined}>{name}</th>)}
            </tr>
            <tr className="bd-stage-row">
              <th className="bd-sticky" {...stick(0)}>통계목</th>
              <th colSpan={2} className="bd-sticky" {...stick(1)}>연차별 계획공정</th>
              <th className="bd-sticky bd-sticky-edge" {...stick(3)} />
              {section.stages.map((stage, index) => <th key={index}>{stage}</th>)}
              {section.extraColumns.map((name) => <th key={name} />)}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, index) => {
              const isTotal = row.kind === "total";
              const l1Span = !isTotal && row.l1 ? rowSpanFor(section.rows, index, "l1") : 0;
              const l2Span = !isTotal && row.l2 && row.l3 ? rowSpanFor(section.rows, index, "l2") : 0;
              return (
                <tr key={index} className={isTotal ? "bd-total-row" : undefined}>
                  {isTotal ? (
                    <td colSpan={3} className="bd-label bd-sticky" {...stick(0)}>계</td>
                  ) : (
                    <>
                      {l1Span > 0 && <td rowSpan={l1Span} className="bd-label is-l1 bd-sticky" {...stick(0)}>{row.l1}</td>}
                      {row.l3 ? (
                        <>
                          {row.l2 && <td rowSpan={l2Span} className="bd-label bd-sticky" {...stick(1)}>{row.l2}</td>}
                          <td className="bd-label bd-sticky" {...stick(2)}>{row.l3}</td>
                        </>
                      ) : (
                        <td colSpan={2} className="bd-label bd-sticky" {...stick(1)}>{row.l2}</td>
                      )}
                    </>
                  )}
                  <Cell value={row.total} stickyLeft={STICKY_LEFT[3]} />
                  {row.values.map((value, valueIndex) => <Cell key={valueIndex} value={value} highlighted={row.highlight?.includes(valueIndex)} />)}
                  {section.extraColumns.map((name, extraIndex) => (
                    <td key={name} className={`bd-num${name === "불용" ? " is-unused" : ""}`}>{row.extra?.[extraIndex] ?? ""}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GridTable({ section }: { section: GridSection }) {
  const tableWidth = section.widths.reduce((sum, width) => sum + width, 0);
  return (
    <div className="pd-card bd-card">
      <div className="pd-card-title" style={{ maxWidth: tableWidth }}>
        <span>{section.title}</span>
        {section.unit && <span className="bd-unit">[단위: {section.unit}]</span>}
      </div>
      <div className="bd-scroll">
        <table className={`bd-table bd-grid${section.compact ? " bd-compact" : ""}`} style={{ width: tableWidth }}>
          <colgroup>
            {section.widths.map((width, index) => <col key={index} style={{ width: width }} />)}
          </colgroup>
          <thead>
            <tr>
              {section.columns.map((column, index) => (
                <th key={index} className={`bd-align-${section.align[index]}${index === section.accentColumn ? " is-accent" : ""}`}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((row, rowIndex) => {
              const rowClass = section.boldRows?.includes(rowIndex) ? "bd-total-row" : section.metaRows?.includes(rowIndex) ? "bd-meta-row" : undefined;
              return (
                <tr key={rowIndex} className={rowClass}>
                  {row.map((value, columnIndex) => (
                    <td
                      key={columnIndex}
                      className={`bd-align-${section.align[columnIndex]}${columnIndex === 0 ? " bd-label" : ""}${value === "-" ? " is-dash" : ""}${columnIndex === section.accentColumn ? " is-accent" : ""}`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 비목을 사업 단계로 묶는다. 이름은 예산서 원래 이름 그대로 두고 묶음만 붙인다.
const STAGE_ORDER = ["사전절차", "부지·보상", "설계", "공사·감리", "부대·기타", "예비비"];
const STAGE_OF: Record<string, string> = {
  기본계획: "사전절차", 타당성수수료: "사전절차", 도시관리계획: "사전절차", 환경평가: "사전절차", 환경: "사전절차",
  재해: "사전절차", 교통: "사전절차", 실시계획인가: "사전절차", 측량지반조사: "사전절차",
  보상비: "부지·보상", 부지: "부지·보상",
  실시설계비: "설계", VE: "설계", 설계: "설계",
  공사비: "공사·감리", 건설사업관리: "공사·감리", 공사: "공사·감리", 감리: "공사·감리",
  부대: "부대·기타", 기타: "부대·기타",
  예비비: "예비비",
};
const stageOf = (name: string) => STAGE_OF[name] ?? "부대·기타";

// 원본은 천원. 위 카드와 같은 백만원으로 보여준다(천원 아래 자리는 소수 한 자리로 살린다).
const toMillion = (value: string) => (value ? Number(value.replace(/,/g, "")) / 1000 : 0);
const fmtMillion = (value: number) => value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });

function yearBucket(label: string): PlanYearKey | null {
  const match = label.match(/(\d{4})/);
  if (!match) return null;
  const year = Number(match[1]);
  return year <= 2026 ? "budget_2026" : year === 2027 ? "budget_2027" : "budget_2028_plus";
}

function PlanTable({ section, selectedYear }: { section: GridSection; selectedYear?: PlanYearKey }) {
  const noteIndex = section.columns.indexOf("비고");
  const yearIndexes = section.columns.map((_, index) => index).filter((index) => index >= 2 && index !== noteIndex);
  const totalRow = section.rows[0];
  const itemRows = section.rows.slice(1);
  const items = itemRows.map((row) => ({ name: row[0], stage: stageOf(row[0]), total: toMillion(row[1]), note: noteIndex >= 0 ? row[noteIndex] : "" }));
  const stageTotals = STAGE_ORDER.map((stage) => ({ stage, value: items.filter((item) => item.stage === stage).reduce((sum, item) => sum + item.total, 0) })).filter((entry) => entry.value > 0);
  const years = yearIndexes.map((columnIndex) => {
    const entries = itemRows.map((row) => ({ name: row[0], stage: stageOf(row[0]), value: toMillion(row[columnIndex]) })).filter((entry) => entry.value > 0);
    const total = toMillion(totalRow[columnIndex]) || entries.reduce((sum, entry) => sum + entry.value, 0);
    const stages = STAGE_ORDER.map((stage) => ({ stage, entries: entries.filter((entry) => entry.stage === stage) })).filter((group) => group.entries.length > 0);
    return { label: section.columns[columnIndex], bucket: yearBucket(section.columns[columnIndex]), total, stages };
  });
  const notes = items.filter((item) => item.note);
  return (
    <>
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: 백만원]</span>
      </div>
      <table className="pl-table">
        <colgroup>
          <col style={{ width: 96 }} />
          <col style={{ width: 112 }} />
          <col />
        </colgroup>
        <thead>
          <tr><th>연도</th><th className="pl-num">금액</th><th>단계별 내역</th></tr>
        </thead>
        <tbody>
          <tr className="pl-sum">
            <td>합계</td>
            <td className="pl-num">{fmtMillion(toMillion(totalRow[1]))}</td>
            <td>
              <span className="pl-items">
                {stageTotals.map((entry) => <span key={entry.stage} className="pl-item">{entry.stage} <b>{fmtMillion(entry.value)}</b></span>)}
              </span>
            </td>
          </tr>
          {years.map((year) => (
            <tr key={year.label} className={year.bucket && year.bucket === selectedYear ? "is-selected" : undefined}>
              <td className="pl-year">{year.label}</td>
              <td className="pl-num">{year.total > 0 ? fmtMillion(year.total) : "-"}</td>
              <td>
                {year.stages.length === 0 ? (
                  <span className="pl-empty">편성 없음</span>
                ) : (
                  year.stages.map((group) => (
                    <div key={group.stage} className="pl-stage">
                      <span className="pl-tag">{group.stage}</span>
                      <span className="pl-items">
                        {group.entries.map((entry) => <span key={entry.name} className="pl-item">{entry.name !== group.stage && `${entry.name} `}<b>{fmtMillion(entry.value)}</b></span>)}
                      </span>
                    </div>
                  ))
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {notes.length > 0 && <p className="pl-notes">※ {notes.map((item) => `${item.name}: ${item.note}`).join(" · ")}</p>}
    </>
  );
}

function PlanCard({ section, aside, selectedYear }: { section: GridSection; aside?: ReactNode; selectedYear?: PlanYearKey }) {
  return (
    <div className="pd-card bd-card">
      {aside ? (
        <div className="pl-wrap">
          <div className="pl-main"><PlanTable section={section} selectedYear={selectedYear} /></div>
          <div className="pl-side">
            <div className="pd-card-title"><span>연도별 예산 흐름</span><span className="bd-unit">[단위: 백만원]</span></div>
            {aside}
          </div>
        </div>
      ) : (
        <PlanTable section={section} selectedYear={selectedYear} />
      )}
    </div>
  );
}

export function BudgetDetailPanel({ projectId, flowAside, selectedYear }: { projectId: string; flowAside?: ReactNode; selectedYear?: PlanYearKey }) {
  const detail = detailByProject[projectId];
  if (!detail) return null;
  const planIndex = detail.sections.findIndex((section) => section.kind === "grid" && section.variant === "plan");
  return (
    <div className="pd-detail-attached-group">
      {detail.sections.map((section, index) => (
        <div key={section.title} className={`pd-stacked-panel${index === detail.sections.length - 1 ? " pd-attached-last" : ""}`}>
          {section.kind === "grid" && section.variant === "plan" ? (
            <PlanCard section={section} aside={index === planIndex ? flowAside : undefined} selectedYear={selectedYear} />
          ) : section.kind === "grid" ? (
            <GridTable section={section} />
          ) : (
            <SectionTable section={section} />
          )}
        </div>
      ))}
    </div>
  );
}
