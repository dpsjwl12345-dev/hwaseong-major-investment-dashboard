import { deriveProjectBudget } from "../lib/projectBudget";
import "./DepartmentOverview.css";

type Project = Parameters<typeof deriveProjectBudget>[0] & {
  id: string;
  current_stage: string;
  region: string;
};
export function DepartmentOverview({ projects, stage, onStageChange }: {
  projects: Project[]; stage: string; onStageChange: (stage: string) => void;
}) {
  const totals = projects.reduce((sum, project) => {
    const budget = deriveProjectBudget(project);
    return { total: sum.total + budget.total, invested: sum.invested + budget.investedThrough2026,
      request: sum.request + budget.budget2027, future: sum.future + budget.budget2028Plus };
  }, { total: 0, invested: 0, request: 0, future: 0 });
  const stages = Array.from(new Set(projects.map(p => p.current_stage || "미등록")));
  const amount = (value: number) => (value / 100).toLocaleString("ko-KR", { maximumFractionDigits: 1 });
  const cards = [
    ["총사업비", totals.total, "전체 사업의 계획 규모"],
    ["누적 투자예산", totals.invested, "2026년까지 · 실제 집행액과 구분"],
    ["2027년 예산 요구액", totals.request, "본예산 요구 기준"],
    ["2028년 이후 계획액", totals.future, "향후 연도별 투자 계획"],
  ] as const;
  return <div className="do-overview">
    <div className="do-budget-grid">{cards.map(([label, value, note], index) => <div key={label} className={index === 2 ? "do-budget-card is-request" : "do-budget-card"}>
      <span>{label}</span><strong>{amount(value)}<small>억원</small></strong><p>{note}</p>
    </div>)}</div>
    <div className="do-stage-header"><h2>사업 목록</h2><span>전체 {projects.length}개 · 계속 {projects.filter(p => p.region === "계속").length}개 · 신규 {projects.filter(p => p.region === "신규").length}개</span></div>
    <div className="do-stage-list" aria-label="추진단계별 사업 필터">
      {["전체", ...stages].map(name => <button key={name} type="button" aria-pressed={stage === name} onClick={() => onStageChange(stage === name ? "전체" : name)}>
        <span>{name}</span><strong>{name === "전체" ? projects.length : projects.filter(p => (p.current_stage || "미등록") === name).length}<small>개</small></strong>
      </button>)}
    </div>
    <div className="do-table-guide"><span>{stage === "전체" ? "전체 사업" : stage + " 단계 사업"} 목록</span><p>사업을 선택하면 예산 내역과 추진현황을 확인할 수 있습니다.</p></div>
  </div>;
}
