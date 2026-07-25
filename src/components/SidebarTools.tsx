"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  NotebookPen, Crosshair, ScanEye, Medal, Wallet,
  Unlock, Shield, Radar, PieChart,
} from "lucide-react";
import ToolAccessModal, { type ToolModalReason } from "@/components/ToolAccessModal";

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

  const tools: ToolDef[] = [
    { label: "Diario de Trading", href: "/dashboard", Icon: NotebookPen, requiresLogin: true, requiresPremium: true },
    { label: "Predicción de Precio", href: "/calculadora", Icon: Crosshair, requiresLogin: true, requiresPremium: false },
    { label: "Mi Watchlist", href: "/dashboard/watchlist", Icon: ScanEye, requiresLogin: true, requiresPremium: false },
    { label: "Logros y XP", href: "/logros", Icon: Medal, requiresLogin: true, requiresPremium: false },
    { label: "Portfolio Spot", href: "/portfolio", Icon: Wallet, requiresLogin: true, requiresPremium: true },
    { label: "Liberaciones de Tokens", href: "/herramientas/liberaciones", Icon: Unlock, requiresLogin: true, requiresPremium: true },
    { label: "Radar Diario", href: "/herramientas/radar", Icon: Radar, requiresLogin: true, requiresPremium: true },
    { label: "Mi Portfolio", href: "/dashboard/mi-portfolio", Icon: PieChart, requiresLogin: true, requiresPremium: true },
    { label: "Calculadora de Riesgo", href: "/dashboard/calculadora-riesgo", Icon: Shield, requiresLogin: true, requiresPremium: false },
  ];

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
