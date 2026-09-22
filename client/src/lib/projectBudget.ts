// 한 사업의 예산을 화면마다 다르게 읽던 문제를 끝내는 단일 계산 지점.
//
// 그동안 같은 사업의 예산이 세 벌로 따로 저장돼 있었다.
//   (1) 총괄표   total_cost_million_krw / invested_to_2026_million_krw / budget_2027_million_krw
//   (2) 관리카드 card_total_budget_million_krw / card_budget_2027_million_krw / ...
//   (3) 내역표   funding_breakdown(재원별) / usage_breakdown(성질별)
// 세 벌 사이에 계산 관계가 없어서, 부서 현황 표와 상세 카드와 예산현황 탭이 서로 다른
// 숫자를 보여줬다(43개 중 24개 불일치).
//
// 이제 화면은 전부 이 함수만 읽는다. 내역표를 유일한 원본으로 삼되, 내역표가 스스로
// 맞지 않는 사업은 숫자를 지어내지 않고 저장값을 그대로 쓰고 `issues`로 알린다.
// 예산 숫자는 추정해서 채울 대상이 아니다.

export type BudgetBreakdownRow = {
  name: string;
  total: number | null;
  invested: number | null;
  budget_2026: number | null;
  budget_2027: number | null;
  budget_2028_plus: number | null;
};

type BudgetSourceProject = {
  funding_breakdown?: BudgetBreakdownRow[] | null;
  usage_breakdown?: BudgetBreakdownRow[] | null;
  total_cost_million_krw?: number | null;
  invested_to_2026_million_krw?: number | null;
  budget_2027_million_krw?: number | null;
  card_total_budget_million_krw?: number | null;
  card_invested_to_2026_million_krw?: number | null;
  card_invested_to_2025_million_krw?: number | null;
  card_budget_2026_million_krw?: number | null;
  card_budget_2027_million_krw?: number | null;
  card_budget_2028_plus_million_krw?: number | null;
};

// 구간 정의. 데이터 34개 사업에서 `총액 = 기투자 + 2026 + 2027 + 2028이후`가 성립하므로
// 기투자는 2026년 편성액을 포함하지 않는 누적액(~2025)이다. 총괄표 컬럼명이
// "기투자액(~2026)"이라 오해를 사지만 실제 값은 2026년 편성액과 별개다.
export type ProjectBudget = {
  total: number;
  /** 기투자액 — 2026년 편성액을 포함하지 않는 누적액. 구간을 나눠 보여주는 내역표·흐름 그래프용. */
  invested: number;
  /**
   * 기투자액(~2026) — 기투자 + 2026년 편성액. 카드와 부서 현황 표처럼 2026년 칸이 따로 없는
   * 화면은 반드시 이 값을 쓴다. 전에는 2026년을 뺀 값을 "기투자액(~2026)"으로 적어서
   * 2026년 예산이 어디에도 안 잡히고 떠 있었다(총사업비 = 기투자 + 2027 + 이후 가 안 맞았다).
   */
  investedThrough2026: number;
  budget2026: number;
  budget2027: number;
  budget2028Plus: number;
  /** breakdown = 내역표에서 계산한 값(일원화 완료), stored = 내역표가 맞지 않아 저장값을 그대로 쓴 값 */
  source: "breakdown" | "stored";
  issues: string[];
};

const n = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export function sumRows(rows: BudgetBreakdownRow[] | null | undefined, key: keyof BudgetBreakdownRow) {
  return (rows ?? []).reduce((sum, row) => sum + n(row[key] as number | null | undefined), 0);
}

const SEGMENT_KEYS = ["invested", "budget_2026", "budget_2027", "budget_2028_plus"] as const;

function hasAnyAmount(rows: BudgetBreakdownRow[] | null | undefined) {
  return (rows ?? []).some((row) => n(row.total) !== 0 || SEGMENT_KEYS.some((key) => n(row[key]) !== 0));
}

export function deriveProjectBudget(project: BudgetSourceProject): ProjectBudget {
  const funding = project.funding_breakdown ?? [];
  const usage = project.usage_breakdown ?? [];
  const fundingHasData = hasAnyAmount(funding);
  const usageHasData = hasAnyAmount(usage);

  // 재원별 표가 우선이다. 재원별이 통째로 비어 있고 성질별에만 수치가 있는 사업이 있어
  // (예: 화성 돔구장 및 복합체육센터 건립) 그때만 성질별을 원본으로 쓴다.
  const primary = fundingHasData ? funding : usage;
  const issues: string[] = [];

  // 저장된 기투자액은 대개 2026년 편성액을 포함하지 않는다 — 43개 중 20개는
  // card_invested_to_2026 이 card_invested_to_2025 와 값이 같다(이름과 달리 누적이 아니다).
  // 그래서 ~2026 누적은 여기서 2026년을 더해 만든다.
  //
  // 다만 반대로 이미 2026년을 포함해 적어 둔 사업도 있다(석우동 축구장: ~2025 2,800 +
  // 2026년 1,700 = ~2026 4,500). 그런 사업에 또 더하면 기투자액이 총사업비를 넘는 값
  // (6,200 > 4,500)이 되어 화면이 엉뚱해진다. 총사업비를 넘기면 이미 누적된 값으로 보고
  // 더하지 않으며, 사유를 남긴다.
  const storedTotal = n(project.total_cost_million_krw ?? project.card_total_budget_million_krw);
  const storedInvested = n(project.invested_to_2026_million_krw ?? project.card_invested_to_2026_million_krw ?? project.card_invested_to_2025_million_krw);
  const storedBudget2026 = n(project.card_budget_2026_million_krw);
  const overshoots = storedTotal > 0 && storedInvested + storedBudget2026 > storedTotal;
  const stored: Omit<ProjectBudget, "source" | "issues"> = {
    total: storedTotal,
    invested: storedInvested,
    investedThrough2026: overshoots ? storedInvested : storedInvested + storedBudget2026,
    budget2026: storedBudget2026,
    budget2027: n(project.budget_2027_million_krw ?? project.card_budget_2027_million_krw),
    budget2028Plus: n(project.card_budget_2028_plus_million_krw),
  };
  if (overshoots) {
    issues.push(`기투자액 ${storedInvested.toLocaleString("ko-KR")} + 2026년 ${storedBudget2026.toLocaleString("ko-KR")}이 총사업비 ${storedTotal.toLocaleString("ko-KR")}을 넘습니다 — 기투자액에 2026년이 이미 포함된 것으로 보고 더하지 않았습니다.`);
  }

  if (!fundingHasData && !usageHasData) {
    return { ...stored, source: "stored", issues: [...issues, "내역표(재원별·성질별)가 비어 있어 총괄표 값을 그대로 씁니다."] };
  }

  const segments = {
    invested: sumRows(primary, "invested"),
    investedThrough2026: sumRows(primary, "invested") + sumRows(primary, "budget_2026"),
    budget2026: sumRows(primary, "budget_2026"),
    budget2027: sumRows(primary, "budget_2027"),
    budget2028Plus: sumRows(primary, "budget_2028_plus"),
  };
  const declaredTotal = sumRows(primary, "total");
  const segmentTotal = segments.invested + segments.budget2026 + segments.budget2027 + segments.budget2028Plus;

  // 재원별과 성질별이 둘 다 채워져 있으면 총액과 2027년이 서로 맞아야 한다. 어긋나면
  // 어느 쪽이 맞는지는 원본을 봐야 알 수 있으므로 한쪽을 골라 쓰지 않는다. 예컨대 제부도
  // 도로 개설은 재원별 2027년이 0인데 성질별과 총괄표는 8,950이다 — 재원별을 그대로
  // 따랐다면 화면의 2027년 예산이 0으로 바뀌어 버린다. 이럴 때는 저장값을 그대로 두고 알린다.
  // 내역표 "기투자" 칸에 총계가 그대로 들어간 사업이 있다(석우동 축구장·롤러스포츠 경기장:
  // 총 4,500 = 기투자 4,500인데 2026년 1,700이 따로 적혀 있고, 성질별에는 전액 2027년이다).
  // 이러면 기투자액이 실제보다 총사업비만큼 부풀어 보이므로 반드시 사람이 확인해야 한다.
  if (declaredTotal > 0 && declaredTotal === segments.invested && segments.budget2026 > 0) {
    issues.push(`내역표 기투자 ${segments.invested.toLocaleString("ko-KR")}이 총액과 같은데 2026년 ${segments.budget2026.toLocaleString("ko-KR")}이 따로 있습니다 — 기투자 칸에 총계가 들어간 것으로 보입니다.`);
  }

  // 카드의 2026년 편성액이 내역표와 다르면 ~2026 누적이 화면마다 갈린다.
  if (storedBudget2026 !== 0 && storedBudget2026 !== segments.budget2026) {
    issues.push(`2026년 편성액 카드 ${storedBudget2026.toLocaleString("ko-KR")} ≠ 내역표 ${segments.budget2026.toLocaleString("ko-KR")}`);
  }

  if (fundingHasData && usageHasData) {
    const usageTotal = sumRows(usage, "total");
    if (usageTotal !== declaredTotal) issues.push(`재원별 총액 ${declaredTotal.toLocaleString("ko-KR")} ≠ 성질별 총액 ${usageTotal.toLocaleString("ko-KR")}`);
    const usage2027 = sumRows(usage, "budget_2027");
    if (usage2027 !== segments.budget2027) issues.push(`2027년 재원별 ${segments.budget2027.toLocaleString("ko-KR")} ≠ 성질별 ${usage2027.toLocaleString("ko-KR")}`);
    if (issues.length > 0) return { ...stored, source: "stored", issues };
  }

  if (declaredTotal !== segmentTotal) {
    issues.push(`내역표 총액 ${declaredTotal.toLocaleString("ko-KR")} ≠ 구간 합계 ${segmentTotal.toLocaleString("ko-KR")} (기투자 ${segments.invested.toLocaleString("ko-KR")} / 2026 ${segments.budget2026.toLocaleString("ko-KR")} / 2027 ${segments.budget2027.toLocaleString("ko-KR")} / 2028이후 ${segments.budget2028Plus.toLocaleString("ko-KR")})`);
    return { ...stored, source: "stored", issues };
  }

  // 여기까지 오면 내역표가 스스로 맞는다 — 이 사업은 모든 화면이 같은 값을 본다.
  if (stored.total && stored.total !== declaredTotal) issues.push(`총괄표 총사업비 ${stored.total.toLocaleString("ko-KR")}이 내역표 ${declaredTotal.toLocaleString("ko-KR")}과 달라 내역표 기준으로 표시합니다.`);
  if (stored.budget2027 && stored.budget2027 !== segments.budget2027) issues.push(`총괄표 2027년 ${stored.budget2027.toLocaleString("ko-KR")}이 내역표 ${segments.budget2027.toLocaleString("ko-KR")}과 달라 내역표 기준으로 표시합니다.`);

  return { ...segments, total: declaredTotal, source: "breakdown", issues };
}
