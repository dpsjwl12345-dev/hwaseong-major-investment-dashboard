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

export type PlanYearKey = "budget_2026" | "budget_2027" | "budget_2028_plus";

// 예산서 모양(과목×연도) 표를 연도별 한 줄로 바꿔 보여준다: 그해 금액, 추진 단계, 과목별로 무엇에 얼마인지.
// 금액은 예산서 원래 단위(천원)와 표기를 그대로 쓴다. 빈 과목 칸(병합)은 위 행 값을 이어받는다.
const parseAmount = (value: string | undefined) => (value && value !== "-" ? Number(value.replace(/,/g, "")) : 0);

function MatrixYearTable({ section, selectedYear }: { section: MatrixSection; selectedYear?: PlanYearKey }) {
  const totalRow = section.rows.find((row) => row.kind === "total");
  const items: { group: string; name: string; total: string; values: string[]; flags: number[]; extra: string[] }[] = [];
  let group = "";
  let middle = "";
  section.rows.forEach((row) => {
    if (row.kind === "total") return;
    if (row.l1) group = row.l1;
    if (row.l2) middle = row.l2;
    items.push({ group, name: row.l3 || row.l2 || middle, total: row.total, values: row.values, flags: row.highlight ?? [], extra: row.extra ?? [] });
  });
  const groups = Array.from(new Set(items.map((item) => item.group)));
  const groupTotals = groups
    .map((name) => ({ name, value: items.filter((item) => item.group === name).reduce((sum, item) => sum + parseAmount(item.total), 0) }))
    .filter((entry) => entry.value > 0);
  const extraNotes = section.extraColumns
    .map((column, columnIndex) => ({ column, entries: items.filter((item) => item.extra[columnIndex]).map((item) => `${item.name} ${item.extra[columnIndex]}`) }))
    .filter((note) => note.entries.length > 0);
  return (
    <>
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: {section.unit}]</span>
      </div>
      <table className="pl-table">
        <colgroup>
          <col style={{ width: 88 }} />
          <col style={{ width: 150 }} />
          <col style={{ width: 120 }} />
          <col />
        </colgroup>
        <thead>
          <tr><th>연도</th><th>추진 단계</th><th className="pl-num">금액</th><th>과목별 내역</th></tr>
        </thead>
        <tbody>
          <tr className="pl-sum">
            <td>합계</td>
            <td />
            <td className="pl-num">{totalRow?.total ?? "-"}</td>
            <td>
              <span className="pl-items">
                {groupTotals.map((entry) => <span key={entry.name} className="pl-item">{entry.name} <b>{entry.value.toLocaleString("ko-KR")}</b></span>)}
              </span>
            </td>
          </tr>
          {section.years.map((year, yearIndex) => {
            const amount = parseAmount(totalRow?.values[yearIndex]);
            const byGroup = groups
              .map((name) => ({ name, entries: items.filter((item) => item.group === name && parseAmount(item.values[yearIndex]) > 0) }))
              .filter((entry) => entry.entries.length > 0);
            return (
              <tr key={year} className={yearBucket(year) === selectedYear ? "is-selected" : undefined}>
                <td className="pl-year">{year}</td>
                <td className="pl-stage-name">{section.stages[yearIndex]?.replace(/\n/g, " ")}</td>
                <td className="pl-num">{amount > 0 ? totalRow?.values[yearIndex] : "-"}</td>
                <td>
                  {byGroup.length === 0 ? (
                    <span className="pl-empty">편성 없음</span>
                  ) : (
                    byGroup.map((entry) => (
                      <div key={entry.name} className="pl-stage">
                        <span className="pl-tag">{entry.name}</span>
                        <span className="pl-items">
                          {entry.entries.map((item) => (
                            <span key={item.name} className={`pl-item${item.flags.includes(yearIndex) ? " is-flag" : ""}`}>{item.name} <b>{item.values[yearIndex]}</b></span>
                          ))}
                        </span>
                      </div>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {extraNotes.length > 0 && <p className="pl-notes">※ {extraNotes.map((note) => `${note.column}: ${note.entries.join(", ")}`).join(" · ")}</p>}
    </>
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
  // 2026년 탭은 그해만(그 전 연도는 기투자). "~2026년"처럼 누적 칸은 2026년으로 본다.
  if (year < 2026) return null;
  return year === 2026 ? "budget_2026" : year === 2027 ? "budget_2027" : "budget_2028_plus";
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

export function BudgetDetailPanel({ projectId, selectedYear }: { projectId: string; selectedYear?: PlanYearKey }) {
  const detail = detailByProject[projectId];
  if (!detail) return null;
  return (
    <div className="pd-detail-attached-group">
      {detail.sections.map((section, index) => (
        <div key={section.title} className={`pd-stacked-panel${index === detail.sections.length - 1 ? " pd-attached-last" : ""}`}>
          {section.kind === "grid" && section.variant !== "plan" ? (
            <GridTable section={section} />
          ) : (
            <div className="pd-card bd-card">
              {section.kind === "grid" ? <PlanTable section={section} selectedYear={selectedYear} /> : <MatrixYearTable section={section} selectedYear={selectedYear} />}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
