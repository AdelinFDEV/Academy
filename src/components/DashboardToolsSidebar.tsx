"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Medal, Crosshair, BookA, NotebookPen, ScanEye, Wallet,
  ListOrdered, MessagesSquare, Network, Unlock, Map,
  LayoutGrid, X, GraduationCap, Files, Trophy, Target, PieChart, Award,
} from "lucide-react";

const ICON_MAP = {
  medal: Medal, crosshair: Crosshair, booka: BookA,
  notebookpen: NotebookPen, scaneye: ScanEye, wallet: Wallet,
  listordered: ListOrdered, messagessquare: MessagesSquare,
  network: Network, unlock: Unlock, map: Map,
  graduationcap: GraduationCap, files: Files,
  trophy: Trophy, target: Target, piechart: PieChart, award: Award,
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

  function renderTool(t: ToolItem) {
    const Icon = ICON_MAP[t.icon];
    const isClickable = !t.locked && !t.soon;
    const cls = `dtb-tool${t.locked || t.soon ? " dtb-tool--dim" : ""}`;
    const content = (
      <>
        <div className="dtb-tool-icon">{Icon && <Icon size={15} aria-hidden="true" />}</div>
        <div className="dtb-tool-text">
          <span className="dtb-tool-name">{t.name}</span>
          <span className="dtb-tool-desc">{t.desc}</span>
        </div>
        {t.soon    && <span className="dtb-badge dtb-badge--soon">Pronto</span>}
        {t.locked  && !t.soon && <span className="dtb-badge dtb-badge--premium">PRO</span>}
      </>
    );
    return isClickable ? (
      <Link key={t.name} href={t.href} className={cls} onClick={() => setOpen(false)}>{content}</Link>
    ) : (
      <div key={t.name} className={cls}>{content}</div>
    );
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="dtb-sidebar">
        <div className="dtb-sidebar-header">
          <p className="dtb-sidebar-title">Herramientas</p>
        </div>
        {sections.map((s) => (
          <div key={s.label} className="dtb-section">
            <p className="dtb-section-label">{s.label}</p>
            <div className="dtb-section-tools">
              {s.tools.map((t) => renderTool(t))}
            </div>
          </div>
        ))}
      </aside>

      {/* ── Mobile FAB ── */}
      <button className="dtb-fab" onClick={() => setOpen(true)} aria-label="Ver herramientas">
        <LayoutGrid size={17} aria-hidden="true" />
        <span className="dtb-fab-label">Herramientas</span>
      </button>

      {/* ── Mobile bottom sheet ── */}
      {open && (
        <div className="dtb-overlay" onClick={() => setOpen(false)}>
          <div className="dtb-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="dtb-sheet-handle" />
            <div className="dtb-sheet-head">
              <span className="dtb-sheet-title">Herramientas</span>
              <button className="dtb-sheet-close" onClick={() => setOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="dtb-sheet-body">
              {sections.map((s) => (
                <div key={s.label} className="dtb-section">
                  <p className="dtb-section-label">{s.label}</p>
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
