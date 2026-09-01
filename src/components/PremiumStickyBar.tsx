"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Crown } from "lucide-react";

export default function PremiumStickyBar({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* Sentinela invisible: en cuanto sale de vista, mostramos la barra */}
      <div ref={sentinelRef} className="prem-sticky-sentinel" aria-hidden="true" />

      <AnimatePresence>
        {visible && (
          <motion.div
            className="prem-sticky-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="prem-sticky-inner">
              <div className="prem-sticky-info">
                <Crown size={16} className="prem-sticky-icon" aria-hidden="true" />
                <span className="prem-sticky-text">
                  <strong>Premium</strong>
                  <span className="prem-sticky-price">49,99€/mes</span>
                </span>
              </div>
              <Link href="/api/checkout" prefetch={false} className="prem-sticky-cta">
                {isLoggedIn ? "Desbloquear todo" : "Empezar ahora"} <ArrowRight size={15} strokeWidth={2.5} aria-hidden="true" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
