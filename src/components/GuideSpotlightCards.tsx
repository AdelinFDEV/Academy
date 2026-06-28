"use client";

import { MouseEvent, useRef, useState } from "react";

interface GuideSpotlightCardsProps {
  uses: {
    icon: string;
    title: string;
    desc: string;
    ex: string;
  }[];
}

export default function GuideSpotlightCards({ uses }: GuideSpotlightCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div 
      className="gbc-use-grid spotlight-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        "--mouse-x": `${mousePosition.x}px`,
        "--mouse-y": `${mousePosition.y}px`,
      } as React.CSSProperties}
    >
      {uses.map((u) => (
        <div key={u.title} className="gbc-use-c spotlight-card">
          <div className="spotlight-overlay" style={{ opacity: isHovering ? 1 : 0 }} />
          <div className="spotlight-content">
            <div className="gbc-use-icon">{u.icon}</div>
            <div className="gbc-use-t">{u.title}</div>
            <div className="gbc-use-d">{u.desc}</div>
            <div className="gbc-use-ex">Ejemplos: {u.ex}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
