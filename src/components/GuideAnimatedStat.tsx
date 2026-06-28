"use client";

import { useEffect, useRef, useState } from "react";

interface GuideAnimatedStatProps {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  label: string;
  source?: string;
}

export default function GuideAnimatedStat({
  end,
  prefix = "",
  suffix = "",
  duration = 2000,
  decimals = 0,
  label,
  source
}: GuideAnimatedStatProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setValue(end * easeProgress);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration]);

  const displayValue = value.toFixed(decimals);

  return (
    <div className="gbc-stat-c" ref={ref}>
      <div className="gbc-stat-num">
        {prefix}{displayValue}{suffix}
      </div>
      <div className="gbc-stat-lbl">{label}</div>
      {source && <div className="gbc-stat-src">{source}</div>}
    </div>
  );
}
