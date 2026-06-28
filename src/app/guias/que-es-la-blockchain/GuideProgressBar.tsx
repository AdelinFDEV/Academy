"use client";
import { useEffect, useState } from "react";

export default function GuideProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? Math.round((scrolled / total) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="gbc-progress" aria-hidden="true">
      <div className="gbc-progress-fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
