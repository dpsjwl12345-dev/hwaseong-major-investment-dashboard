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
  return (
    <section className="mt-6" aria-label="노선별 예산 현황">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">노선별 예산 현황</h3>
        <span className="text-sm text-muted-foreground">단위: 백만원 · 연장·폭: m · 편입필지: 필지</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th rowSpan={2} scope="col" className="border border-border p-3">노선명</th>
              <th rowSpan={2} scope="col" className="border border-border p-3">연장</th>
              <th colSpan={2} scope="colgroup" className="border border-border p-3">폭</th>
              <th colSpan={4} scope="colgroup" className="border border-border p-3">사업비</th>
              <th rowSpan={2} scope="col" className="border border-border p-3">편입필지</th>
              <th rowSpan={2} scope="col" className="border border-border p-3">비고</th>
            </tr>
            <tr>{["현황", "개설", "총공사비", "보상비", "공사비", "설계비"].map(label => <th key={label} scope="col" className="border border-border p-2">{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.name}-${index}`} className={row.summary ? "bg-muted/40 font-semibold" : ""}>
                <th scope="row" className="whitespace-pre-line border border-border p-3 text-left">{row.name}</th>
                {[row.length, row.currentWidth, row.plannedWidth, row.total, row.compensation, row.construction, row.design, row.parcels].map((value, column) => <td key={column} className="border border-border p-3 text-right tabular-nums">{display(value)}</td>)}
                <td className="min-w-[130px] whitespace-pre-line border border-border p-3">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">제공 자료의 금액·빈칸·비고를 그대로 표시했습니다. 일부 노선별 사업비는 합계가 일치하지 않으며, 편입필지 합계 130필지는 사업 개요의 143필지와 달라 확인이 필요합니다.</p>
    </section>
  );
}
