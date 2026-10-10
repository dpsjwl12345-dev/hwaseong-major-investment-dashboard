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
  const amount = (value: number) => (value / 100).toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  const cards = [
    ["총사업비", totals.total],
    ["누적 투자예산", totals.invested],
    ["2027년 요구액", totals.request],
    ["향후 계획액", totals.future],
  ] as const;
  return <div className="do-overview">
    <div className="do-budget-grid">{cards.map(([label, value], index) => <div key={label} className={index === 2 ? "do-budget-card is-request" : "do-budget-card"}>
      <span>{label}</span><strong>{amount(value)}<small>억원</small></strong>
    </div>)}</div>
    <div className="do-stage-header"><h2>전체 사업 목록</h2>
    <div className="do-stage-list" aria-label="추진단계별 사업 필터">
      {["전체", ...stages].map(name => <button key={name} type="button" aria-pressed={stage === name} onClick={() => onStageChange(stage === name ? "전체" : name)}>
        <span>{name}</span><strong>{name === "전체" ? projects.length : projects.filter(p => (p.current_stage || "미등록") === name).length}<small>개</small></strong>
      </button>)}
    </div>
    </div>
  </div>;
}
