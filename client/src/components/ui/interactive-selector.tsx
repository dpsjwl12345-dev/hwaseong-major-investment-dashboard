import React, { useEffect, useState } from "react";

export type InteractiveSelectorOption = {
  title: string;
  description?: string;
  image: string;
  icon?: React.ReactNode;
};

type InteractiveSelectorProps = {
  options: InteractiveSelectorOption[];
  /** 이미 펼쳐진 패널을 다시 누르면 호출(예: 확대 보기). */
  onActiveClick?: (index: number) => void;
  className?: string;
};

// 이미지 여러 장을 가로로 나열하고, 누른 패널만 크게 펼쳐 보여주는 선택기.
// 원본(21st.dev)은 Next 전용 <style jsx>와 react-icons를 썼으나, 이 프로젝트(Vite + Tailwind)에 맞게
// 일반 <style>·props 기반으로 바꾸고 아이콘은 호출하는 쪽에서 받는다.
export function InteractiveSelector({ options, onActiveClick, className = "" }: InteractiveSelectorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animatedOptions, setAnimatedOptions] = useState<number[]>([]);

  const handleOptionClick = (index: number) => {
    if (index !== activeIndex) setActiveIndex(index);
    else onActiveClick?.(index);
  };

  useEffect(() => {
    const timers = options.map((_, i) => setTimeout(() => setAnimatedOptions((prev) => [...prev, i]), 180 * i));
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [options.length]);

  return (
    <div className={`interactive-selector flex h-[320px] w-full items-stretch overflow-hidden md:h-[420px] ${className}`}>
      {options.map((option, index) => {
        const isActive = activeIndex === index;
        const isShown = animatedOptions.includes(index);
        return (
          <button
            type="button"
            key={option.image}
            aria-label={option.title}
            aria-pressed={isActive}
            onClick={() => handleOptionClick(index)}
            className="relative flex flex-col justify-end overflow-hidden text-left transition-all duration-700 ease-in-out"
            style={{
              backgroundImage: `url('${option.image}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: isActive ? "contain" : "cover",
              backgroundPosition: "center",
              backgroundColor: "#18181b",
              opacity: isShown ? 1 : 0,
              transform: isShown ? "translateX(0)" : "translateX(-60px)",
              minWidth: 60,
              border: `2px solid ${isActive ? "#fff" : "#292929"}`,
              boxShadow: isActive ? "0 20px 60px rgba(0,0,0,.5)" : "0 10px 30px rgba(0,0,0,.3)",
              flex: isActive ? "7 1 0%" : "1 1 0%",
              zIndex: isActive ? 10 : 1,
              cursor: "pointer",
              willChange: "flex-grow, box-shadow, background-size",
            }}
          >
            <div
              className="pointer-events-none absolute left-0 right-0 transition-all duration-700 ease-in-out"
              style={{
                bottom: isActive ? 0 : -40,
                height: 120,
                boxShadow: isActive ? "inset 0 -120px 120px -120px #000, inset 0 -120px 120px -80px #000" : "inset 0 -120px 0 -120px #000, inset 0 -120px 0 -80px #000",
              }}
            />
            <div className="pointer-events-none absolute bottom-5 left-0 right-0 z-[2] flex h-12 w-full items-center justify-start gap-3 px-4">
              {option.icon && (
                <div className="flex h-[44px] min-w-[44px] max-w-[44px] flex-none items-center justify-center rounded-full border-2 border-[#444] bg-[rgba(32,32,32,.85)] shadow-[0_1px_4px_rgba(0,0,0,.18)] backdrop-blur-[10px]">
                  {option.icon}
                </div>
              )}
              <div className="relative whitespace-pre text-white">
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
