"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import Icon from "@/components/Icon";
import { sonar } from "@/lib/sonidos";

/**
 * Las pestañas del cuaderno del admin. Cada sección, su color (ESTILO.md): el
 * mismo que lleva su página por dentro (`--sec`). Analítica en naranja de
 * marca, Acciones en menta (publicar), Foro en coral, Guías en cielo y SEO en
 * azul.
 */
const links = [
  { href: "/admin", label: "Analítica", nota: "Tráfico, usuarios y Premium", icon: "bar-chart" as const, color: "naranja" },
  { href: "/admin/acciones", label: "Acciones", nota: "Borradores por publicar", icon: "check-circle" as const, color: "menta" },
  { href: "/admin/foro", label: "Foro", nota: "Moderación y reportes", icon: "chat" as const, color: "coral" },
  { href: "/admin/guias-instrucciones", label: "Guías", nota: "Cómo se hace una guía", icon: "book" as const, color: "cielo" },
  { href: "/admin/seo-instrucciones", label: "SEO", nota: "Cómo aparecer en Google", icon: "search" as const, color: "azul" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const activo = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <nav className="ad-nav" aria-label="Secciones del panel">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`ad-nav-enlace${activo(l.href) ? " is-activo" : ""}`}
          aria-current={activo(l.href) ? "page" : undefined}
          aria-label={l.label}
          onPointerDown={() => sonar("tecla")}
          style={{
            "--c": `var(--${l.color})`,
            "--c-o": `var(--${l.color}-o)`,
            "--c-s": `var(--${l.color}-s)`,
            // Sobre menta y cielo, el icono va en tinta: el blanco no se lee.
            "--c-t": l.color === "menta" || l.color === "cielo" ? "var(--tinta)" : "#fff",
          } as CSSProperties}
        >
          <span className="ad-nav-icono"><Icon name={l.icon} size={18} /></span>
          <span className="ad-nav-textos">
            {l.label}
            <small>{l.nota}</small>
          </span>
        </Link>
      ))}
    </nav>
  );
}
