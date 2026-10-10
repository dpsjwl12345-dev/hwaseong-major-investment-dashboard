import { deriveProjectBudget, type ProjectBudget } from "../lib/projectBudget";
import dataset from "../data/dashboard_projects.json";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardSendIcon } from "./icons/solar";
import "./ChildrenScienceSummary.css";

export const CHILDREN_SCIENCE_ID = "총괄데이터_5.xlsx:문화예술과:6";
const source = dataset.projects.find(project => project.id === CHILDREN_SCIENCE_ID)!;
const sourceBudget = deriveProjectBudget(source);
const sourceExecution = source.card_execution_amount_million_krw != null && source.card_execution_budget_million_krw
  ? Math.round(source.card_execution_amount_million_krw / source.card_execution_budget_million_krw * 100)
  : source.card_execution_rate ?? 0;

const won = (million: number) => `${(million / 100).toLocaleString("ko-KR", { maximumFractionDigits: 0 })}억 원`;

// 사업개요 원문("○ 항목: 내용")에서 항목별 값을 꺼낸다. 값이 여러 줄이면 다음 ○ 전까지 이어 붙인다.
const overviewFields = (text: string | null | undefined) => {
  const fields: Record<string, string> = {};
  let key = "";
  for (const line of (text ?? "").split("\n")) {
    const m = line.match(/^\s*○\s*([^:：]+)[:：]\s*(.*)$/);
    if (m) { key = m[1].trim(); fields[key] = m[2].trim(); }
    else if (key && line.trim()) fields[key] = `${fields[key]} ${line.trim()}`.trim();
  }
  return fields;
};

// 화면에 보일 때 0에서 목표값까지 숫자를 올리고 막대를 채운다. 동작 줄이기 설정이면 바로 최종값.
function ProgressMeter({ label, value, note }: { label: string; value: number | null; note?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || value == null) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setVisible(true); setShown(value); return; }
    let frame = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setVisible(true);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);
  return (
    <div ref={ref} className={`cs-meter${visible ? " is-visible" : ""}`}>
      <div className="cs-meter-head"><span>{label}</span><b>{value == null ? "자료 없음" : <>{shown}<small>%</small></>}</b></div>
      <div className="cs-meter-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? undefined}><i style={{ ["--to" as string]: `${Math.min(100, value ?? 0)}%` }} /></div>
      {note && <small className="cs-meter-note">{note}</small>}
    </div>
  );
}

export function ChildrenScienceSummary({ stage, image }: { stage: string; image?: string }) {
  const summaryRef = useRef<HTMLElement>(null);
  const [titleContainer, setTitleContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTitleContainer(summaryRef.current?.closest(".pd-detail-page")?.querySelector<HTMLElement>(".pd-detail-title-block") ?? null);
  }, []);
  const total = sourceBudget.total;
  const progress = source.progress_rate;
  const execution = sourceExecution;
  const kind = source.region;
  const location = [source.contact, source.district, source.town].filter(Boolean).join(" · ");
  const fields = overviewFields(source.overview);
  const steps = ["기획·부지 확보", "설계", "건축 공사", "전시 설치", "개관"];
  const current = stage.includes("설계") ? 1 : stage.includes("공사") ? 2 : stage.includes("전시") ? 3 : stage.includes("개관") ? 4 : 0;
  return (
    <>
    {titleContainer && createPortal(<h1 className="cs-project-title">화성시 어린이 테마 과학관 건립</h1>, titleContainer)}
    <section ref={summaryRef} className="cs-summary" aria-label="어린이 과학관 한눈에 보기">
      <div className="cs-intro">
        {image && <figure><img src={image} alt="어린이 과학관 건립 예정 조감도" /><figcaption>완공 후 모습 · 조감도(계획)</figcaption></figure>}
        <div className="cs-overview">
          <p className="cs-overview-eyebrow"><span>사업 개요</span><span className="cs-overview-basis">자료 기준 2026.9.</span></p>
          {fields["사업내용"] && <p className="cs-overview-lead">{fields["사업내용"]}</p>}
          <dl className="cs-overview-list">
            <div><dt>총사업비</dt><dd><b className="is-accent">{won(total)}</b></dd></div>
            {fields["사업위치"] && <div><dt>위치</dt><dd><b>{fields["사업위치"]}</b>{location && <span>{location}</span>}</dd></div>}
            {fields["사업규모"] && <div><dt>규모</dt><dd><b>{fields["사업규모"].replace(/,?\s*주차대수\s*[:：]?\s*[^,]*/, "")}</b></dd></div>}
            {fields["사업기간"] && <div><dt>기간</dt><dd><b>{fields["사업기간"]}</b></dd></div>}
          </dl>
        </div>
      </div>
      <div className="cs-stage">
        <div className="cs-stage-heading"><h3><i className="cs-live-dot" aria-hidden="true" />지금 이 사업은</h3><div className="cs-dates"><span><b>공사 착공 예정</b>2027.3.</span><span><b>준공 예정</b>2028.10.</span><span><b>과학관 개관</b>2028.12.</span></div></div>
        <div className="cs-stage-metrics"><ProgressMeter label="전체 사업 진척도" value={progress ?? null} /><ProgressMeter label="누적 예산 집행률" value={execution} note="누적 지출 ÷ 누적 예산 · ~2026년" /></div>
        <ol className="cs-steps" aria-label="사업 추진 단계">
          {steps.map((step, index) => <li key={step} className={index === current ? "is-current" : index < current ? "is-past" : ""} aria-current={index === current ? "step" : undefined}><span>{index < current ? "✓" : index + 1}</span><b>{step}</b><small>{index === current ? "현재 단계" : index < current ? "이전 단계" : "예정"}</small></li>)}
        </ol>
      </div>
    </section>
    </>
  );
}

// 섹션이 화면에 들어오면 한 번만 true가 된다(동작 줄이기 설정이면 처음부터 true).
function useRevealOnce<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible] as const;
}

// visible이 되면 0에서 value까지 숫자를 올려 format으로 표시한다.
function CountUp({ value, visible, format, delay = 0 }: { value: number; visible: boolean; format: (n: number) => string; delay?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setShown(value); return; }
    let frame = 0;
    const timer = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1200);
        setShown(value * (1 - Math.pow(1 - t, 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay);
    return () => { window.clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [visible, value, delay]);
  return <>{format(Math.round(shown))}</>;
}

export function ChildrenScienceBudgetSummary({ budget, spent, carryover, carryoverType }: { budget: ProjectBudget; spent: number | null; carryover?: number | null; carryoverType?: string }) {
  // 수식형: 누적 편성액 + 2027년 예산액 + 향후 필요 예산액 = 총사업비, 아래에 집행 현황(원형 게이지)
  const spentRate = spent != null && budget.investedThrough2026 > 0 ? Math.round(spent / budget.investedThrough2026 * 100) : null;
  const budget2026 = (source as { card_budget_2026_million_krw?: number | null }).card_budget_2026_million_krw ?? 0;
  const carry = carryover ?? 0;
  const current = (source as { execution_2026_current_budget_million_krw?: number }).execution_2026_current_budget_million_krw ?? budget2026 + carry;
  const executed = (source as { execution_2026_amount_million_krw?: number }).execution_2026_amount_million_krw ?? 0;
  const executedRate = current > 0 ? Math.round(executed / current * 100) : 0;
  const mil = (value: number) => `${value.toLocaleString("ko-KR")}백만원`;
  const terms = [
    { key: "past", label: "누적 편성액", sub: "~2026년", value: budget.investedThrough2026 },
    { key: "next", label: "2027년 예산액", sub: "본예산 요구액", value: budget.budget2027 },
    { key: "future", label: "향후 필요 예산액", sub: "2028년 이후", value: budget.budget2028Plus },
  ];
  const [revealRef, visible] = useRevealOnce<HTMLElement>();
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <>
    <section ref={revealRef} className={`cs-budget cs-budget-eq${visible ? " is-visible" : ""}`} aria-label="총사업비 구성과 집행 현황">
      <div className="cs-eq">
        {terms.map((term, index) => <Fragment key={term.key}>
          {index > 0 && <span className="cs-eq-op" aria-hidden="true">+</span>}
          <div className={`cs-eq-term ${term.key}`} style={{ ["--i" as string]: index }}><p>{term.label}</p><b><CountUp value={term.value} visible={visible} format={won} delay={index * 150} /></b><small>{term.sub}</small></div>
        </Fragment>)}
        <span className="cs-eq-op" aria-hidden="true">=</span>
        <div className="cs-eq-term total" style={{ ["--i" as string]: 3 }}><p>총사업비</p><b><CountUp value={budget.total} visible={visible} format={won} delay={450} /></b><small>&nbsp;</small></div>
      </div>
    </section>
    {current > 0 && <div className={`pd-budget-panel cs-cash-panel${visible ? " is-visible" : ""}`}>
      <div className="pd-budget-panel-heading">
        <div className="pd-section-heading"><span className="pd-section-icon pd-section-icon-budget"><CardSendIcon size={17} strokeWidth={2.1} /><i aria-hidden="true" /></span><div><p className="pd-section-heading-title">예산 집행현황</p></div></div>
        <span className="pd-budget-panel-caption">(단위: 백만원)</span>
      </div>
      <div className="cs-cash">
        {/* 2026년 편성액 구간은 실제 비율(약 3%)보다 넓게(최소 15%) 그려 보이게 한다. 집행 위치는 예산현액 대비 실제 비율 그대로. */}
        <div className="cs-xc" style={{ ["--done" as string]: `${visible ? executedRate : 0}%`, ["--carry" as string]: `${current > 0 ? Math.min(carry / current * 100, 85) : 0}%` }}>
          <div className="cs-xc-row">
            <p><span>이월액</span><b><CountUp value={carry} visible={visible} format={mil} delay={600} /></b></p>
            <p className="end"><span>예산현액</span><b><CountUp value={current} visible={visible} format={mil} delay={700} /></b></p>
          </div>
          <div className="cs-xc-pct"><p className="mark"><span>집행액</span><b><CountUp value={executed} visible={visible} format={mil} delay={800} /><em><CountUp value={executedRate} visible={visible} format={n => `${n}%`} delay={800} /></em></b></p></div>
          <div className="cs-xc-bar" role="img" aria-label={`예산현액 ${mil(current)}(이월액 ${mil(carry)}, 2026년 편성액 ${mil(budget2026)}) 중 집행 ${mil(executed)}, 집행률 ${executedRate}%`}>
            <span className="carry" /><span className="new" /><span className="done" />
          </div>
          <div className="cs-xc-below">
            <p className="end new"><span>2026년 편성액</span><b>{mil(budget2026)}</b></p>
          </div>
        </div>
      </div>
    </div>}
    </>
  );
}
