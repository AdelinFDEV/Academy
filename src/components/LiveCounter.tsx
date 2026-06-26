"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";

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
        <User size={12} aria-hidden="true" />
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
