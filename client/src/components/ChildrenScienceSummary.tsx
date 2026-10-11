import type { ProjectBudget } from "../lib/projectBudget";
import { PROJECT_RENEWAL, isRenewedProject, type RenewalConfig } from "../data/projectRenewal";
import { Fragment, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CardSendIcon } from "./icons/solar";
import "./ChildrenScienceSummary.css";

export const CHILDREN_SCIENCE_ID = "총괄데이터_5.xlsx:문화예술과:6";
export { isRenewedProject, PROJECT_RENEWAL };

// 리뉴얼 상세 화면이 쓰는 사업 필드(Home의 Project에서 필요한 것만).
export type RenewalProject = {
  id: string;
  project_name: string;
  current_stage?: string | null;
  progress_rate?: number | null;
  region?: string | null;
  contact?: string | null;
  district?: string | null;
  town?: string | null;
  overview?: string | null;
  rendering_images?: string[] | null;
  rendering_image_types?: string[] | null;
  card_execution_amount_million_krw?: number | null;
  card_execution_budget_million_krw?: number | null;
  card_execution_rate?: number | null;
};

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

// 사진(조감도 우선) · 사업 개요 · 지금 이 사업은(진척도·집행률·성격별 단계·핵심 날짜)
export function ChildrenScienceSummary({ project, total }: { project: RenewalProject; total: number }) {
  const config: RenewalConfig | undefined = PROJECT_RENEWAL[project.id];
  const summaryRef = useRef<HTMLElement>(null);
  const [titleContainer, setTitleContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setTitleContainer(summaryRef.current?.closest(".pd-detail-page")?.querySelector<HTMLElement>(".pd-detail-title-block") ?? null);
  }, []);
  if (!config) return null;
  const images = project.rendering_images ?? [];
  const types = project.rendering_image_types ?? [];
  const birdIndex = types.findIndex((type) => type === "조감도");
  const imageIndex = config.imageIndex ?? (birdIndex >= 0 ? birdIndex : images.length ? 0 : -1);
  const image = imageIndex >= 0 ? images[imageIndex] : undefined;
  const imageType = imageIndex >= 0 ? types[imageIndex] || "사진" : "";
  const progress = project.progress_rate ?? null;
  const execution = project.card_execution_amount_million_krw != null && project.card_execution_budget_million_krw
    ? Math.round(project.card_execution_amount_million_krw / project.card_execution_budget_million_krw * 100)
    : project.card_execution_rate ?? null;
  const location = [project.contact, project.district, project.town].filter(Boolean).join(" · ");
  const fields = overviewFields(project.overview);
  // "사업량"으로 적힌 사업(도로 등)은 규모로 본다.
  if (!fields["사업규모"] && fields["사업량"]) fields["사업규모"] = fields["사업량"];
  // 사업규모 칸이 없고 사업내용이 면적·층수 같은 규모 설명이면 규모 줄로 옮긴다(제목 아래 한 줄은 짧은 소개만).
  if (!fields["사업규모"] && /㎡|층/.test(fields["사업내용"] ?? "")) {
    fields["사업규모"] = fields["사업내용"];
    delete fields["사업내용"];
  }
  const { steps, current, dates } = config;
  return (
    <>
    {titleContainer && createPortal(<h1 className="cs-project-title">{config.title ?? project.project_name}</h1>, titleContainer)}
    <section ref={summaryRef} className={`cs-summary${image ? "" : " no-image"}`} aria-label={`${project.project_name} 한눈에 보기`}>
      <div className="cs-intro">
        {image && <figure><img src={image} alt={`${project.project_name} ${imageType}`} /><figcaption>{config.imageCaption ?? (imageType === "조감도" ? "완공 후 모습 · 조감도(계획)" : imageType)}</figcaption></figure>}
        <div className="cs-overview">
          <p className="cs-overview-eyebrow"><span>사업 개요</span><span className="cs-overview-basis">자료 기준 2026.9.</span></p>
          {fields["사업내용"] && <p className="cs-overview-lead">{fields["사업내용"]}</p>}
          <dl className="cs-overview-list">
            <div><dt>총사업비</dt><dd><b className="is-accent">{config.totalUndecided || !(total > 0) ? "미정" : won(total)}</b>{config.totalUndecided && <span>{config.totalUndecided}</span>}</dd></div>
            {fields["사업위치"] && <div><dt>위치</dt><dd><b>{fields["사업위치"]}</b>{location && <span>{location}</span>}</dd></div>}
            {fields["사업규모"] && <div><dt>규모</dt><dd><b>{fields["사업규모"].replace(/,?\s*주차대수\s*[:：]?\s*[^,]*/, "")}</b></dd></div>}
            {fields["사업기간"] && <div><dt>기간</dt><dd><b>{fields["사업기간"]}</b></dd></div>}
          </dl>
        </div>
      </div>
      <div className="cs-stage">
        <div className="cs-stage-heading"><h3><i className="cs-live-dot" aria-hidden="true" />지금 이 사업은 {steps[current] && <strong>{steps[current]}</strong>}</h3>{dates.length > 0 && <div className="cs-dates">{dates.map((date) => <span key={date.label}><b>{date.label}</b>{date.value}</span>)}</div>}</div>
        <div className="cs-stage-metrics"><ProgressMeter label="전체 사업 진척도" value={progress} />{execution != null && <ProgressMeter label="누적 예산 집행률" value={execution} note="누적 지출 ÷ 누적 예산 · ~2026년" />}</div>
        <ol className="cs-steps" aria-label="사업 추진 단계" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
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

export function ChildrenScienceBudgetSummary({ projectId, budget }: { projectId: string; budget: ProjectBudget }) {
  // 수식형: 누적 편성액 + 2027년 예산액 + 향후 필요 예산액 = 총사업비, 아래에 예산 집행현황(2026년 예산현액 기준)
  const exec = PROJECT_RENEWAL[projectId]?.execution2026;
  const budget2026 = exec?.budget2026 ?? 0;
  const carry = exec?.carryover ?? 0;
  const current = budget2026 + carry;
  const executed = exec?.executed ?? 0;
  const executedRate = current > 0 ? Math.round(executed / current * 100) : 0;
  const mil = (value: number) => `${value.toLocaleString("ko-KR")}백만원`;
  // 이월과 2026년 편성이 둘 다 있을 때만 막대를 두 구간으로 나눈다(편성 구간은 보이게 최소 15%).
  const carryPct = carry > 0 && budget2026 > 0 ? Math.min(carry / current * 100, 85) : carry > 0 ? 100 : 0;
  const terms = [
    { key: "past", label: "누적 편성액", sub: "~2026년", value: budget.investedThrough2026 },
    { key: "next", label: "2027년 예산액", sub: "본예산 요구액", value: budget.budget2027 },
    { key: "future", label: "향후 필요 예산액", sub: "2028년 이후", value: budget.budget2028Plus },
  ];
  const [revealRef, visible] = useRevealOnce<HTMLDivElement>();
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div ref={revealRef} className="cs-budget-wrap">
    {budget.total > 0 && !PROJECT_RENEWAL[projectId]?.totalUndecided && <section className={`cs-budget cs-budget-eq${visible ? " is-visible" : ""}`} aria-label="총사업비 구성과 집행 현황">
      <div className="cs-eq">
        {terms.map((term, index) => <Fragment key={term.key}>
          {index > 0 && <span className="cs-eq-op" aria-hidden="true">+</span>}
          <div className={`cs-eq-term ${term.key}`} style={{ ["--i" as string]: index }}><p>{term.label}</p><b><CountUp value={term.value} visible={visible} format={won} delay={index * 150} /></b><small>{term.sub}</small></div>
        </Fragment>)}
        <span className="cs-eq-op" aria-hidden="true">=</span>
        <div className="cs-eq-term total" style={{ ["--i" as string]: 3 }}><p>총사업비</p><b><CountUp value={budget.total} visible={visible} format={won} delay={450} /></b><small>&nbsp;</small></div>
      </div>
    </section>}
    {current > 0 && <div className={`pd-budget-panel cs-cash-panel${visible ? " is-visible" : ""}`}>
      <div className="pd-budget-panel-heading">
        <div className="pd-section-heading"><span className="pd-section-icon pd-section-icon-budget"><CardSendIcon size={17} strokeWidth={2.1} /><i aria-hidden="true" /></span><div><p className="pd-section-heading-title">예산 집행현황</p></div></div>
        <span className="pd-budget-panel-caption">(단위: 백만원)</span>
      </div>
      <div className="cs-cash">
        {/* 2026년 편성액 구간은 실제 비율(약 3%)보다 넓게(최소 15%) 그려 보이게 한다. 집행 위치는 예산현액 대비 실제 비율 그대로. */}
        <div className="cs-xc" style={{ ["--done" as string]: `${visible ? executedRate : 0}%`, ["--carry" as string]: `${carryPct}%` }}>
          <div className="cs-xc-row">
            {carry > 0
              ? <p><span>이월액{exec?.carryoverType ? ` · ${exec.carryoverType}` : ""}</span><b><CountUp value={carry} visible={visible} format={mil} delay={600} /></b></p>
              : <p><span>2026년 편성액</span><b><CountUp value={budget2026} visible={visible} format={mil} delay={600} /></b></p>}
            <p className="end"><span>예산현액</span><b><CountUp value={current} visible={visible} format={mil} delay={700} /></b></p>
          </div>
          <div className="cs-xc-pct"><p className={`mark${executedRate > 60 ? " is-late" : ""}`}><span>집행액</span><b><CountUp value={executed} visible={visible} format={mil} delay={800} /><em><CountUp value={executedRate} visible={visible} format={n => `${n}%`} delay={800} /></em></b></p></div>
          <div className="cs-xc-bar" role="img" aria-label={`예산현액 ${mil(current)}(이월액 ${mil(carry)}, 2026년 편성액 ${mil(budget2026)}) 중 집행 ${mil(executed)}, 집행률 ${executedRate}%`}>
            <span className="carry" />{carryPct < 100 && <span className="new" />}<span className="done" />
          </div>
          {carry > 0 && budget2026 > 0 && <div className="cs-xc-below">
            <p className="end new"><span>2026년 편성액</span><b>{mil(budget2026)}</b></p>
          </div>}
        </div>
      </div>
    </div>}
    </div>
  );
}
