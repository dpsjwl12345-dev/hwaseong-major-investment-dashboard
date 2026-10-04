import React, { useEffect, useState } from "react";

export type InteractiveSelectorOption = {
  title: string;
  description?: string;
  image: string;
  icon?: React.ReactNode;
  /** "full": 패널을 이미지로 채움 / "inset": 작은 이미지를 위쪽에 원본 비율로 얹고 나머지는 어두운 바탕. 없으면 이미지 가로 크기로 자동 판단. */
  mode?: "full" | "inset";
};

type InteractiveSelectorProps = {
  options: InteractiveSelectorOption[];
  /** 이미 펼쳐진 패널을 다시 누르면 호출(예: 확대 보기). */
  onActiveClick?: (index: number) => void;
  className?: string;
  /** mode가 없을 때 이 가로 픽셀 미만이면 작은 이미지(inset)로 본다. */
  minFullWidth?: number;
};

// 이미지 여러 장을 가로로 나열하고, 누른 패널만 크게 펼쳐 보여주는 선택기.
// 원본(21st.dev)은 Next 전용 <style jsx>와 react-icons를 썼으나, 이 프로젝트(Vite + Tailwind)에 맞게
// 일반 <style>·props 기반으로 바꾸고 아이콘은 호출하는 쪽에서 받는다.
export function InteractiveSelector({ options, onActiveClick, className = "", minFullWidth = 1000 }: InteractiveSelectorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);
  const [naturalWidths, setNaturalWidths] = useState<Record<string, number>>({});

  // 이미지 원본 가로 크기를 미리 읽어, 작은 이미지는 늘리지 않고 위쪽에 얹어 보여준다.
  useEffect(() => {
    options.forEach((option) => {
      if (option.mode) return;
      const probe = new window.Image();
      probe.onload = () => setNaturalWidths((prev) => ({ ...prev, [option.image]: probe.naturalWidth }));
      probe.src = option.image;
    });
  }, [options]);

  const handleOptionClick = (index: number) => {
    if (index !== activeIndex) setActiveIndex(index);
    else onActiveClick?.(index);
  };

  useEffect(() => {
    const timers = options.map((_, i) => setTimeout(() => setAnimatedOptions((prev) => [...prev, i]), 180 * i));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [options.length]);

  // 가로가 아주 넓은 카드 안에서도 이미지가 늘어나 깨져 보이지 않도록 폭을 제한하고, 높이는 폭에 비례(약 2.2:1)하게 둔다.
  return (
    <div className={`interactive-selector mx-auto flex aspect-[2.2/1] min-h-[260px] w-full max-w-[960px] items-stretch overflow-hidden ${className}`}>
      {options.map((option, index) => {
        const isActive = activeIndex === index;
        const isShown = animatedOptions.includes(index);
        const inset = (option.mode ?? ((naturalWidths[option.image] ?? Infinity) < minFullWidth ? "inset" : "full")) === "inset";
        return (
          <button
            type="button"
            key={option.image}
            aria-label={option.title}
            aria-pressed={isActive}
            onClick={() => handleOptionClick(index)}
            className="relative flex flex-col justify-end overflow-hidden text-left transition-all duration-700 ease-in-out"
            style={{
              ...(inset
                ? { background: "linear-gradient(180deg, var(--pd-surface-raised, #1b2340) 0%, var(--pd-surface-sunken, #0f1424) 100%)" }
                : { backgroundColor: "var(--pd-surface-sunken, #0f1424)" }),
              opacity: isShown ? 1 : 0,
              transform: isShown ? "translateX(0)" : "translateX(-60px)",
              minWidth: 60,
              border: `2px solid ${isActive ? "var(--pd-text-muted, #a8afd1)" : "var(--pd-border, #262e4d)"}`,
              boxShadow: isActive ? "0 20px 60px rgba(0,0,0,.5)" : "0 10px 30px rgba(0,0,0,.3)",
              flex: isActive ? "7 1 0%" : "1 1 0%",
              zIndex: isActive ? 10 : 1,
              cursor: "pointer",
              willChange: "flex-grow, box-shadow, background-size",
            }}
          >
            {inset ? (
              <img src={option.image} alt="" className="pointer-events-none absolute left-0 right-0 top-0 h-[68%] w-full object-contain object-top" />
            ) : (
              <img src={option.image} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center" />
            )}
            <div
              className="pointer-events-none absolute left-0 right-0 transition-all duration-700 ease-in-out"
              style={{
                bottom: isActive ? 0 : -40,
                height: 120,
                boxShadow: isActive ? "inset 0 -120px 120px -120px #0a0e1a, inset 0 -120px 120px -80px #0a0e1a" : "inset 0 -120px 0 -120px #0a0e1a, inset 0 -120px 0 -80px #0a0e1a",
              }}
            />
            <div className="pointer-events-none absolute bottom-5 left-0 right-0 z-[2] flex min-h-12 w-full items-center justify-start gap-3 px-4">
              {option.icon && (
                <div className="flex h-[44px] min-w-[44px] max-w-[44px] flex-none items-center justify-center rounded-full border-2 border-[var(--pd-border)] bg-[rgba(15,20,36,.85)] shadow-[0_1px_4px_rgba(0,0,0,.18)] backdrop-blur-[10px]">
                  {option.icon}
                </div>
              )}
              <div className="relative min-w-0 whitespace-normal pr-2 leading-snug text-white">
                <div className="text-lg font-bold transition-all duration-700 ease-in-out" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateX(0)" : "translateX(25px)" }}>{option.title}</div>
                {option.description && (
                  <div className="text-base text-gray-300 transition-all duration-700 ease-in-out" style={{ opacity: isActive ? 1 : 0, transform: isActive ? "translateX(0)" : "translateX(25px)" }}>{option.description}</div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default InteractiveSelector;
