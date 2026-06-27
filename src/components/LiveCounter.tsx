"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";

function randomOnline() {
  return Math.floor(Math.random() * (98 - 21 + 1)) + 21;
}

export default function LiveCounter() {
  const [online, setOnline] = useState(42);

  useEffect(() => {
    setOnline(randomOnline());
    const id = setInterval(() => setOnline(randomOnline()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="live-counter">
      {/* Desktop: icono + texto completo */}
      <div className="live-counter-item live-counter-desktop">
        <Users size={12} aria-hidden="true" />
        <span><strong>102</strong> alumnos</span>
      </div>
      <div className="live-counter-divider live-counter-desktop" />
      <div className="live-counter-item live-counter-online live-counter-desktop">
        <span className="live-dot" />
        <span><strong>{online}</strong> online</span>
      </div>

      {/* Móvil: minimalista — icono+102 · dot+número */}
      <div className="live-counter-mobile">
        <span className="live-counter-mobile-users">
          <Users size={13} aria-hidden="true" />
          <strong>102</strong>
        </span>
        <span className="live-counter-mobile-sep" />
        <span className="live-counter-mobile-online">
          <span className="live-dot" />
          <strong>{online}</strong>
        </span>
      </div>
    </div>
  );
}
