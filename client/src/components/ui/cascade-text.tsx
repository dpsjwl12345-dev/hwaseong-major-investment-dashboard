"use client";

import React, { useEffect, useMemo, useState, type ElementType, type CSSProperties } from "react";

export interface TextRevealProps {
  text: string;
  as?: ElementType;
  href?: string;
  target?: string;
  className?: string;
  style?: CSSProperties;
  fontSize?: string;
  staggerDelay?: number;
  duration?: number;
  easing?: string;
  color?: string;
  hoverColor?: string;
  direction?: "up" | "down";
  autoPlay?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const TextReveal = React.memo(function TextReveal({
  text,
  as: Component = "a",
  href,
  target,
  className = "",
  style,
  fontSize = "3rem",
  staggerDelay = 25,
  duration = 250,
  easing = "ease-in-out",
  color = "inherit",
  hoverColor = "#b2c73a",
  direction = "up",
  autoPlay = false,
  onClick,
}: TextRevealProps) {
  const [automatic, setAutomatic] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [tapped, setTapped] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const chars = useMemo(() => {
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
      return Array.from(segmenter.segment(text), (s) => s.segment);
    }
    return Array.from(text);
  }, [text]);

  useEffect(() => {
    if (!autoPlay || reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const timers: number[] = [];
    // Wait for the wordmark font so the first transition uses its final metrics.
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      timers.push(window.setTimeout(() => {
        setAutomatic(true);
        timers.push(window.setTimeout(() => setAutomatic(false), duration + Math.max(0, chars.length - 1) * staggerDelay + 350));
      }, 300));
    });
    return () => { cancelled = true; timers.forEach(window.clearTimeout); setAutomatic(false); };
  }, [autoPlay, reducedMotion, duration, staggerDelay, chars.length]);

  const sign = direction === "up" ? 1 : -1;
  const active = automatic || hovered || focused || tapped;
  const rootProps: Record<string, unknown> = {
    className: `cascade-text inline-block relative no-underline font-extrabold uppercase tracking-tight overflow-hidden cursor-pointer select-none ${className}`.trim(),
    style: {
      fontSize,
      color: active ? hoverColor : color,
      transition: reducedMotion ? "none" : "color 0.35s ease",
      padding: "0.15em 0.4em",
      lineHeight: 1,
      ...style,
    },
    onMouseEnter: () => { if (window.matchMedia("(hover: hover)").matches) setHovered(true); },
    onMouseLeave: () => setHovered(false),
    onFocus: () => setFocused(true),
    onBlur: () => { setFocused(false); setTapped(false); },
    onClick: (event: React.MouseEvent) => {
      if (event.detail > 0 && window.matchMedia("(hover: none)").matches) {
        setFocused(false);
        setTapped((value) => !value);
      }
      onClick?.(event);
    },
    "aria-label": text,
  };
  if (Component === "button") rootProps.type = "button";
  if (Component === "a") {
    rootProps.href = href ?? "#";
    if (target) rootProps.target = target;
    if (target === "_blank") rootProps.rel = "noopener noreferrer";
  }

  return (
    <Component {...rootProps}>
      <span className="inline-flex overflow-hidden relative" style={{ height: "1em", color: "inherit" }} aria-hidden="true">
        {chars.map((char, i) => (
          <span key={i} className="inline-block relative will-change-transform" style={{
            color: "inherit",
            textShadow: `0 ${sign}em currentColor`,
            transition: reducedMotion ? "none" : `transform ${duration}ms ${easing}`,
            transitionDelay: reducedMotion ? "0ms" : `${i * staggerDelay}ms`,
            transform: active && !reducedMotion ? `translateY(${-sign}em)` : "translateY(0)",
          }}>{char === " " ? "\u00A0" : char}</span>
        ))}
      </span>
    </Component>
  );
});

TextReveal.displayName = "TextReveal";
export { TextReveal };
