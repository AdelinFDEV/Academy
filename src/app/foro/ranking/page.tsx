import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AvatarUsuario from "@/components/AvatarUsuario";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { ranking } from "@/lib/foro/datos/ranking";
import { NIVELES } from "@/lib/foro/limites";
import { entradaAlForo } from "@/lib/foro/permisos";
import type { FilaRanking } from "@/lib/foro/tipos";
import "../ranking.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { modo } = await entradaAlForo();
  return {
    title: "Ranking del foro",
    description: "Quién ayuda más en el foro: puntos del mes, respuestas elegidas y gracias recibidas.",
    alternates: { canonical: "/foro/ranking" },
    robots: modo === "abierto" ? undefined : { index: false, follow: false },
  };
}

/** Una tabla del ranking. Sin enlaces: en el foro no hay perfiles (FORO.md §10.4). */
function Tabla({ titulo, nota, filas, unidad }: { titulo: string; nota: string; filas: FilaRanking[]; unidad: string }) {
  return (
    <section className="fr-tabla" aria-label={titulo}>
      <header>
        <h2>{titulo}</h2>
        <p>{nota}</p>
      </header>
      {filas.length === 0 ? (
        <p className="fr-vacio">Todavía no hay nadie aquí.</p>
      ) : (
        <ol>
          {filas.map((f) => (
            <li key={f.posicion} className={f.posicion <= 3 ? "es-podio" : undefined}>
              <span className="fr-puesto">{f.posicion}</span>
              <AvatarUsuario avatar={f.avatar} inicial={f.alias.slice(0, 1).toUpperCase()} className="fr-foto" />
              <span className="fr-quien">
                <b>{f.alias}</b>
                <small>{f.nivel}</small>
              </span>
              <span className="fr-cifra">
                {f.cifra} <small>{unidad}</small>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function RankingPage() {
  const { visible, usuarioId } = await entradaAlForo();
  if (!visible) notFound();
  const r = await ranking();

  return (
    <div className="blog-page">
      <SiteNav user={usuarioId !== null} />

      <main className="blog-main fo-main fr-main">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Foro</Link>
        </nav>

        <header className="fo-cabecera">
          <h1 className="fo-titulo">Ranking del foro</h1>
          <p className="fo-entradilla">
            Quién ayuda más. Los puntos se ganan sobre todo cuando eligen tu respuesta y cuando otros la valoran, no
            por publicar mucho.
          </p>
        </header>

        <div className="fr-rejilla">
          <Tabla titulo="Este mes" nota="Se reinicia el día 1." filas={r.puntosDelMes} unidad="pts" />
          <Tabla titulo="Siempre" nota="Los puntos de toda la vida." filas={r.puntosDeSiempre} unidad="pts" />
          <Tabla titulo="Respuestas elegidas" nota="Las que resolvieron la duda." filas={r.ganadoras} unidad="" />
          <Tabla titulo="Gracias recibidas" nota="En las preguntas que hicieron." filas={r.gracias} unidad="" />
        </div>

        <section className="fr-niveles" aria-label="Niveles">
          <h2>Niveles</h2>
          <ul>
            {[...NIVELES].reverse().map((n) => (
              <li key={n.nombre}>
                <b>{n.nombre}</b> desde {n.desde} puntos
              </li>
            ))}
          </ul>
          <p>
            El nivel se ve junto a tu alias y no da ventajas: es un reconocimiento. Si prefieres no aparecer en el
            ranking, puedes pedirlo desde <Link href="/foro/mio">lo tuyo en el foro</Link>; seguirás ganando puntos.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
