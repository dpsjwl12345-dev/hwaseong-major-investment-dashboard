"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DEFAULT_WORDS = ["better", "modern", "beautiful", "awesome"];
export interface ContainerTextFlipProps {
  words?: string[];
  interval?: number;
  className?: string;
  textClassName?: string;
  animationDuration?: number;
}

// Uses the project's existing Framer Motion installation, the same animation
// engine as motion/react. No provider or additional dependency is required.
export function ContainerTextFlip({ words = DEFAULT_WORDS, interval = 3000, className, textClassName, animationDuration = 700 }: ContainerTextFlipProps) {
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const preference=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setReducedMotion(preference.matches);
    preference.addEventListener("change",update);update();
    return ()=>preference.removeEventListener("change",update);
  },[]);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number>();
  const [textElement, setTextElement] = useState<HTMLDivElement | null>(null);
  const safeWords = words.length ? words : DEFAULT_WORDS;
  const current = reducedMotion ? safeWords.join(" ") : safeWords[index % safeWords.length];

  useEffect(() => {
    if (reducedMotion || safeWords.length < 2) return;
    const timer = window.setInterval(() => setIndex(i => (i + 1) % safeWords.length), Math.max(interval, animationDuration + 200));
    return () => window.clearInterval(timer);
  }, [safeWords.length, interval, animationDuration, reducedMotion]);

  useLayoutEffect(() => {
    const element = textElement;
    if (!element) return;
    let disposed = false;
    const measure = () => {
      if (!disposed) setWidth(Math.ceil(element.scrollWidth) + 32);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    document.fonts.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, [textElement]);

  return <motion.div
    className={cn("relative inline-flex max-w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-gray-100 to-gray-200 px-4 py-2 text-center text-4xl font-bold text-black dark:from-gray-700 dark:to-gray-800 dark:text-white", className)}
    animate={{ width }} transition={{ duration: reducedMotion ? 0 : animationDuration / 2000 }}
    data-text-flip="" data-current-word={current}
  >
    <span className="sr-only">{safeWords.join(" ")}</span>
    <AnimatePresence mode="wait">
      <motion.div key={current} ref={setTextElement} aria-hidden="true"
        className={cn("inline-flex shrink-0 whitespace-pre", textClassName)}
        initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
        transition={{ duration: reducedMotion ? 0 : animationDuration / 2200, ease: "easeInOut" }}>
        {Array.from(current).map((letter, i) => <motion.span key={i}
          initial={reducedMotion ? false : { opacity: 0, filter: "blur(5px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: reducedMotion ? 0 : .3, delay: reducedMotion ? 0 : i * .025 }}>
          {letter === " " ? "\u00a0" : letter}
        </motion.span>)}
      </motion.div>
    </AnimatePresence>
  </motion.div>;
}
