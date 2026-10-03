import { Fragment } from "react";
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
  // 연도별 추진 내용(있으면 표 머리글 아래 "추진 내용" 줄로 보여준다)
  stageNotes?: string[];
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

// 연도별 예산현황 표를 맨 위에 두고, 글씨를 1pt 키우고 표 안에 얇은 세로선을 넣는 사업.
const BUDGET_FIRST_PROJECTS = new Set(["총괄데이터_5.xlsx:문화예술과:6"]);

const detailByProject = budgetDetailData as unknown as Record<string, { sections: DetailSection[] }>;

export function hasBudgetDetail(projectId: string) {
  return projectId in detailByProject;
}

export type PlanYearKey = "budget_2026" | "budget_2027" | "budget_2028_plus";

// 예산서(과목×연도) 표: 연도를 머리글로(연도 아래에 그해 추진 단계를 작게), 행은 과목을 묶음(시설비·감리비…)별로.
// 사업비 계획 표와 같은 모양으로: 백만원 단위, 묶음마다 색 막대, 과목은 들여 쓴 숫자만. 원본 천원 금액은 칸 툴팁에 남긴다.
const parseAmount = (value: string | undefined) => (value && value !== "-" ? Number(value.replace(/,/g, "")) : 0);
const GROUP_COLORS = ["#3987e5", "#199e70", "#9085e9", "#c98500", "#d55181", "#d95926"];
const thousandText = (value: number) => `${value.toLocaleString("ko-KR")}천원`;

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
  const groups = Array.from(new Set(items.map((item) => item.group))).map((name, order) => ({ name, color: GROUP_COLORS[order % GROUP_COLORS.length], members: items.filter((item) => item.group === name) }));
  const sumOf = (list: typeof items, pick: (item: (typeof items)[number]) => string | undefined) => list.reduce((sum, item) => sum + parseAmount(pick(item)), 0);
  const isSelected = (year: string) => !!selectedYear && yearBucket(year) === selectedYear;
  // 금액이 하나도 없는 연도는 열을 빼서 표를 좁히고(주석으로 남긴다) 글씨를 키울 자리를 만든다.
  const yearIndexes = section.years.map((_, index) => index).filter((index) => parseAmount(totalRow?.values[index]) > 0 || items.some((item) => parseAmount(item.values[index]) > 0));
  const emptyYears = section.years.filter((_, index) => !yearIndexes.includes(index));
  const years = yearIndexes.map((index) => ({ year: section.years[index], index }));
  const scale = Math.max(1, ...groups.flatMap((entry) => years.map(({ index }) => sumOf(entry.members, (item) => item.values[index]))));
  const extraNotes = section.extraColumns
    .map((column, columnIndex) => ({ column, entries: items.filter((item) => item.extra[columnIndex]).map((item) => `${item.name} ${item.extra[columnIndex]}`) }))
    .filter((note) => note.entries.length > 0)
    .map((note) => `${note.column}: ${note.entries.join(", ")}`);
  const hasNotes = !!section.stageNotes?.some((note) => note);
  const stageLine = hasNotes ? "" : years.filter(({ index }) => section.stages[index]).map(({ year, index }) => `${year} ${section.stages[index].replace(/\n/g, " ")}`).join(" · ");
  const emptyYearNote = (year: string) => { const note = section.stageNotes?.[section.years.indexOf(year)]?.replace(/\n/g, " "); return note ? `${year}(${note})` : year; };
  const notes = [...extraNotes,...(emptyYears.length ? [`${emptyYears.map(emptyYearNote).join("·")}: 편성 없음`] : []), ...(items.some((item) => item.flags.some((index) => parseAmount(item.values[index]) > 0)) ? ["노란 밑줄은 원본 예산서의 표시"] : [])].join(" · ");
  const amountCell = (value: number, year: string, key: string, options: { color?: string; flag?: boolean } = {}) => (
    <td key={key} className={`tl-cell${isSelected(year) ? " is-selected" : ""}${options.flag && value > 0 ? " is-flag" : ""}`} title={value > 0 ? `${year} ${thousandText(value)}` : undefined}>
      {value > 0 && (
        <>
          <span className="tl-amount">{fmtMillion(value / 1000)}</span>
          {options.color && <span className="tl-track"><span style={{ width: `${Math.max((value / scale) * 100, 3)}%`, background: options.color }} /></span>}
        </>
      )}
    </td>
  );
  return (
    <>
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: 백만원]</span>
      </div>
      {/* 그해 추진 내용은 표 칸에 넣지 않고 표 위 한 줄로: "2020년 토지보상 · 2021년 …" */}
      {stageLine && <p className="tl-stage-line"><b>추진 내용</b>{stageLine}</p>}
      <div className="bd-scroll">
        <table className="tl-table">
          <colgroup>
            <col style={{ width: 250 }} />
            <col style={{ width: 120 }} />
            {years.map(({ year }) => <col key={year} />)}
          </colgroup>
          <thead>
            <tr>
              <th>과목</th>
              <th>계</th>
              {years.map(({ year }) => <th key={year} className={isSelected(year) ? "is-selected" : undefined}>{year}</th>)}
            </tr>
          </thead>
          <tbody>
            {hasNotes && (
              <tr className="tl-notes">
                <td>추진 내용</td>
                <td />
                {years.map(({ year, index }) => <td key={year} className={isSelected(year) ? "is-selected" : undefined}>{section.stageNotes?.[index]}</td>)}
              </tr>
            )}
            <tr className="tl-total">
              <td>합계</td>
              <td title={thousandText(parseAmount(totalRow?.total))}>{fmtMillion(parseAmount(totalRow?.total) / 1000)}</td>
              {years.map(({ year, index }) => {
                const value = parseAmount(totalRow?.values[index]);
                return <td key={year} className={isSelected(year) ? "is-selected" : undefined} title={value > 0 ? `${year} ${thousandText(value)}` : undefined}>{value > 0 ? fmtMillion(value / 1000) : ""}</td>;
              })}
            </tr>
            {groups.map(({ name, color, members }) => {
              // 과목이 하나뿐인 묶음은 묶음 줄과 과목 줄이 같아지므로 한 줄로 합친다.
              const single = members.length === 1 ? members[0] : null;
              return [
                <tr key={`${name}-group`} className="tl-stage tl-group">
                  {/* 부연 설명은 감리비(건설사업관리 등)만 이름 아래 줄에 둔다. */}
                  <td><i style={{ background: color }} aria-hidden="true" />{name}{single && single.name !== name && name === "감리비" && <span className="tl-sub tl-sub-line">{single.name}</span>}</td>
                  <td>{fmtMillion(sumOf(members, (item) => item.total) / 1000)}</td>
                  {years.map(({ year, index }) => amountCell(sumOf(members, (item) => item.values[index]), year, year, { color, flag: !!single && single.flags.includes(index) }))}
                </tr>,
                ...(single ? [] : members.map((item) => (
                  <tr key={`${name}-${item.name}`} className="tl-item">
                    <td>{item.name}</td>
                    <td>{parseAmount(item.total) > 0 ? fmtMillion(parseAmount(item.total) / 1000) : ""}</td>
                    {years.map(({ year, index }) => amountCell(parseAmount(item.values[index]), year, year, { flag: item.flags.includes(index) }))}
                  </tr>
                ))),
              ];
            })}
          </tbody>
        </table>
      </div>
      {notes && <p className="pl-notes">※ {notes}</p>}
    </>
  );
}

// 예산현황표와 지출현황표를 연도별로 맞대어: 그해 예산, 지출, 집행률(막대). 계는 지출이 있을 수 있는 해(~2026)까지만 비교한다.
function ExecutionSummary({ budget, spend, selectedYear }: { budget: MatrixSection; spend: MatrixSection; selectedYear?: PlanYearKey }) {
  const budgetTotal = budget.rows.find((row) => row.kind === "total");
  const spendTotal = spend.rows.find((row) => row.kind === "total");
  const valueAt = (section: MatrixSection, total: DetailRow | undefined, year: string) => {
    const index = section.years.indexOf(year);
    return index >= 0 ? parseAmount(total?.values[index]) : null;
  };
  const allYears = Array.from(new Set([...budget.years, ...spend.years]));
  const years = allYears
    .map((year) => ({ year, budget: valueAt(budget, budgetTotal, year), spend: valueAt(spend, spendTotal, year) }))
    .filter((entry) => (entry.budget ?? 0) > 0 || (entry.spend ?? 0) > 0);
  const past = years.filter((entry) => entry.spend !== null);
  const pastBudget = past.reduce((sum, entry) => sum + (entry.budget ?? 0), 0);
  const pastSpend = past.reduce((sum, entry) => sum + (entry.spend ?? 0), 0);
  const isSelected = (year: string) => !!selectedYear && yearBucket(year) === selectedYear;
  const amount = (value: number | null, year: string) => (
    <td key={year} className={isSelected(year) ? "is-selected" : undefined} title={value ? `${year} ${thousandText(value)}` : undefined}>
      {value === null ? "" : value > 0 ? fmtMillion(value / 1000) : "-"}
    </td>
  );
  const rate = (spent: number | null, planned: number | null) => (spent === null || !planned ? null : (spent / planned) * 100);
  const rateCell = (value: number | null, key: string, selected = false) => (
    <td key={key} className={`tl-cell${selected ? " is-selected" : ""}`}>
      {value === null ? <span className="ex-none">-</span> : (
        <>
          <span className={`ex-rate${value < 50 ? " is-low" : value > 100 ? " is-over" : ""}`}>{value.toFixed(value < 10 ? 1 : 0)}%</span>
          <span className="tl-track"><span style={{ width: `${Math.max(Math.min(value, 100), 3)}%`, background: value < 50 ? "#fab219" : "#3987e5" }} /></span>
        </>
      )}
    </td>
  );
  const lastPast = past.length ? past[past.length - 1].year : "";
  // 지출현황표의 계에는 불용액이 들어 있어 연도별 지출 합과 다를 수 있다 — 차이가 불용액과 같으면 그렇게 밝힌다.
  const unusedIndex = spend.extraColumns.indexOf("불용");
  const unused = unusedIndex >= 0 ? spend.rows.reduce((sum, row) => sum + parseAmount(row.extra?.[unusedIndex]), 0) : 0;
  const spendGap = parseAmount(spendTotal?.total) - spend.years.reduce((sum, year) => sum + (valueAt(spend, spendTotal, year) ?? 0), 0);
  const gapNote = spendGap !== 0 ? ` 지출 계는 연도별 지출의 합으로, 지출현황표 계보다 ${thousandText(spendGap)} 적음${unused === spendGap ? "(불용액)" : ""}.` : "";
  return (
    <>
      <div className="pd-card-title">
        <span>□ 연도별 예산 대비 지출</span>
        <span className="bd-unit">[단위: 백만원]</span>
      </div>
      <div className="bd-scroll">
        <table className="tl-table">
          <colgroup>
            <col style={{ width: 250 }} />
            <col style={{ width: 120 }} />
            {years.map(({ year }) => <col key={year} />)}
          </colgroup>
          <thead>
            <tr>
              <th>구분</th>
              <th>계<small>~{lastPast}</small></th>
              {years.map(({ year }) => <th key={year} className={isSelected(year) ? "is-selected" : undefined}>{year}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="tl-stage">
              <td>예산</td>
              {amount(pastBudget, "계")}
              {years.map((entry) => amount(entry.budget, entry.year))}
            </tr>
            <tr className="tl-stage">
              <td>지출</td>
              {amount(pastSpend, "계")}
              {years.map((entry) => amount(entry.spend, entry.year))}
            </tr>
            <tr className="tl-stage">
              <td>집행률</td>
              {rateCell(rate(pastSpend, pastBudget), "계")}
              {years.map((entry) => rateCell(rate(entry.spend, entry.budget), entry.year, isSelected(entry.year)))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="pl-notes">※ 집행률 = 지출 ÷ 그해 예산(막대는 100%까지). 50% 미만은 주황, 100% 초과(이월분 집행 등)는 파랑. 지출 자료가 없는 연도는 비워 둠.{gapNote}</p>
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

// 사업비 계획(비목×연도)을 간트형 표로: 행=단계(색)와 그 아래 비목, 열=연도. 칸마다 금액과 그 크기 막대를 두어
// 어느 해에 어느 단계가 얼마나 진행되는지 한눈에 보이게 한다. 원본 천원을 위 카드와 같은 백만원으로.
// 단계 색은 다크 배경에서 색각이상·대비 검증을 통과한 순서로 단계마다 고정한다.
const STAGE_COLORS: Record<string, string> = { 사전절차: "#d95926", "부지·보상": "#199e70", 설계: "#9085e9", "공사·감리": "#c98500", "부대·기타": "#d55181", 예비비: "#008300" };

function PlanTable({ section, selectedYear }: { section: GridSection; selectedYear?: PlanYearKey }) {
  const noteIndex = section.columns.indexOf("비고");
  const yearIndexes = section.columns.map((_, index) => index).filter((index) => index >= 2 && index !== noteIndex);
  const totalRow = section.rows[0];
  const itemRows = section.rows.slice(1).filter((row) => toMillion(row[1]) > 0);
  const stages = STAGE_ORDER
    .map((stage) => ({ stage, color: STAGE_COLORS[stage], rows: itemRows.filter((row) => stageOf(row[0]) === stage) }))
    .filter((group) => group.rows.length > 0);
  const stageSum = (rows: string[][], column: number) => rows.reduce((sum, row) => sum + toMillion(row[column]), 0);
  // 막대 길이는 표 전체에서 한 가지 기준(단계별 연도 금액의 최댓값)으로 잰다.
  const scale = Math.max(1, ...stages.flatMap((group) => yearIndexes.map((column) => stageSum(group.rows, column))));
  const isSelected = (column: number) => !!selectedYear && yearBucket(section.columns[column]) === selectedYear;
  const cell = (value: number, color: string, title: string, column: number, faint = false) => (
    <td key={column} className={`tl-cell${isSelected(column) ? " is-selected" : ""}`} title={value > 0 ? title : undefined}>
      {value > 0 && (
        <>
          <span className="tl-amount">{fmtMillion(value)}</span>
          <span className="tl-track"><span style={{ width: `${Math.max((value / scale) * 100, 3)}%`, background: color, opacity: faint ? 0.55 : 1 }} /></span>
        </>
      )}
    </td>
  );
  const notes = noteIndex >= 0 ? section.rows.slice(1).filter((row) => row[noteIndex]).map((row) => `${row[0]}: ${row[noteIndex]}`).join(" · ") : "";
  return (
    <>
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: 백만원]</span>
      </div>
      <div className="bd-scroll">
        <table className="tl-table">
          <colgroup>
            <col style={{ width: 200 }} />
            <col style={{ width: 120 }} />
            {yearIndexes.map((column) => <col key={column} />)}
          </colgroup>
          <thead>
            <tr>
              <th>단계</th>
              <th>총사업비</th>
              {yearIndexes.map((column) => <th key={column} className={isSelected(column) ? "is-selected" : undefined}>{section.columns[column]}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr className="tl-total">
              <td>합계</td>
              <td className="tl-num">{fmtMillion(toMillion(totalRow[1]))}</td>
              {yearIndexes.map((column) => {
                const value = toMillion(totalRow[column]) || stageSum(itemRows, column);
                return <td key={column} className={`tl-num${isSelected(column) ? " is-selected" : ""}`}>{value > 0 ? fmtMillion(value) : ""}</td>;
              })}
            </tr>
            {/* 표에는 단계만 두고, 비목별 금액은 칸에 마우스를 올리면 보이게 한다. */}
            {stages.map((group) => (
              <tr key={group.stage} className="tl-stage">
                <td><i style={{ background: group.color }} aria-hidden="true" />{group.stage}</td>
                <td className="tl-num">{fmtMillion(stageSum(group.rows, 1))}</td>
                {yearIndexes.map((column) => {
                  const detail = group.rows.filter((row) => toMillion(row[column]) > 0).map((row) => `${row[0]} ${fmtMillion(toMillion(row[column]))}`).join(", ");
                  return cell(stageSum(group.rows, column), group.color, `${section.columns[column]} · ${group.stage} ${fmtMillion(stageSum(group.rows, column))} (${detail})`, column);
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notes && <p className="pl-notes">※ {notes}</p>}
    </>
  );
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
          <tr className="sg-sum">
            <td>{subtotal[0]}</td>
            {fields.map((field) => <td key={field.index} className="sg-num">{subtotal[field.index]}</td>)}
            <td className="sg-num">{rowSum(subtotal).toLocaleString("ko-KR")}</td>
          </tr>
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
        </tbody>
      </table>
    </>
  );
}

export function BudgetDetailPanel({ projectId, selectedYear }: { projectId: string; selectedYear?: PlanYearKey }) {
  const detail = detailByProject[projectId];
  if (!detail) return null;
  const matrices = detail.sections.filter((section): section is MatrixSection => section.kind !== "grid");
  const budgetMatrix = matrices.find((section) => section.title.includes("예산현황"));
  const spendMatrix = matrices.find((section) => section.title.includes("지출현황"));
  // 연도별 예산현황 표를 먼저 보여주는 사업(어린이 과학관): 예산현황 → 예산 대비 지출 → 나머지 순.
  const budgetFirst = BUDGET_FIRST_PROJECTS.has(projectId) && !!budgetMatrix;
  const orderedSections = budgetFirst ? [budgetMatrix, ...detail.sections.filter((section) => section !== budgetMatrix)] : detail.sections;
  const executionPanel = budgetMatrix && spendMatrix && (
    <div className="pd-stacked-panel">
      <div className="pd-card bd-card"><ExecutionSummary budget={budgetMatrix} spend={spendMatrix} selectedYear={selectedYear} /></div>
    </div>
  );
  return (
    <div className={`pd-detail-attached-group${BUDGET_FIRST_PROJECTS.has(projectId) ? " bd-large-lined" : ""}`}>
      {!budgetFirst && executionPanel}
      {orderedSections.map((section, index) => (
        <Fragment key={section.title}>
        {budgetFirst && index === 1 && executionPanel}
        <div className={`pd-stacked-panel${index === orderedSections.length - 1 ? " pd-attached-last" : ""}`}>
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
        </Fragment>
      ))}
    </div>
  );
}
