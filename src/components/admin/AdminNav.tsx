"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const links = [
  { href: "/admin",                      label: "Panel",       icon: "bar-chart" as const },
  { href: "/admin/posts",                label: "Entradas",    icon: "list" as const },
  { href: "/admin/categories",           label: "Categorías",  icon: "folder" as const },
  { href: "/admin/comments",             label: "Comentarios", icon: "chat" as const },
  { href: "/admin/users",                label: "Usuarios",    icon: "users" as const },
  { href: "/admin/guias-instrucciones",        label: "Guías · Ref",        icon: "book" as const },
  { href: "/admin/liberaciones-instrucciones", label: "Liberaciones · Ref", icon: "list" as const },
];

export default function AdminNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav className="admin-nav">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`admin-nav-link${isActive(l.href) ? " active" : ""}`}
        >
          <Icon name={l.icon} size={16} />
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
