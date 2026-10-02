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

type DetailSection = {
  title: string;
  unit: string;
  years: string[];
  stages: string[];
  extraColumns: string[];
  rows: DetailRow[];
};

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

function Cell({ value, highlighted }: { value: string; highlighted?: boolean }) {
  return <td className={`bd-num${value === "-" ? " is-dash" : ""}${highlighted ? " is-highlight" : ""}`}>{value}</td>;
}

function SectionTable({ section }: { section: DetailSection }) {
  return (
    <div className="pd-card bd-card">
      <div className="pd-card-title">
        <span>{section.title}</span>
        <span className="bd-unit">[단위: {section.unit}]</span>
      </div>
      <div className="bd-scroll">
        <table className="bd-table">
          <thead>
            <tr>
              <th>예산과목</th>
              <th colSpan={2}>구 분</th>
              <th>계</th>
              {section.years.map((year) => <th key={year}>{year}</th>)}
              {section.extraColumns.map((name) => <th key={name} className={name === "불용" ? "is-unused" : undefined}>{name}</th>)}
            </tr>
            <tr className="bd-stage-row">
              <th>통계목</th>
              <th colSpan={2}>연차별 계획공정</th>
              <th />
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
                    <td colSpan={3} className="bd-label">계</td>
                  ) : (
                    <>
                      {l1Span > 0 && <td rowSpan={l1Span} className="bd-label">{row.l1}</td>}
                      {row.l3 ? (
                        <>
                          {row.l2 && <td rowSpan={l2Span} className="bd-label">{row.l2}</td>}
                          <td className="bd-label">{row.l3}</td>
                        </>
                      ) : (
                        <td colSpan={2} className="bd-label">{row.l2}</td>
                      )}
                    </>
                  )}
                  <Cell value={row.total} />
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

export function BudgetDetailPanel({ projectId }: { projectId: string }) {
  const detail = detailByProject[projectId];
  if (!detail) return null;
  return (
    <div className="pd-detail-attached-group">
      {detail.sections.map((section, index) => (
        <div key={section.title} className={`pd-stacked-panel${index === detail.sections.length - 1 ? " pd-attached-last" : ""}`}>
          <SectionTable section={section} />
        </div>
      ))}
    </div>
  );
}
