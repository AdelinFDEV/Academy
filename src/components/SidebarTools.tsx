"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import {
  NotebookPen, Crosshair, ScanEye, Medal, Wallet,
  Unlock, ListOrdered, MessagesSquare, Network,
} from "lucide-react";
import ToolAccessModal, { type ToolModalReason } from "@/components/ToolAccessModal";

interface Props {
  isLoggedIn: boolean;
  isPremium: boolean;
}

interface ToolDef {
  label: string;
  href: string;
  icon: React.ReactNode;
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
    {
      label: "Diario de Trading",
      href: "/dashboard",
      icon: <NotebookPen size={16} className="sidebar-tool-icon" />,
      requiresLogin: true,
      requiresPremium: true,
    },
    {
      label: "Predicción de Precio",
      href: "/calculadora",
      icon: <Crosshair size={16} className="sidebar-tool-icon" />,
      requiresLogin: true,
      requiresPremium: false,
    },
    {
      label: "Mi Watchlist",
      href: "/dashboard/watchlist",
      icon: <ScanEye size={16} className="sidebar-tool-icon" />,
      requiresLogin: true,
      requiresPremium: false,
    },
    {
      label: "Logros y XP",
      href: "/logros",
      icon: <Medal size={16} className="sidebar-tool-icon" />,
      requiresLogin: true,
      requiresPremium: false,
    },
    {
      label: "Portfolio Spot",
      href: "/portfolio",
      icon: <Wallet size={16} className="sidebar-tool-icon" />,
      requiresLogin: true,
      requiresPremium: true,
    },
    {
      label: "Liberaciones de Tokens",
      href: "/herramientas/liberaciones",
      icon: <Unlock size={16} className="sidebar-tool-icon" />,
      requiresLogin: true,
      requiresPremium: true,
    },
  ];

  const soonTools = [
    { label: "Ranking",  icon: <ListOrdered size={16} className="sidebar-tool-icon" /> },
    { label: "Chat",     icon: <MessagesSquare size={16} className="sidebar-tool-icon" /> },
    { label: "Foro",     icon: <Network size={16} className="sidebar-tool-icon" /> },
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
              className={`sidebar-tool-link${isLocked(tool) ? " sidebar-tool-link--dimmed" : ""}`}
              onClick={(e) => handleToolClick(tool, e)}
            >
              {tool.icon}
              <span>{tool.label}</span>
              {getBadge(tool)}
            </Link>
          ))}

          {soonTools.map((tool) => (
            <div key={tool.label} className="sidebar-tool-link sidebar-tool-link--soon">
              {tool.icon}
              <span>{tool.label}</span>
              <span className="sidebar-tool-badge--soon">Pronto</span>
            </div>
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
