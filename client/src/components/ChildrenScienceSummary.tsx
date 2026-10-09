import type { ProjectBudget } from "../lib/projectBudget";
import "./ChildrenScienceSummary.css";

export const CHILDREN_SCIENCE_ID = "총괄데이터_5.xlsx:문화예술과:6";

const won = (million: number) => `${(million / 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 })}억 원`;

export function ChildrenScienceSummary({ stage, image }: { stage: string; image?: string }) {
  const steps = ["기획·부지 확보", "설계", "건축 공사", "전시 설치", "개관"];
  const current = stage.includes("설계") ? 1 : stage.includes("공사") ? 2 : stage.includes("전시") ? 3 : stage.includes("개관") ? 4 : 0;
  return (
    <section className="cs-summary" aria-label="어린이 과학관 한눈에 보기">
      <div className="cs-intro">
        <div>
          <p className="cs-eyebrow">어떤 사업인가요?</p>
          <h2>병점에 어린이를 위한 과학관을 짓는 사업입니다.</h2>
          <p className="cs-description">병점복합타운에 과학 전시시설을 갖춘 어린이 과학관을 조성합니다. 건물을 짓고 전시콘텐츠를 제작·설치한 뒤, 2028년 12월 개관을 목표로 추진합니다.</p>
          <dl className="cs-facts">
            <div><dt>위치</dt><dd>병점동 899번지 · 병점복합타운</dd></div>
            <div><dt>시설 규모</dt><dd>지하 1층~지상 4층 · 연면적 9,000㎡</dd></div>
            <div><dt>주차 공간</dt><dd>84대</dd></div>
          </dl>
        </div>
        {image && <figure><img src={image} alt="어린이 과학관 건립 예정 조감도" /><figcaption>완공 후 모습 · 조감도(계획)</figcaption></figure>}
      </div>
      <div className="cs-stage">
        <div className="cs-stage-heading"><h3>현재는 <strong>{stage}</strong> 단계입니다.</h3><span>자료 기준 2026.9.</span></div>
        <ol className="cs-steps" aria-label="사업 추진 단계">
          {steps.map((step, index) => <li key={step} className={index === current ? "is-current" : index < current ? "is-past" : ""} aria-current={index === current ? "step" : undefined}><span>{index < current ? "✓" : index + 1}</span><b>{step}</b><small>{index === current ? "현재 단계" : index < current ? "이전 단계" : "예정"}</small></li>)}
        </ol>
        <p className="cs-stage-note">설계는 건물의 구조와 시설 배치를 정하는 과정입니다. 자료상 건축 공사 착공 전이며, 진척도 25%는 전체 사업 추진 정도를 나타냅니다.</p>
        <div className="cs-dates"><span><b>착공 예정</b>2027.3.</span><span><b>건물 준공 예정</b>2028.10.</span><span><b>전시 설치·개관 예정</b>2028.12.</span></div>
      </div>
    </section>
  );
}

export function ChildrenScienceBudgetSummary({ budget, spent }: { budget: ProjectBudget; spent: number | null }) {
  const periods = [
    { label: "지금까지 편성", value: budget.investedThrough2026, date: "~2026년", note: "부지 확보·설계 등 기존 사업 예산", className: "past" },
    { label: "다음 해 투입", value: budget.budget2027, date: "2027년 본예산 요구", note: "건축 공사·전시 제작·감리 등", className: "next" },
    { label: "이후 투입", value: budget.budget2028Plus, date: "2028년 이후 계획", note: "건물 준공·전시 설치·개관 준비", className: "future" },
  ];
  return (
    <section className="cs-budget" aria-label="전체 사업비와 예산 투입 흐름">
      <header><div><p className="cs-eyebrow">예산을 쉽게 읽기</p><h3>전체 사업에 <strong>약 {won(budget.total)}</strong>이 들어갑니다.</h3></div><span>2026.9. 제출자료 기준</span></header>
      <p className="cs-description">총사업비는 부지·설계·건축 공사·전시시설 등에 필요한 전체 비용입니다. 아래 금액은 연도별 예산 편성액과 향후 투입계획입니다.</p>
      <div className="cs-budget-track" aria-hidden="true">{periods.map(period => <span key={period.date} className={period.className} style={{ flex: Math.max(period.value, 0) }} />)}</div>
      <div className="cs-budget-periods">{periods.map(period => <div key={period.date} className={period.className}><p>{period.label}<span>{period.date}</span></p><strong>{won(period.value)}</strong><small>{period.note}</small></div>)}</div>
      <div className="cs-spent"><div><span>실제로 지출한 금액</span><strong>{spent == null ? "자료 없음" : `약 ${won(spent)}`}</strong><small>2026년까지 누적 · 관리카드 기준</small></div><p>‘지금까지 편성’은 사업에 배정한 예산이고, ‘실제 지출’은 지급한 금액입니다. 지출액은 편성액에 포함되므로 두 금액을 더하지 않습니다.</p></div>
      <p className="cs-budget-note">2027년 금액은 본예산 요구액이며, 2028년 이후 금액은 계획액입니다. 이월액은 이전에 편성한 예산 중 다음 해로 넘긴 금액으로, 총사업비에 다시 더하지 않습니다.</p>
    </section>
  );
}
