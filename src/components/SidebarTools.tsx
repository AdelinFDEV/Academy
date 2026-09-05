"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
// Los iconos ya no se eligen aquí: cada herramienta trae el suyo del catálogo.
import ToolAccessModal, { type ToolModalReason } from "@/components/ToolAccessModal";
import { HERRAMIENTAS, destinoPorRuta, sinSalida } from "@/lib/herramientas";

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
  /** No hay ficha pública ni acceso: pulsar no lleva a ninguna parte. */
  bloqueada: boolean;
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
  const tools: ToolDef[] = HERRAMIENTAS.map((h) => {
    const ruta = h.premiumHref ?? h.href ?? "/herramientas";
    return {
      label: h.label,
      // El destino ya viene resuelto para quien mira: la herramienta si tiene
      // acceso, y si no su ficha pública. Antes el enlace apuntaba siempre a la
      // herramienta y el clic se interceptaba con un modal, así que a las
      // fichas no llegaba nadie desde aquí.
      href: destinoPorRuta(ruta, { logueado: isLoggedIn, premium: isPremium }),
      Icon: h.icon,
      requiresLogin: h.acceso === "cuenta" || h.acceso === "premium",
      requiresPremium: h.acceso === "premium",
      soon: h.acceso === "proximamente",
      // Con ficha pública no hay callejón sin salida que avisar.
      bloqueada: sinSalida(h, { logueado: isLoggedIn, premium: isPremium }),
    };
  });

  function handleToolClick(tool: ToolDef, e: React.MouseEvent) {
    // El modal solo tiene sentido cuando de verdad no hay a dónde ir. Si la
    // herramienta tiene ficha, el enlace ya lleva allí y cortarlo sería peor.
    if (!tool.bloqueada) return;
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

  // Apagar el enlace dice "no puedes pasar". Con ficha pública sí se puede,
  // así que solo se apaga lo que de verdad no lleva a ningún sitio.
  const isLocked = (tool: ToolDef) => tool.bloqueada;

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
