"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/admin/objetivos", emoji: "🎯", texto: "Objetivos", detalle: "Qué quieres conseguir" },
  { href: "/admin/objetivos/calendario", emoji: "🗓️", texto: "Calendario", detalle: "Qué publicas y cuándo" },
  { href: "/admin/objetivos/ideas", emoji: "💡", texto: "Ideas", detalle: "Lo que aún no tiene día" },
  { href: "/admin/objetivos/diario", emoji: "📓", texto: "Diario", detalle: "Cómo te sientes" },
  { href: "/admin/objetivos/crecimiento", emoji: "📈", texto: "Crecimiento", detalle: "Canales y dinero" },
];

export default function PestanasObjetivos() {
  const ruta = usePathname();
  return (
    <nav className="obj-pestanas" aria-label="Secciones de objetivos">
      {PESTANAS.map((p) => {
        const activa = p.href === "/admin/objetivos" ? ruta === p.href : ruta.startsWith(p.href);
        return (
          <Link
            key={p.href}
            href={p.href}
            className={`obj-pestana${activa ? " obj-pestana--activa" : ""}`}
            aria-current={activa ? "page" : undefined}
          >
            <span className="obj-pestana-emoji" aria-hidden="true">{p.emoji}</span>
            <span className="obj-pestana-textos">
              <span className="obj-pestana-texto">{p.texto}</span>
              <span className="obj-pestana-detalle">{p.detalle}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
