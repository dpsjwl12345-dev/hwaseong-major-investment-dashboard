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
  variant?: "plan" | "cost-schedule" | "cost-breakdown";
  rows: string[][];
};

type DetailSection = MatrixSection | GridSection;

const detailByProject = budgetDetailData as unknown as Record<string, { sections: DetailSection[] }>;

export function hasBudgetDetail(projectId: string) {
  return projectId in detailByProject;
}

export type PlanYearKey = "budget_2026" | "budget_2027" | "budget_2028_plus";

// 연도별로 읽는 표의 공통 모양: 행=연도, 열=단계(또는 과목). 칸마다 그 단계의 비목과 금액을 줄로 쌓아
// 카드 폭을 고르게 쓰고, 같은 단계는 위아래로 바로 비교된다.
type StageItem = { name: string; amount: string; flag?: boolean };
type StageRow = { label: string; bucket: PlanYearKey | null; note?: string; amount: string; cells: Record<string, StageItem[]> };

function StageGrid({ title, unit, columns, noteHeader, sum, rows, notes, selectedYear }: {
  title: string;
  unit: string;
  columns: string[];
  noteHeader?: string;
  sum: { amount: string; cells: Record<string, string> };
  rows: StageRow[];
  notes?: string;
  selectedYear?: PlanYearKey;
}) {
  return (
    <>
      <div className="pd-card-title">
        <span>{title}</span>
        <span className="bd-unit">[단위: {unit}]</span>
      </div>
      <table className="sg-table">
        <colgroup>
          <col style={{ width: 96 }} />
          {noteHeader && <col style={{ width: 140 }} />}
          <col style={{ width: 120 }} />
          {columns.map((column) => <col key={column} />)}
        </colgroup>
        <thead>
          <tr>
            <th>연도</th>
            {noteHeader && <th>{noteHeader}</th>}
            <th className="sg-num">금액</th>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr className="sg-sum">
            <td>합계</td>
            {noteHeader && <td />}
            <td className="sg-num">{sum.amount}</td>
            {columns.map((column) => <td key={column} className="sg-num">{sum.cells[column] ?? ""}</td>)}
          </tr>
          {rows.map((row) => (
            <tr key={row.label} className={row.bucket && row.bucket === selectedYear ? "is-selected" : undefined}>
              <td className="sg-year">{row.label}</td>
              {noteHeader && <td className="sg-note">{row.note}</td>}
              <td className="sg-num">{row.amount}</td>
              {columns.map((column) => (
                <td key={column}>
                  {(row.cells[column] ?? []).map((item) => (
                    <div key={item.name} className={`sg-item${item.flag ? " is-flag" : ""}`}>
                      {item.name !== column && <span>{item.name}</span>}
                      <b>{item.amount}</b>
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {notes && <p className="pl-notes">※ {notes}</p>}
    </>
  );
}

// 예산서(과목×연도) 표: 열=과목(시설비·감리비…), 금액은 예산서 원래 단위(천원)·표기 그대로.
// 빈 과목 칸(병합)은 위 행 값을 이어받는다.
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
  const sumCells = Object.fromEntries(groups.map((name) => [name, items.filter((item) => item.group === name).reduce((sum, item) => sum + parseAmount(item.total), 0).toLocaleString("ko-KR")]));
  const rows: StageRow[] = section.years.map((year, yearIndex) => ({
    label: year,
    bucket: yearBucket(year),
    note: section.stages[yearIndex]?.replace(/\n/g, " "),
    amount: parseAmount(totalRow?.values[yearIndex]) > 0 ? totalRow!.values[yearIndex] : "-",
    cells: Object.fromEntries(groups.map((name) => [
      name,
      items.filter((item) => item.group === name && parseAmount(item.values[yearIndex]) > 0).map((item) => ({ name: item.name, amount: item.values[yearIndex], flag: item.flags.includes(yearIndex) })),
    ])),
  }));
  const notes = section.extraColumns
    .map((column, columnIndex) => ({ column, entries: items.filter((item) => item.extra[columnIndex]).map((item) => `${item.name} ${item.extra[columnIndex]}`) }))
    .filter((note) => note.entries.length > 0)
    .map((note) => `${note.column}: ${note.entries.join(", ")}`)
    .join(" · ");
  return <StageGrid title={section.title} unit={section.unit} columns={groups} noteHeader="추진 단계" sum={{ amount: totalRow?.total ?? "-", cells: sumCells }} rows={rows} notes={notes || undefined} selectedYear={selectedYear} />;
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

// 사업비 계획(비목×연도): 열=사업 단계, 원본 천원을 위 카드와 같은 백만원으로.
function PlanTable({ section, selectedYear }: { section: GridSection; selectedYear?: PlanYearKey }) {
  const noteIndex = section.columns.indexOf("비고");
  const yearIndexes = section.columns.map((_, index) => index).filter((index) => index >= 2 && index !== noteIndex);
  const totalRow = section.rows[0];
  const itemRows = section.rows.slice(1);
  const stages = STAGE_ORDER.filter((stage) => itemRows.some((row) => stageOf(row[0]) === stage && toMillion(row[1]) > 0));
  const sumCells = Object.fromEntries(stages.map((stage) => [stage, fmtMillion(itemRows.filter((row) => stageOf(row[0]) === stage).reduce((sum, row) => sum + toMillion(row[1]), 0))]));
  const rows: StageRow[] = yearIndexes.map((columnIndex) => {
    const label = section.columns[columnIndex];
    const total = toMillion(totalRow[columnIndex]) || itemRows.reduce((sum, row) => sum + toMillion(row[columnIndex]), 0);
    return {
      label,
      bucket: yearBucket(label),
      amount: total > 0 ? fmtMillion(total) : "-",
      cells: Object.fromEntries(stages.map((stage) => [
        stage,
        itemRows.filter((row) => stageOf(row[0]) === stage && toMillion(row[columnIndex]) > 0).map((row) => ({ name: row[0], amount: fmtMillion(toMillion(row[columnIndex])) })),
      ])),
    };
  });
  const notes = noteIndex >= 0 ? itemRows.filter((row) => row[noteIndex]).map((row) => `${row[0]}: ${row[noteIndex]}`).join(" · ") : "";
  return <StageGrid title={section.title} unit="백만원" columns={stages} sum={{ amount: fmtMillion(toMillion(totalRow[1])), cells: sumCells }} rows={rows} notes={notes || undefined} selectedYear={selectedYear} />;
}

// 연도별 공사비(산정표): 연도마다 공사기간·비율, 그해 공사비와 그 구성(선금 + 공정 비율분)을 한 칸에.
function CostScheduleView({ section }: { section: GridSection }) {
  const find = (test: (label: string) => boolean) => section.rows.find((row) => test(row[0]));
  const total = find((label) => label === "계");
  const months = find((label) => label.includes("공사기간(개월)"));
  const ratio = find((label) => label.includes("공사기간 비율"));
  const progress = find((label) => label.includes("*비율"));
  const advance = find((label) => label === "선금");
  const share = find((label) => label === "");
  const years = section.columns.slice(1);
  return (
    <>
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: {section.unit}]</span>
      </div>
      <div className="cs-grid" style={{ gridTemplateColumns: `repeat(${years.length}, minmax(0, 1fr))` }}>
        {years.map((year, index) => {
          const column = index + 1;
          const ratioValue = Number(ratio?.[column] || 0);
          return (
            <section key={year} className="cs-year">
              <header>
                <b>{year}</b>
                <span>공사기간 {months?.[column] || "-"}개월 · 비율 {Math.round(ratioValue * 100)}%</span>
              </header>
              <div className="cs-total">
                <strong>{total?.[column] || "-"}</strong>
                {share?.[column] && <span>{share[column]}</span>}
              </div>
              <dl>
                {advance?.[column] && <div><dt>선금</dt><dd>{advance[column]}</dd></div>}
                {progress?.[column] && <div><dt>{progress[0]}</dt><dd>{progress[column]}</dd></div>}
              </dl>
            </section>
          );
        })}
      </div>
      <p className="pl-notes">※ 산정 방식: 연도별 공사비 = 선금 + (총공사비 − 선금) × 연도별 공사기간 비율</p>
    </>
  );
}

// 공사비 상세내역: 위에 그해 공사비가 무엇으로 이뤄졌는지 구성 막대, 아래 공종별 표.
// 비율(%) 열은 앞 금액 칸에, "관급자재 항목"은 관급자재 칸에 붙여 열 수를 줄인다. 공종 계는 그 줄의 합.
const COMPOSITION_COLORS = ["#d95926", "#199e70", "#9085e9", "#c98500", "#d55181", "#008300"];
const toNumber = (value: string | undefined) => (value && value !== "-" ? Number(value.replace(/,/g, "")) || 0 : 0);

function CostBreakdownView({ section }: { section: GridSection }) {
  const fields: { index: number; label: string; ratioIndex?: number; textIndex?: number }[] = [];
  section.columns.forEach((label, index) => {
    if (index === 0) return;
    if (label.startsWith("비율")) { if (fields.length) fields[fields.length - 1].ratioIndex = index; return; }
    if (label.endsWith("항목")) { if (fields.length) fields[fields.length - 1].textIndex = index; return; }
    fields.push({ index, label });
  });
  const [totalRow, ...rest] = section.rows;
  const subtotal = rest[rest.length - 1];
  const bodyRows = rest.slice(0, -1);
  const parts = fields.map((field, order) => ({ ...field, value: toNumber(subtotal[field.index]), color: COMPOSITION_COLORS[order % COMPOSITION_COLORS.length] })).filter((part) => part.value > 0);
  const grand = toNumber(totalRow[1]) || parts.reduce((sum, part) => sum + part.value, 0);
  const rowSum = (row: string[]) => fields.reduce((sum, field) => sum + toNumber(row[field.index]), 0);
  return (
    <>
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: {section.unit}]</span>
      </div>
      <div className="cb-summary">
        <div className="cb-total"><span>{totalRow[0]}</span><strong>{grand.toLocaleString("ko-KR")}</strong></div>
        <div className="cb-bar" role="img" aria-label={parts.map((part) => `${part.label} ${part.value.toLocaleString("ko-KR")}`).join(", ")}>
          {parts.map((part) => <span key={part.label} style={{ flexGrow: part.value, background: part.color }} />)}
        </div>
        <ul className="cb-legend">
          {parts.map((part) => (
            <li key={part.label}>
              <i style={{ background: part.color }} aria-hidden="true" />
              <span>{part.label}</span>
              <b>{part.value.toLocaleString("ko-KR")}</b>
              <em>{((part.value / grand) * 100).toFixed(1)}%</em>
            </li>
          ))}
        </ul>
      </div>
      <table className="sg-table cb-table">
        <thead>
          <tr>
            <th>공종</th>
            {fields.map((field) => <th key={field.index} className="sg-num">{field.label}</th>)}
            <th className="sg-num">공종 계</th>
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row) => (
            <tr key={row[0]}>
              <td className="sg-year">{row[0]}</td>
              {fields.map((field) => (
                <td key={field.index} className="sg-num">
                  {toNumber(row[field.index]) > 0 ? row[field.index] : ""}
                  {field.ratioIndex !== undefined && toNumber(row[field.index]) > 0 && <small className="cb-ratio">{row[field.ratioIndex]}%</small>}
                  {field.textIndex !== undefined && row[field.textIndex] && row[field.textIndex] !== "-" && <small className="cb-text">{row[field.textIndex]}</small>}
                </td>
              ))}
              <td className="sg-num">{rowSum(row).toLocaleString("ko-KR")}</td>
            </tr>
          ))}
          <tr className="sg-sum">
            <td>{subtotal[0]}</td>
            {fields.map((field) => <td key={field.index} className="sg-num">{subtotal[field.index]}</td>)}
            <td className="sg-num">{rowSum(subtotal).toLocaleString("ko-KR")}</td>
          </tr>
        </tbody>
      </table>
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
          {section.kind === "grid" && section.variant === "cost-schedule" ? (
            <div className="pd-card bd-card"><CostScheduleView section={section} /></div>
          ) : section.kind === "grid" && section.variant === "cost-breakdown" ? (
            <div className="pd-card bd-card"><CostBreakdownView section={section} /></div>
          ) : section.kind === "grid" && section.variant !== "plan" ? (
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
