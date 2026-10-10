"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/Icon";

const links = [
  { href: "/admin",                      label: "Panel",       icon: "bar-chart" as const, priority: true },
  { href: "/admin/users",                label: "Usuarios",    icon: "users" as const,     priority: true },
  { href: "/admin/premium",              label: "Premium",     icon: "crown" as const,     priority: true },
  { href: "/admin/comunidad",            label: "Canal free",  icon: "globe" as const,     priority: true },
  { href: "/admin/objetivos",            label: "Objetivos",   icon: "target" as const,    priority: true },
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
          className={`admin-nav-link${l.priority ? " admin-nav-link--priority" : ""}${isActive(l.href) ? " active" : ""}`}
        >
          <Icon name={l.icon} size={16} />
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );
}
