"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookA, NotebookPen, Map, LayoutGrid, X, ChevronUp, Trophy, Target, PieChart, Lock, GraduationCap,
  LayoutDashboard, Crown, ArrowRight,
} from "lucide-react";
import { IconoCursos, IconoDiario, IconoPortfolio } from "@/components/IconosAnimados";

/** Los iconos que usan las secciones del dashboard, y solo esos. */
const ICON_MAP = {
  booka: BookA, notebookpen: NotebookPen, map: Map,
  trophy: Trophy, target: Target, piechart: PieChart, graduationcap: GraduationCap,
} as const;

/**
 * Las tres piezas de pago llevan el mismo icono animado que en la barra de
 * arriba: así se reconocen igual en toda la web.
 */
const ICONO_ANIMADO: Partial<Record<keyof typeof ICON_MAP, (p: { size?: number }) => React.ReactNode>> = {
  notebookpen: IconoDiario,
  piechart: IconoPortfolio,
  graduationcap: IconoCursos,
};

/**
 * El color de cada herramienta: el de su pieza en el catálogo
 * (`@/lib/herramientas`) para las que están allí; Diccionario y Guías, que no
 * son herramientas, llevan el suyo.
 */
const COLOR: Record<keyof typeof ICON_MAP, string> = {
  booka: "#a5b4fc",
  map: "#e6b455",
  graduationcap: "#e6b455",
  notebookpen: "#ff9a4d",
  piechart: "#4f9dff",
  target: "#22d3ee",
  trophy: "#fbbf24",
};

export type ToolItem = {
  href: string;
  icon: keyof typeof ICON_MAP;
  name: string;
  desc: string;
  locked: boolean;
  soon: boolean;
};

export type ToolSection = {
  label: string;
  tools: ToolItem[];
};

export default function DashboardToolsSidebar({ sections }: { sections: ToolSection[] }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const ruta = usePathname() ?? "";
  // Si algo está bloqueado, el usuario no es Premium: es lo que decide si se
  // enseña la tarjeta de abajo, sin pedirle a la página un prop más.
  const hayBloqueadas = sections.some((s) => s.tools.some((t) => t.locked));

  // Cierre animado: reproduce la salida y desmonta al terminar.
  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 260);
  }, []);

  // Con el sheet abierto: bloquea el scroll del fondo y permite cerrar con Escape.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  /**
   * Una fila del rail.
   *
   * Sin descripción: en una columna de 264 px el texto se cortaba a media frase
   * («¿Qué Market Cap necesita tu tok…»), que informa menos que no ponerlo y
   * hace la lista el doble de alta. El nombre y el icono bastan para reconocer
   * una herramienta que ya conoces, que es para lo que sirve un menú.
   */
  function renderTool(t: ToolItem) {
    const Icon = ICON_MAP[t.icon];
    const isClickable = !t.locked && !t.soon;
    // El activo sale de la ruta, no de un prop: así ninguna página tiene que
    // acordarse de decir en cuál está.
    const activa = ruta === t.href || (t.href !== "/dashboard" && ruta.startsWith(t.href + "/"));
    const cls = [
      "dtb-tool",
      activa ? "is-activa" : "",
      t.locked || t.soon ? "dtb-tool--dim" : "",
    ].filter(Boolean).join(" ");

    const Animado = ICONO_ANIMADO[t.icon];
    const content = (
      <>
        <span className="dtb-tool-icon" aria-hidden="true">
          {Animado ? <Animado size={17} /> : Icon && <Icon size={17} strokeWidth={2} />}
        </span>
        <span className="dtb-tool-name">{t.name}</span>
        {t.soon && <span className="dtb-badge dtb-badge--soon">Pronto</span>}
        {t.locked && !t.soon && (
          <span className="dtb-badge dtb-badge--premium" title="Incluida en Premium">
            <Lock size={10} strokeWidth={2.6} aria-hidden="true" />
          </span>
        )}
      </>
    );
    return isClickable ? (
      <Link
        key={t.name}
        href={t.href}
        className={cls}
        style={{ "--dtb-c": COLOR[t.icon] } as React.CSSProperties}
        onClick={close}
        aria-current={activa ? "page" : undefined}
      >
        {content}
      </Link>
    ) : (
      <div key={t.name} className={cls} style={{ "--dtb-c": COLOR[t.icon] } as React.CSSProperties}>{content}</div>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="dtb-sidebar" aria-label="Herramientas">
        {/* Rehecho el 04-11-2026: arriba la vuelta al panel, después las dos
            secciones con su etiqueta corta, y abajo, solo a quien tiene algo
            bloqueado, la tarjeta de Premium. */}
        <Link
          href="/dashboard"
          className={`dtb-panel${ruta === "/dashboard" ? " is-activa" : ""}`}
          aria-current={ruta === "/dashboard" ? "page" : undefined}
        >
          <span className="dtb-panel-icon" aria-hidden="true"><LayoutDashboard size={17} /></span>
          <span className="dtb-panel-texto">
            <span className="dtb-panel-nombre">Mi panel</span>
            <span className="dtb-panel-sub">Tu progreso y lo guardado</span>
          </span>
        </Link>

        {sections.map((s) => (
          <div key={s.label} className="dtb-section">
            <span className="dtb-section-label">{s.label}</span>
            <div className="dtb-section-tools">
              {s.tools.map((t) => renderTool(t))}
            </div>
          </div>
        ))}

        {hayBloqueadas && (
          <Link href="/premium" className="dtb-premium">
            <span className="dtb-premium-icono" aria-hidden="true"><Crown size={16} /></span>
            <span className="dtb-premium-titulo">Desbloquea el Diario y el Portfolio</span>
            <span className="dtb-premium-cta">
              Hazte Premium <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </span>
          </Link>
        )}
      </aside>

      {/* ── Barra inferior en móvil: sólida y pegada al borde del dispositivo,
             no flotante. La flecha indica que despliega hacia arriba. ── */}
      <button
        className="dtb-dock"
        onClick={() => setOpen(true)}
        aria-label="Ver herramientas"
        aria-expanded={open}
      >
        <span className="dtb-dock-icon" aria-hidden="true">
          <LayoutGrid size={16} />
        </span>
        <span className="dtb-dock-label">Herramientas</span>
        <span className="dtb-dock-chevron" aria-hidden="true">
          <ChevronUp size={18} strokeWidth={2.5} />
        </span>
      </button>

      {/* ── Panel a pantalla completa ── */}
      {open && (
        <div className={`dtb-overlay${closing ? " dtb-overlay--closing" : ""}`} onClick={close}>
          <div className={`dtb-sheet${closing ? " dtb-sheet--closing" : ""}`} onClick={(e) => e.stopPropagation()}>
            <div className="dtb-sheet-head">
              <span className="dtb-sheet-title">
                <LayoutGrid size={16} aria-hidden="true" />
                Herramientas
              </span>
              <button className="dtb-sheet-close" onClick={close} aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>
            <div className="dtb-sheet-body">
              {sections.map((s) => (
                <div key={s.label} className="dtb-section">
                  <div className="dtb-section-tools">
                    {s.tools.map((t) => renderTool(t))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
