import "./RouteBudgetTable.css";

export type RouteBudgetRow = {
  name: string;
  length: number | string | null;
  currentWidth: number | string | null;
  plannedWidth: number | string | null;
  total: number | string | null;
  compensation: number | string | null;
  construction: number | string | null;
  design: number | string | null;
  parcels: number | string | null;
  note?: string;
  summary?: boolean;
};

const display = (value: number | string | null) =>
  value == null ? "" : typeof value === "number" ? value.toLocaleString("ko-KR") : value;

export default function RouteBudgetTable({ rows }: { rows: RouteBudgetRow[] }) {
  let group = 0;
  return (
    <section className="route-budget" aria-label="노선별 예산 현황">
      <div className="route-budget-heading">
        <h3>노선별 예산 현황</h3>
        <span>금액: 백만원 · 연장·폭: m · 편입필지: 필지</span>
      </div>
      <div className="route-budget-scroll" tabIndex={0} role="region" aria-label="노선별 예산표, 좁은 화면에서는 좌우로 스크롤">
        <table className="route-budget-table">
          <colgroup><col style={{ width: "17%" }} /><col style={{ width: "7%" }} /><col style={{ width: "7%" }} /><col style={{ width: "7%" }} /><col style={{ width: "11%" }} /><col style={{ width: "11%" }} /><col style={{ width: "10%" }} /><col style={{ width: "8%" }} /><col style={{ width: "8%" }} /><col style={{ width: "14%" }} /></colgroup>
          <thead>
            <tr>
              <th rowSpan={2} scope="col" className="route-name">노선명</th>
              <th rowSpan={2} scope="col">연장</th>
              <th colSpan={2} scope="colgroup">폭</th>
              <th colSpan={4} scope="colgroup">사업비</th>
              <th rowSpan={2} scope="col">편입<br />필지</th>
              <th rowSpan={2} scope="col">비고</th>
            </tr>
            <tr>{["현황", "개설", "총공사비", "보상비", "공사비", "설계비"].map(label => <th key={label} scope="col" className={label === "총공사비" ? "route-total-column" : undefined}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              if (row.summary && index > 0) group++;
              const kind = index === 0 ? "route-grand-total" : row.summary ? "route-subtotal" : "route-item";
              return <tr key={`${row.name}-${index}`} className={`${kind} route-group-${group}`}>
                <th scope="row" className="route-name">{row.summary && index > 0 && <i aria-hidden="true" />}{row.name.replace(/\n/g, " ")}</th>
                {[row.length, row.currentWidth, row.plannedWidth, row.total, row.compensation, row.construction, row.design, row.parcels].map((value, column) => <td key={column} className={`${column === 3 ? "route-total-column " : ""}${value == null || value === "-" ? "route-empty" : ""}`}>{display(value)}</td>)}
                <td className="route-note">{row.note}</td>
              </tr>
            })}
          </tbody>
        </table>
      </div>
      <details className="route-budget-notes"><summary>자료 확인사항</summary><p>제공 자료의 금액·빈칸·비고를 그대로 표시했습니다. 일부 노선별 사업비는 합계가 일치하지 않으며, 편입필지 합계 130필지는 사업 개요의 143필지와 달라 확인이 필요합니다.</p></details>
    </section>
  );
}
