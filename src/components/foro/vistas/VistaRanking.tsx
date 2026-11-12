import Link from "next/link";
import { Award, BadgeCheck, HandHeart, Trophy } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import MarcoForo from "@/components/foro/MarcoForo";
import { NIVELES } from "@/lib/foro/limites";
import type { FilaRanking, RankingForo } from "@/lib/foro/tipos";
import "@/app/foro/ranking.css";

/**
 * El ranking del foro (FORO.md §10.4): quién ayuda más.
 *
 * Arriba, el podio del mes: es el que motiva, porque se reinicia cada día 1 y
 * alguien nuevo puede ganarlo. Debajo, las tres tablas de siempre. Ninguna
 * fila enlaza a ningún sitio: en el foro no hay perfiles.
 */

const Foto = ({ f, className }: { f: FilaRanking; className: string }) => (
  <AvatarUsuario avatar={f.avatar} inicial={f.alias.slice(0, 1).toUpperCase()} className={className} />
);

function Tabla({ titulo, nota, filas, Icono }: { titulo: string; nota: string; filas: FilaRanking[]; Icono: typeof Trophy }) {
  return (
    <section className="fr-tabla fo-tarjeta" aria-label={titulo}>
      <header>
        <span className="fr-tabla-icono" aria-hidden="true"><Icono size={17} strokeWidth={2.2} /></span>
        <div>
          <h3>{titulo}</h3>
          <p>{nota}</p>
        </div>
      </header>
      {filas.length === 0 ? (
        <p className="fr-vacio">Todavía no hay nadie aquí.</p>
      ) : (
        <ol>
          {filas.slice(0, 10).map((f) => (
            <li key={f.posicion} className={f.posicion <= 3 ? "es-podio" : undefined}>
              <span className="fr-puesto">{f.posicion}</span>
              <Foto f={f} className="fr-foto" />
              <span className="fr-quien">
                <b>{f.alias}</b>
                <small>{f.nivel}</small>
              </span>
              <span className="fr-cifra">{f.cifra}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function VistaRanking({ ranking: r, conSesion }: { ranking: RankingForo; conSesion: boolean }) {
  const [primero, segundo, tercero] = r.puntosDelMes;
  // En el podio el primero va en el centro: segundo, primero, tercero.
  const podio = [segundo, primero, tercero].filter((f): f is FilaRanking => Boolean(f));
  const resto = r.puntosDelMes.slice(3, 10);

  return (
    <MarcoForo conSesion={conSesion} acento="#e6b455">
      <nav className="fo-migas" aria-label="Estás en">
        <Link href="/foro">Foro</Link>
      </nav>

      <header className="fr-cabecera">
        <span className="fo-antetitulo">
          <span className="fo-antetitulo-punto" aria-hidden="true" />
          Ranking
        </span>
        <h1 className="fo-titulo">Quién <em>ayuda</em> más.</h1>
        <p className="fo-entradilla">
          Los puntos se ganan cuando eligen tu respuesta y cuando otros la valoran, no por publicar mucho.
        </p>
      </header>

      {/* ── 01 · El mes ── */}
      <section className="fr-mes" aria-labelledby="fr-mes-titulo">
        <div className="fo-seccion-cab">
          <span className="fo-seccion-num">01</span>
          <h2 id="fr-mes-titulo" className="fo-seccion-titulo">Este mes</h2>
          <span className="fo-seccion-nota">Se reinicia el día 1.</span>
        </div>

        {podio.length === 0 ? (
          <div className="fo-vacio">
            <b>El mes acaba de empezar</b>
            <p>Responde a una pregunta y estrena el podio.</p>
          </div>
        ) : (
          <div className="fr-mes-rejilla">
            <ol className="fr-podio">
              {podio.map((f) => (
                <li key={f.posicion} className={`fr-escalon fr-escalon--${f.posicion}`}>
                  <Foto f={f} className="fr-podio-foto" />
                  <b className="fr-podio-alias">{f.alias}</b>
                  <small>{f.nivel}</small>
                  <span className="fr-peana">
                    <span className="fr-peana-puesto">{f.posicion}</span>
                    <span className="fr-peana-puntos">{f.cifra}<small> pts</small></span>
                  </span>
                </li>
              ))}
            </ol>

            {resto.length > 0 && (
              <ol className="fr-resto fo-tarjeta">
                {resto.map((f) => (
                  <li key={f.posicion}>
                    <span className="fr-puesto">{f.posicion}</span>
                    <Foto f={f} className="fr-foto" />
                    <span className="fr-quien">
                      <b>{f.alias}</b>
                      <small>{f.nivel}</small>
                    </span>
                    <span className="fr-cifra">{f.cifra}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>

      {/* ── 02 · Siempre ── */}
      <section aria-labelledby="fr-siempre-titulo">
        <div className="fo-seccion-cab">
          <span className="fo-seccion-num">02</span>
          <h2 id="fr-siempre-titulo" className="fo-seccion-titulo">De siempre</h2>
          <span className="fo-seccion-nota">El histórico, para el reconocimiento.</span>
        </div>
        <div className="fr-rejilla">
          <Tabla titulo="Más puntos" nota="Los de toda la vida" filas={r.puntosDeSiempre} Icono={Trophy} />
          <Tabla titulo="Respuestas elegidas" nota="Las que resolvieron la duda" filas={r.ganadoras} Icono={BadgeCheck} />
          <Tabla titulo="Gracias recibidas" nota="En las preguntas que hicieron" filas={r.gracias} Icono={HandHeart} />
        </div>
      </section>

      {/* ── 03 · Niveles ── */}
      <section className="fr-niveles" aria-labelledby="fr-niveles-titulo">
        <div className="fo-seccion-cab">
          <span className="fo-seccion-num">03</span>
          <h2 id="fr-niveles-titulo" className="fo-seccion-titulo">Niveles</h2>
        </div>
        <ol className="fr-escala fo-tarjeta">
          {[...NIVELES].reverse().map((n) => (
            <li key={n.nombre}>
              <Award size={18} strokeWidth={2.1} aria-hidden="true" />
              <b>{n.nombre}</b>
              <span>desde {n.desde} puntos</span>
            </li>
          ))}
        </ol>
        <p className="fr-nota">
          El nivel se ve junto a tu alias y no da ventajas: es un reconocimiento. Si prefieres no aparecer en el
          ranking, puedes pedirlo desde <Link href="/foro/mio">lo tuyo en el foro</Link>; seguirás ganando puntos.
        </p>
      </section>
    </MarcoForo>
  );
}
