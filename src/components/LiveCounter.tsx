"use client";

import { useState, useEffect } from "react";

function randomOnline() {
  return Math.floor(Math.random() * (98 - 21 + 1)) + 21;
}

export default function LiveCounter({ total }: { total: number }) {
  const [online, setOnline] = useState(42); // static fallback for SSR

  useEffect(() => {
    setOnline(randomOnline()); // set random value on mount (client-side only)
    const id = setInterval(() => setOnline(randomOnline()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="live-counter">
      <div className="live-counter-item">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 14c0-2.5 2.5-4 6-4s6 1.5 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span><strong>157</strong> alumnos</span>
      </div>
      <div className="live-counter-divider" />
      <div className="live-counter-item live-counter-online">
        <span className="live-dot" />
        <span><strong>{online}</strong> online</span>
      </div>
    </div>
  );
}
