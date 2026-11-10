"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookA, NotebookPen, Map, LayoutGrid, X, ChevronUp, Trophy, Target, PieChart, Lock, GraduationCap,
  LayoutDashboard, Crown, ArrowRight, UserRound, Award,
} from "lucide-react";
import {
  IconoCursos, IconoDiario, IconoPortfolio, IconoDiccionario, IconoGuias, IconoPrediccion, IconoTrofeo, IconoCertificado,
} from "@/components/IconosAnimados";
import AvatarUsuario from "@/components/AvatarUsuario";

/** Los iconos que usan las secciones del dashboard, y solo esos. */
const ICON_MAP = {
  booka: BookA, notebookpen: NotebookPen, map: Map,
  trophy: Trophy, target: Target, piechart: PieChart, graduationcap: GraduationCap,
  user: UserRound, award: Award,
} as const;

/**
 * Todas las secciones llevan icono animado. Las tres piezas de pago, el mismo
 * que en la barra de arriba: así se reconocen igual en toda la web. «Mi
 * perfil» no lleva icono sino la foto de perfil del usuario (`foto`).
 */
const ICONO_ANIMADO: Partial<Record<keyof typeof ICON_MAP, (p: { size?: number }) => React.ReactNode>> = {
  notebookpen: IconoDiario,
  piechart: IconoPortfolio,
  graduationcap: IconoCursos,
  booka: IconoDiccionario,
  map: IconoGuias,
  target: IconoPrediccion,
  trophy: IconoTrofeo,
  award: IconoCertificado,
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
  user: "#f0f4ff",
  award: "#5ec8c4",
};

export type ToolItem = {
  href: string;
  icon: keyof typeof ICON_MAP;
  name: string;
  desc: string;
  locked: boolean;
  soon: boolean;
  /** Si viene, en vez del icono se pinta la foto de perfil del usuario. */
  foto?: { avatar: string | null; inicial: string };
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

  const sheetRef = useRef<HTMLDivElement>(null);
  const arrastre = useRef<{ y0: number; dy: number } | null>(null);

  // Cierre animado: reproduce la salida y desmonta al terminar. Si ya se está
  // cerrando, no hace nada (antes un segundo toque podía dejarlo a medias).
  const cerrando = useRef(false);
  const close = useCallback(() => {
    if (cerrando.current) return;
    cerrando.current = true;
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
      cerrando.current = false;
    }, 280);
  }, []);

  // Arrastrar el panel hacia abajo para cerrarlo, desde el asa o la cabecera.
  const alEmpezarArrastre = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a")) return;
    arrastre.current = { y0: e.clientY, dy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const alArrastrar = (e: React.PointerEvent) => {
    const a = arrastre.current;
    const sheet = sheetRef.current;
    if (!a || !sheet) return;
    a.dy = Math.max(0, e.clientY - a.y0);
    sheet.style.transition = "none";
    sheet.style.transform = `translateY(${a.dy}px)`;
  };
  const alSoltar = () => {
    const a = arrastre.current;
    const sheet = sheetRef.current;
    arrastre.current = null;
    if (!a || !sheet) return;
    sheet.style.transition = "";
    if (a.dy > 90) {
      close();
    } else {
      sheet.style.transform = "";
    }
  };

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
        <span className={`dtb-tool-icon${t.foto ? " has-foto" : ""}`} aria-hidden="true">
          {t.foto
            ? <AvatarUsuario avatar={t.foto.avatar} inicial={t.foto.inicial} className="dtb-tool-foto" />
            : Animado ? <Animado size={17} /> : Icon && <Icon size={17} strokeWidth={2} />}
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
            <span className="dtb-panel-nombre">Mi dashboard</span>
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
          <Link href="/api/checkout" prefetch={false} className="dtb-premium">
            <span className="dtb-premium-icono" aria-hidden="true"><Crown size={16} /></span>
            <span className="dtb-premium-titulo">Desbloquea el Diario y el Portfolio</span>
            <span className="dtb-premium-cta">
              Hazte Premium <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </span>
          </Link>
        )}
      </aside>

      {/* ── Móvil: una pastilla flotante abajo que abre un panel desde abajo.
             Rehecho el 10-11-2026: antes era una barra a todo el ancho que
             abría un panel a pantalla completa con la X debajo de la barra
             superior (z-index 400), así que se abría pero no se podía cerrar. ── */}
      <button
        type="button"
        className={`dtb-pill${open ? " is-abierta" : ""}`}
        onClick={() => setOpen(true)}
        aria-label="Abrir herramientas"
        aria-expanded={open}
        aria-controls="dtb-hoja"
      >
        <span className="dtb-pill-icon" aria-hidden="true"><LayoutGrid size={15} /></span>
        <span className="dtb-pill-label">Herramientas</span>
        <ChevronUp size={16} strokeWidth={2.5} className="dtb-pill-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div className={`dtb-overlay${closing ? " is-cerrando" : ""}`} onClick={close}>
          <div
            id="dtb-hoja"
            ref={sheetRef}
            className={`dtb-sheet${closing ? " is-cerrando" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label="Herramientas"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="dtb-sheet-agarre"
              onPointerDown={alEmpezarArrastre}
              onPointerMove={alArrastrar}
              onPointerUp={alSoltar}
              onPointerCancel={alSoltar}
            >
              <span className="dtb-sheet-asa" aria-hidden="true" />
              <div className="dtb-sheet-head">
                <span className="dtb-sheet-title">
                  <span className="dtb-pill-icon" aria-hidden="true"><LayoutGrid size={15} /></span>
                  Herramientas
                </span>
                <button type="button" className="dtb-sheet-close" onClick={close} aria-label="Cerrar herramientas">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="dtb-sheet-body">
              <Link
                href="/dashboard"
                className={`dtb-panel dtb-sheet-panel${ruta === "/dashboard" ? " is-activa" : ""}`}
                onClick={close}
                aria-current={ruta === "/dashboard" ? "page" : undefined}
              >
                <span className="dtb-panel-icon" aria-hidden="true"><LayoutDashboard size={17} /></span>
                <span className="dtb-panel-texto">
                  <span className="dtb-panel-nombre">Mi dashboard</span>
                  <span className="dtb-panel-sub">Tu progreso y lo guardado</span>
                </span>
              </Link>

              {sections.map((s) => (
                <div key={s.label} className="dtb-sheet-seccion">
                  <span className="dtb-section-label">{s.label}</span>
                  <div className="dtb-sheet-rejilla">
                    {s.tools.map((t) => renderTool(t))}
                  </div>
                </div>
              ))}

              {hayBloqueadas && (
                <Link href="/api/checkout" prefetch={false} className="dtb-premium dtb-sheet-premium" onClick={close}>
                  <span className="dtb-premium-icono" aria-hidden="true"><Crown size={16} /></span>
                  <span className="dtb-premium-titulo">Desbloquea el Diario y el Portfolio</span>
                  <span className="dtb-premium-cta">
                    Hazte Premium <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
