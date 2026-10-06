"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Medal, Crosshair, BookA, NotebookPen, ScanEye, Wallet,
  ListOrdered, MessagesSquare, Network, Unlock, Map,
  LayoutGrid, X, ChevronUp, Radio, Files, Trophy, Target, PieChart, Award, Shield, Radar, Lock, GraduationCap,
} from "lucide-react";

const ICON_MAP = {
  medal: Medal, crosshair: Crosshair, booka: BookA,
  notebookpen: NotebookPen, scaneye: ScanEye, wallet: Wallet,
  listordered: ListOrdered, messagessquare: MessagesSquare,
  network: Network, unlock: Unlock, map: Map,
  radio: Radio, files: Files,
  trophy: Trophy, target: Target, piechart: PieChart, award: Award,
  shield: Shield, radar: Radar, graduationcap: GraduationCap,
} as const;

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

    const content = (
      <>
        <span className="dtb-tool-icon" aria-hidden="true">
          {Icon && <Icon size={16} strokeWidth={1.9} />}
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
        onClick={close}
        aria-current={activa ? "page" : undefined}
      >
        {content}
      </Link>
    ) : (
      <div key={t.name} className={cls}>{content}</div>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="dtb-sidebar" aria-label="Herramientas">
        {/* Ni cabecera ni etiquetas de sección: el usuario ya sabe que está en
            su panel, y "HERRAMIENTAS / EDUCACIÓN" ocupaba tres líneas para no
            decir nada. Los grupos se distinguen por el separador. */}
        {sections.map((s) => (
          <div key={s.label} className="dtb-section">
            <div className="dtb-section-tools">
              {s.tools.map((t) => renderTool(t))}
            </div>
          </div>
        ))}
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
