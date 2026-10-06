"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Gamepad2, HelpCircle, Calculator, type LucideIcon } from "lucide-react";

/**
 * Piezas compartidas por todos los bloques del aula: el marco de tarjeta, el
 * «¿está a la vista?» que dispara las animaciones y los formatos de número.
 */

export type Clase = "grafico" | "juego" | "pregunta" | "calculadora";

const CLASES: Record<Clase, { icono: LucideIcon; etiqueta: string }> = {
  grafico: { icono: BarChart3, etiqueta: "Gráfico" },
  juego: { icono: Gamepad2, etiqueta: "Minijuego" },
  pregunta: { icono: HelpCircle, etiqueta: "Comprueba" },
  calculadora: { icono: Calculator, etiqueta: "Calculadora" },
};

export function Marco({
  clase,
  titulo,
  subtitulo,
  children,
}: {
  clase: Clase;
  titulo?: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  const { icono: Icono, etiqueta } = CLASES[clase];
  return (
    <motion.section
      className={`aula-bloque aula-bloque--${clase}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <header className="aula-bloque-head">
        <span className="aula-bloque-kicker">
          <Icono size={13} strokeWidth={2.2} aria-hidden="true" />
          {etiqueta}
        </span>
        {titulo && <h3 className="aula-bloque-titulo">{titulo}</h3>}
        {subtitulo && <p className="aula-bloque-sub">{subtitulo}</p>}
      </header>
      {children}
    </motion.section>
  );
}

/** `true` en cuanto el elemento entra en pantalla, y ya no vuelve a `false`. */
export function useEnVista<T extends Element>() {
  const ref = useRef<T>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visto) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "-40px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visto]);
  return { ref, visto };
}

export type Formato = "eur" | "pct" | "num";

export function formatear(valor: number, formato: Formato = "num"): string {
  if (formato === "eur") {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: valor % 1 ? 2 : 0 }).format(valor);
  }
  if (formato === "pct") return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(valor)} %`;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 8 }).format(valor);
}

/**
 * Baraja SIEMPRE igual para la misma semilla. Con `Math.random` el servidor y
 * el navegador pintarían órdenes distintos y React se quejaría al hidratar.
 */
export function barajarFijo<T>(lista: T[], semilla: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) h = Math.imul(h ^ semilla.charCodeAt(i), 16777619);
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const j = h % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Recuadro que ve el admin cuando un bloque está mal escrito. El alumno no lo ve. */
export function BloqueRoto({ bloque, motivo, esAdmin }: { bloque: string; motivo: string; esAdmin: boolean }) {
  if (!esAdmin) return null;
  return (
    <div className="aula-bloque-roto" role="alert">
      <strong>Bloque «{bloque}» no se puede pintar.</strong> {motivo}
      <span> (Solo lo ves tú, como admin.)</span>
    </div>
  );
}
