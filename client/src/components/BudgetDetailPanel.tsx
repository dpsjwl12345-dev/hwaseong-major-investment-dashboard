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
  rows: string[][];
};

type DetailSection = MatrixSection | GridSection;

const detailByProject = budgetDetailData as unknown as Record<string, { sections: DetailSection[] }>;

export function hasBudgetDetail(projectId: string) {
  return projectId in detailByProject;
}

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

export function BudgetDetailPanel({ projectId }: { projectId: string }) {
  const detail = detailByProject[projectId];
  if (!detail) return null;
  return (
    <div className="pd-detail-attached-group">
      {detail.sections.map((section, index) => (
        <div key={section.title} className={`pd-stacked-panel${index === detail.sections.length - 1 ? " pd-attached-last" : ""}`}>
          {section.kind === "grid" ? <GridTable section={section} /> : <SectionTable section={section} />}
        </div>
      ))}
    </div>
  );
}
