import type { ReactNode } from "react";
import { deriveProjectBudget, type BudgetBreakdownRow } from "../lib/projectBudget";
import "./ChildrenScienceBudgetReview.css";
import budgetDetails from "../data/budget_detail.json";

type ScienceProject = Parameters<typeof deriveProjectBudget>[0] & {
  current_stage: string;
  carryover_million_krw?: number | null;
  usage_breakdown: BudgetBreakdownRow[];
};
const money = (amount: number) => amount.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
const billion = (amount: number) => (amount / 100).toLocaleString("ko-KR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
// 2026.10.9. 1차 검토안. 부서 요구액·원본 자료는 변경하지 않는다.
const reviewItems = [
  { label: "공사비", source: "공사", requested: 17150, reviewed: 17150, reason: "2027년 3월 착공 계획에 따른 공사비. 계약·지급 일정 확인." },
  { label: "전시 제작·설치", source: "기타", requested: 4152, reviewed: 2076, reason: "제작·지급 일정에 따라 일부를 2028년으로 이연 검토." },
  { label: "감리비", source: "감리", requested: 1101, reviewed: 542, reason: "기존 감리비 잔액 1,018백만원의 사용 가능액을 확인해 반영." },
  { label: "부대비", source: "부대", requested: 23, reviewed: 23, reason: "기존 검토안 유지." },
];

export function ChildrenScienceBudgetReview({ project, children }: { project: ScienceProject; children: ReactNode }) {
  const budget = deriveProjectBudget(project);
  const reviewed = reviewItems.reduce((sum, item) => sum + item.reviewed, 0);
  const reviewRequest = reviewItems.reduce((sum, item) => sum + item.requested, 0);
  const reduction = reviewRequest - reviewed;
  const spendingSection = budgetDetails["총괄데이터_5.xlsx:문화예술과:6"].sections.find(section => section.title === "□ 지출현황");
  const spendingYearIndex = spendingSection?.years.indexOf("2026년") ?? -1;
  const spendingRow = spendingSection?.rows.find(row => row.kind === "total");
  const spendingText = spendingYearIndex >= 0 ? spendingRow?.values[spendingYearIndex] : undefined;
  const spending2026 = spendingText && spendingText !== "-" ? Number(spendingText.replace(/,/g, "")) / 1000 : null;
  const matchesReview = Math.abs(budget.budget2027 - reviewRequest) < 0.01 && reviewItems.every(item =>
    Math.abs(project.usage_breakdown.filter(row => row.name.includes(item.source)).reduce((sum, row) => sum + (row.budget_2027 ?? 0), 0) - item.requested) < 0.01
  );
  return (
    <div className="science-review">
      <header className="science-review-heading">
        <div><p>2027년 본예산 검토</p><h2>요구액과 조정 검토</h2></div>
        <span className="science-review-tag">1차 검토 · 미확정</span>
      </header>
      <p className="science-review-date">자료 기준 2026.9. · 검토안 기준 2026.10.9. · 요구액은 원본 유지</p>
      <div className="science-review-metrics">
        <section className="science-review-metric request"><span>부서 요구액</span><strong>{billion(budget.budget2027)}<small>억원</small></strong><p>{money(budget.budget2027)}백만원 · 시비</p></section>
        <section className="science-review-metric"><span>검토액 · 미확정</span><strong>{billion(reviewed)}<small>억원</small></strong><p>{money(reviewed)}백만원 · 1차 검토안</p></section>
        <section className="science-review-metric reduction"><span>조정 검토액</span><strong>{billion(reduction)}<small>억원</small></strong><p>{money(reduction)}백만원 · 기준 요구액 대비</p></section>
      </div>
      {!matchesReview && <p className="science-review-warning" role="status">현재 요구내역이 검토안 기준과 다릅니다. 검토액·조정액은 22,426백만원 기준의 이전 검토안이며 재검토가 필요합니다.</p>}
      <div className="science-review-takeaway"><b>검토 핵심</b><p>공사비는 착공 일정에 맞춰 확인하고, 전시비 지급 시기와 기존 감리재원 활용을 검토합니다.</p></div>
      <section className="science-review-section">
        <div className="science-review-section-title"><h3>사업은 어디까지 왔나요?</h3><span>현재 단계: {project.current_stage}</span></div>
        <ol className="science-review-timeline">
          <li><span>2026년 9월 계획</span><b>설계 준공</b><small>실제 완료 여부 확인</small></li>
          <li><span>2027년 3월 계획</span><b>공사 착공</b><small>입찰·계약 일정 확인</small></li>
          <li><span>2028년 10월 계획</span><b>공사 준공</b><small>전시 설치 일정 연계</small></li>
          <li><span>2028년 12월 계획</span><b>전시 설치·개관</b><small>사업 완료 목표</small></li>
        </ol>
      </section>
      <section className="science-review-section">
        <div className="science-review-section-title"><h3>올해 예산과 기존 재원</h3><span>2026년 편성액과 과거 누적액 구분</span></div>
        <div className="science-review-current">
          <div><span>2026년 신규 편성액</span><b>{money(budget.budget2026)}<small>백만원</small></b><p>이월액을 포함한 예산현액과 다릅니다.</p></div>
          <div><span>2026년 지출액 · 원본 지출표</span><b>{spending2026 == null ? "미입력" : money(spending2026)}<small>백만원</small></b><p>이월분 집행 포함. 신규 편성액만으로 집행률을 계산하지 않습니다.</p></div>
          <div><span>등록된 계속비이월액</span><b>{project.carryover_million_krw == null ? "미입력" : money(project.carryover_million_krw)}<small>백만원</small></b><p>2027년 이월예상액으로 확정된 값이 아닙니다.</p></div>
          <div><span>2027년 활용 가능 재원</span><b className="science-review-unconfirmed">확인 필요</b><p>연말 집행전망과 과목별 이월잔액을 확인해야 합니다.</p></div>
        </div>
      </section>
      <section className="science-review-section">
        <div className="science-review-section-title"><h3>2027년 요구액 검토</h3><span>단위: 백만원 · 2026.10.9. 검토안</span></div>
        <div className="science-review-table-scroll"><table className="science-review-table">
          <thead><tr><th scope="col">항목</th><th scope="col">요구액</th><th scope="col">검토액</th><th scope="col">감액</th><th scope="col">검토 이유</th></tr></thead>
          <tbody>{reviewItems.map(item => <tr key={item.label}><th scope="row">{item.label}</th><td>{money(item.requested)}</td><td>{money(item.reviewed)}</td><td className={item.requested > item.reviewed ? "science-review-adjustment" : ""}>{item.requested === item.reviewed ? "—" : money(item.requested - item.reviewed)}</td><td>{item.reason}</td></tr>)}</tbody>
          <tfoot><tr><th scope="row">합계</th><td>{money(reviewRequest)}</td><td>{money(reviewed)}</td><td>{money(reduction)}</td><td>최종 편성액은 추가 확인 후 결정</td></tr></tfoot>
        </table></div>
        <p className="science-review-warning">금액 확인: 기존 메모는 검토액 19,790백만원이나 항목 합계는 19,791백만원입니다. 차이 1백만원은 원 단위 산출표 확인이 필요합니다.</p>
      </section>
      <section className="science-review-section">
        <div className="science-review-section-title"><h3>확정 전에 확인할 세 가지</h3></div>
        <ul className="science-review-checks">
          <li><b>감리재원</b><span>메모의 잔액 1,018백만원 중 연말 잔존액과 2027년 사용 가능액</span></li>
          <li><b>전시 제작</b><span>2027년 지급분과 2028년 이연 가능액을 확인할 계약·납품 일정</span></li>
          <li><b>착공 준비</b><span>설계 준공 여부, 맹꽁이 이주 완료보고 및 입찰·착공 일정</span></li>
        </ul>
      </section>
      <details className="science-review-details"><summary>상세 산출근거와 원본 예산·지출표</summary><div className="science-review-original">{children}</div></details>
    </div>
  );
}
