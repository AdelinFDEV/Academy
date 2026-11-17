import Link from "next/link";
import { BookA, NotebookPen, Map, Trophy, Target, PieChart, Lock, GraduationCap, UserRound, Award } from "lucide-react";
import {
  IconoCursos, IconoDiario, IconoPortfolio, IconoDiccionario, IconoGuias, IconoPrediccion, IconoTrofeo, IconoCertificado,
} from "@/components/IconosAnimados";
import AvatarUsuario from "@/components/AvatarUsuario";

/**
 * El índice del panel: todo lo del usuario en fichas de color, como las
 * pestañas de un cuaderno (estilo «Cuaderno de estudio», 17-11-2026).
 *
 * Sustituye al rail fijo de la izquierda y a la pastilla flotante del móvil:
 * el admin no quiere nada anclado al hacer scroll, así que el índice va con la
 * página, debajo del saludo. En el móvil cada grupo se desliza en horizontal.
 * Cada ficha lleva el color de su sección (ESTILO.md). Las de Premium, sin
 * Premium, salen apagadas con su chip, pero siguen siendo un enlace: llevan a
 * la ficha de la herramienta, que explica qué es y cómo conseguirla.
 */

const ICONOS = {
  booka: BookA, notebookpen: NotebookPen, map: Map,
  trophy: Trophy, target: Target, piechart: PieChart, graduationcap: GraduationCap,
  user: UserRound, award: Award,
} as const;

/** Las piezas con icono animado llevan el mismo que en la barra de arriba. */
const ANIMADO: Partial<Record<keyof typeof ICONOS, (p: { size?: number }) => React.ReactNode>> = {
  notebookpen: IconoDiario,
  piechart: IconoPortfolio,
  graduationcap: IconoCursos,
  booka: IconoDiccionario,
  map: IconoGuias,
  target: IconoPrediccion,
  trophy: IconoTrofeo,
  award: IconoCertificado,
};

/** El color de cada sección: Diccionario y logros amarillo, Guías cielo, Cursos lila, Diario azul, Portfolio menta. */
const TONO: Record<keyof typeof ICONOS, string> = {
  booka: "amarillo",
  map: "cielo",
  graduationcap: "lila",
  award: "lila",
  notebookpen: "azul",
  piechart: "menta",
  target: "naranja",
  trophy: "amarillo",
  user: "papel",
};

export type ToolItem = {
  href: string;
  icon: keyof typeof ICONOS;
  name: string;
  desc: string;
  locked: boolean;
  soon: boolean;
  /** Si viene, en vez del icono se pinta la foto de perfil del usuario. */
  foto?: { avatar: string | null; inicial: string };
};

export type ToolSection = {
  label: string;
  tools: ToolItem[];
};

function Ficha({ t }: { t: ToolItem }) {
  const Icono = ICONOS[t.icon];
  const Animado = ANIMADO[t.icon];
  const enlace = !t.soon;
  const contenido = (
    <>
      <span className={`ix-icono${t.foto ? " has-foto" : ""}`} aria-hidden="true">
        {t.foto
          ? <AvatarUsuario avatar={t.foto.avatar} inicial={t.foto.inicial} className="ix-foto" />
          : Animado ? <Animado size={20} /> : <Icono size={20} strokeWidth={2.2} />}
      </span>
      <span className="ix-texto">
        <span className="ix-nombre">{t.name}</span>
        <span className="ix-desc">{t.desc}</span>
      </span>
      {t.soon && <span className="ix-chip">Pronto</span>}
      {t.locked && !t.soon && (
        <span className="ix-chip ix-chip--premium"><Lock size={11} strokeWidth={2.8} aria-hidden="true" /> Premium</span>
      )}
    </>
  );
  const cls = `ix-ficha tono-${TONO[t.icon]}${t.locked || t.soon ? " is-bloqueada" : ""}`;
  return enlace
    ? <Link href={t.href} className={cls}>{contenido}</Link>
    : <div className={cls} aria-disabled="true">{contenido}</div>;
}

export default function IndicePanel({ sections }: { sections: ToolSection[] }) {
  return (
    <nav className="ix" aria-labelledby="ix-titulo">
      <header className="ix-cab">
        <h2 id="ix-titulo" className="pn-h2">Tu cuaderno</h2>
        <p className="pn-mano">todo lo tuyo, a un toque</p>
      </header>
      {sections.map((s) => (
        <section key={s.label} className="ix-grupo" aria-label={s.label}>
          <h3 className="ix-grupo-titulo">{s.label}</h3>
          <ul className="ix-lista">
            {s.tools.map((t) => <li key={t.name}><Ficha t={t} /></li>)}
          </ul>
        </section>
      ))}
    </nav>
  );
}
