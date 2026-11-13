"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import Icon from "@/components/Icon";

/** Cada sección, su color: el mismo que lleva su página por dentro (`--sec`). */
const links = [
  { href: "/admin", label: "Analítica", nota: "Tráfico, usuarios y Premium", icon: "bar-chart" as const, color: "naranja" },
  { href: "/admin/acciones", label: "Acciones", nota: "Borradores por publicar", icon: "check-circle" as const, color: "rosa" },
  { href: "/admin/foro", label: "Foro", nota: "Moderación y reportes", icon: "chat" as const, color: "violeta" },
  { href: "/admin/guias-instrucciones", label: "Guías", nota: "Cómo se hace una guía", icon: "book" as const, color: "turquesa" },
  { href: "/admin/seo-instrucciones", label: "SEO", nota: "Cómo aparecer en Google", icon: "search" as const, color: "azul" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const activo = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav className="admin-nav" aria-label="Secciones del panel">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`admin-nav-link${activo(l.href) ? " active" : ""}`}
          aria-current={activo(l.href) ? "page" : undefined}
          style={{ "--c": `var(--c-${l.color})`, "--c-rgb": `var(--c-${l.color}-rgb)` } as CSSProperties}
        >
          <span className="admin-nav-icono"><Icon name={l.icon} size={17} /></span>
          <span className="admin-nav-textos">
            {l.label}
            <small>{l.nota}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}
