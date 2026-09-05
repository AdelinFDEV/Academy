"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
// Los iconos ya no se eligen aquí: cada herramienta trae el suyo del catálogo.
import ToolAccessModal, { type ToolModalReason } from "@/components/ToolAccessModal";
import { HERRAMIENTAS } from "@/lib/herramientas";

interface Props {
  isLoggedIn: boolean;
  isPremium: boolean;
}

interface ToolDef {
  label: string;
  href: string;
  Icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  requiresLogin: boolean;
  requiresPremium: boolean;
  soon?: boolean;
}

export default function SidebarTools({ isLoggedIn, isPremium }: Props) {
  const [modal, setModal] = useState<{ open: boolean; reason: ToolModalReason; toolName: string }>({
    open: false,
    reason: "login",
    toolName: "",
  });

  const closeModal = useCallback(() => setModal((m) => ({ ...m, open: false })), []);

  /**
   * La lista SALE DEL CATÁLOGO, no se escribe aquí.
   *
   * Antes eran dos listas a mano y discrepaban: al sidebar le faltaba el
   * trading en directo y al catálogo le faltaban Mi Portfolio y Logros, así
   * que la web decía ocho herramientas en un sitio y nueve en otro. Ahora hay
   * una sola fuente y el número cuadra solo.
   *
   * El acceso también sale de ahí: cuando la calculadora se abrió al público,
   * esta lista siguió pidiendo registro con su copia propia y nadie podía
   * llegar a la página, que sí estaba liberada.
   */
  const tools: ToolDef[] = HERRAMIENTAS.map((h) => ({
    label: h.label,
    // Los atajos llevan a la herramienta en sí; el destino público lo decide
    // `destinoPorRuta` al pulsar, según quién esté mirando.
    href: h.premiumHref ?? h.href ?? "/herramientas",
    Icon: h.icon,
    requiresLogin: h.acceso === "cuenta" || h.acceso === "premium",
    requiresPremium: h.acceso === "premium",
    soon: h.acceso === "proximamente",
  }));

  function handleToolClick(tool: ToolDef, e: React.MouseEvent) {
    if (!isLoggedIn && tool.requiresLogin) {
      e.preventDefault();
      setModal({ open: true, reason: "login", toolName: tool.label });
      return;
    }
    if (isLoggedIn && tool.requiresPremium && !isPremium) {
      e.preventDefault();
      setModal({ open: true, reason: "premium", toolName: tool.label });
    }
  }

  function getBadge(tool: ToolDef) {
    if (tool.requiresPremium) return <span className="sidebar-tool-badge--premium">PREMIUM</span>;
    if (!isLoggedIn) return <span className="sidebar-tool-badge--free">GRATIS</span>;
    return null;
  }

  function isLocked(tool: ToolDef) {
    if (!isLoggedIn && tool.requiresLogin) return true;
    if (isLoggedIn && tool.requiresPremium && !isPremium) return true;
    return false;
  }

  return (
    <>
      <div className="sidebar-card sidebar-card--tools">
        <p className="sidebar-card-title">Herramientas</p>
        <div className="sidebar-tools-list">
          {tools.map((tool) => (
            <Link
              key={tool.label}
              href={tool.href}
              className={`sidebar-tool-link${tool.requiresPremium ? " sidebar-tool-link--premium" : ""}${isLocked(tool) ? " sidebar-tool-link--dimmed" : ""}`}
              onClick={(e) => handleToolClick(tool, e)}
            >
              <tool.Icon size={16} className="sidebar-tool-icon" />
              <span className="sidebar-tool-label">{tool.label}</span>
              {getBadge(tool)}
            </Link>
          ))}
        </div>
      </div>

      <ToolAccessModal
        open={modal.open}
        reason={modal.reason}
        toolName={modal.toolName}
        onClose={closeModal}
      />
    </>
  );
}
