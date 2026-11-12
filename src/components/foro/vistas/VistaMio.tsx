import Link from "next/link";
import { Award, BadgeCheck, Bell, HandHeart, MessageCircle, PenLine, ShieldAlert, Sparkles } from "lucide-react";
import MarcoForo from "@/components/foro/MarcoForo";
import { fechaCorta } from "@/components/foro/fechas";
import { MarcarLeidos, PreferenciaRanking } from "@/components/foro/participar/AccionesMias";
import { LOGROS_FORO, NIVELES } from "@/lib/foro/limites";
import type { AvisoForo, LoMio } from "@/lib/foro/tipos";
import "@/app/foro/mio.css";

/**
 * Lo del usuario en el foro: su nivel y sus puntos, sus avisos y sus mensajes
 * con su estado. Es personal: la página que lo pinta pide sesión y nunca se
 * cachea ni se indexa.
 */

const NOMBRE_CLASE = { pregunta: "Pregunta", respuesta: "Respuesta", replica: "Réplica" } as const;
const NOMBRE_SANCION: Record<string, string> = { suspension: "Suspensión del foro", expulsion: "Expulsión del foro" };

/** La frase de un aviso. Los de valoraciones van agrupados («5 personas…»). */
function fraseDe(a: AvisoForo): string {
  const n = a.cuantos;
  const personas = n === 1 ? "Una persona" : `${n} personas`;
  switch (a.tipo) {
    case "respuesta": return n === 1 ? "Nueva respuesta en tu pregunta" : `${n} respuestas nuevas en tu pregunta`;
    case "replica": return n === 1 ? "Nueva réplica en un hilo donde participas" : `${n} réplicas nuevas en un hilo donde participas`;
    case "me_gusta": return `${personas} ${n === 1 ? "ha dado" : "han dado"} me gusta a tu mensaje`;
    case "interesante": return `${personas} ${n === 1 ? "ha marcado" : "han marcado"} «Interesante» en tu pregunta`;
    case "gracias": return `${personas} ${n === 1 ? "ha marcado" : "han marcado"} «Gracias» en tu pregunta`;
    case "yo_tambien": return `${personas} ${n === 1 ? "tiene" : "tienen"} tu misma duda`;
    case "ganadora": return "Han elegido tu respuesta";
    case "elige_ganadora": return "Tu pregunta tiene respuestas: ya puedes elegir la que te ha servido";
    case "ganadora_retirada": return "La respuesta que elegiste se ha retirado: puedes elegir otra";
    case "retirado": return "Un mensaje tuyo se ha retirado";
    case "restaurado": return "Un mensaje tuyo vuelve a estar publicado";
    case "sancion": return "Has recibido una sanción en el foro";
    default: return "Tienes una novedad en el foro";
  }
}

/** El tono de un aviso: bueno (verde), de moderación (oro) o neutro. */
const tonoDe = (tipo: string) =>
  tipo === "ganadora" || tipo === "restaurado" ? "bueno" : tipo === "retirado" || tipo === "sancion" || tipo === "ganadora_retirada" ? "aviso" : "neutro";

export default function VistaMio({ mio }: { mio: LoMio }) {
  const logros = LOGROS_FORO.filter((l) => mio.logros.includes(l.id));
  // Cuánto falta para el siguiente nivel: la barra bajo el nivel actual.
  const escala = [...NIVELES].reverse();
  const siguiente = escala.find((n) => n.desde > mio.puntos);
  const actual = [...escala].reverse().find((n) => n.desde <= mio.puntos) ?? escala[0];
  const avance = siguiente ? Math.round(((mio.puntos - actual.desde) / (siguiente.desde - actual.desde)) * 100) : 100;

  return (
    <MarcoForo conSesion>
      <nav className="fo-migas" aria-label="Estás en">
        <Link href="/foro">Foro</Link>
      </nav>

      <header className="fm-cabecera">
        <span className="fo-antetitulo">
          <span className="fo-antetitulo-punto" aria-hidden="true" />
          Lo tuyo
        </span>
        <h1 className="fo-titulo">
          {mio.alias ? <>Hola, <em>{mio.alias}</em>.</> : <>Tu sitio en el <em>foro</em>.</>}
        </h1>
        {!mio.alias && (
          <p className="fo-entradilla">
            Todavía no tienes alias. <Link href="/dashboard/perfil">Elígelo en tu perfil</Link> para poder participar.
          </p>
        )}
      </header>

      {mio.sanciones.map((s, i) => (
        <p key={i} className="fo-aviso" role="status">
          <ShieldAlert size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>
            <b>{NOMBRE_SANCION[s.tipo] ?? "Sanción"}</b>
            {s.hasta && <> hasta el {fechaCorta(s.hasta)}</>}. Motivo: {s.motivo}
          </span>
        </p>
      ))}

      {/* ── Reputación ── */}
      <section className="fm-reputacion" aria-label="Tu reputación">
        <div className="fm-nivel fo-tarjeta">
          <span className="fm-nivel-icono" aria-hidden="true"><Award size={26} strokeWidth={2} /></span>
          <div className="fm-nivel-texto">
            <span className="fm-etiqueta">Tu nivel</span>
            <b>{mio.nivel}</b>
            <div className="fm-barra" role="img" aria-label={siguiente ? `${mio.puntos} de ${siguiente.desde} puntos para ${siguiente.nombre}` : "Nivel máximo"}>
              <span style={{ width: `${Math.max(4, avance)}%` }} />
            </div>
            <small>
              {siguiente ? `${siguiente.desde - mio.puntos} puntos para ${siguiente.nombre}` : "Has llegado al nivel más alto"}
            </small>
          </div>
        </div>

        <dl className="fm-cifras fo-tarjeta">
          <div><dt>Puntos</dt><dd>{mio.puntos}</dd></div>
          <div><dt>Este mes</dt><dd>{mio.puntosDelMes}</dd></div>
          <div>
            <dt><BadgeCheck size={12} strokeWidth={2.4} aria-hidden="true" /> Elegidas</dt>
            <dd>{mio.ganadoras}</dd>
          </div>
          <div>
            <dt><HandHeart size={12} strokeWidth={2.4} aria-hidden="true" /> Gracias</dt>
            <dd>{mio.gracias}</dd>
          </div>
        </dl>
      </section>

      {logros.length > 0 && (
        <ul className="fm-logros" aria-label="Logros del foro">
          {logros.map((l) => (
            <li key={l.id} title={l.ayuda}>
              <Sparkles size={13} strokeWidth={2.3} aria-hidden="true" />
              {l.nombre}
            </li>
          ))}
        </ul>
      )}
      <PreferenciaRanking fuera={mio.fueraDelRanking} />

      <div className="fm-rejilla">
        {/* ── Avisos ── */}
        <section aria-labelledby="fm-avisos">
          <div className="fo-seccion-cab">
            <span className="fo-seccion-num">01</span>
            <h2 id="fm-avisos" className="fo-seccion-titulo">Avisos</h2>
            {mio.sinLeer > 0 && <span className="fm-sin-leer">{mio.sinLeer} sin leer</span>}
            <span className="fm-hueco" />
            <MarcarLeidos hay={mio.sinLeer > 0} />
          </div>

          {mio.avisos.length === 0 ? (
            <div className="fo-vacio">
              <b>No tienes avisos</b>
              <p>Aquí verás quién te responde y quién valora lo tuyo.</p>
            </div>
          ) : (
            <ul className="fm-lista">
              {mio.avisos.map((a) => (
                <li key={a.id} className={`fm-aviso fo-tarjeta is-${tonoDe(a.tipo)}${a.leido ? "" : " es-nuevo"}`}>
                  <span className="fm-aviso-icono" aria-hidden="true"><Bell size={15} strokeWidth={2.2} /></span>
                  <div className="fm-aviso-texto">
                    <span className="fm-linea">
                      {a.hilo ? (
                        <Link href={`/foro/${a.hilo.id}-${a.hilo.slug}${a.respuestaId ? `#r-${a.respuestaId}` : ""}`}>{fraseDe(a)}</Link>
                      ) : (
                        fraseDe(a)
                      )}
                      <time dateTime={a.fecha}>{fechaCorta(a.fecha)}</time>
                    </span>
                    {a.hilo && <small>«{a.hilo.titulo}»</small>}
                    {a.motivo && <small className="fm-motivo">Motivo: {a.motivo}</small>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Mensajes ── */}
        <section aria-labelledby="fm-mensajes">
          <div className="fo-seccion-cab">
            <span className="fo-seccion-num">02</span>
            <h2 id="fm-mensajes" className="fo-seccion-titulo">Tus mensajes</h2>
          </div>

          {mio.mensajes.length === 0 ? (
            <div className="fo-vacio">
              <b>Todavía no has publicado nada</b>
              <p><Link href="/foro/preguntar">Haz tu primera pregunta</Link> o responde a alguien.</p>
            </div>
          ) : (
            <ul className="fm-lista">
              {mio.mensajes.map((m) => (
                <li key={m.respuestaId ?? `p-${m.preguntaId}`} className={`fm-mensaje fo-tarjeta${m.estado === "oculta" ? " es-oculto" : ""}`}>
                  <span className="fm-aviso-icono" aria-hidden="true">
                    {m.clase === "pregunta" ? <PenLine size={15} strokeWidth={2.2} /> : <MessageCircle size={15} strokeWidth={2.2} />}
                  </span>
                  <div className="fm-aviso-texto">
                    <span className="fm-linea">
                      <span>
                        <span className="fm-clase">{NOMBRE_CLASE[m.clase]}</span>{" "}
                        {m.estado === "publicada" ? (
                          <Link href={`/foro/${m.preguntaId}-${m.slug}${m.respuestaId ? `#r-${m.respuestaId}` : ""}`}>{m.titulo}</Link>
                        ) : (
                          m.titulo
                        )}
                      </span>
                      <time dateTime={m.fecha}>{fechaCorta(m.fecha)}</time>
                    </span>
                    <small>{m.extracto}</small>
                    {m.estado === "oculta" && (
                      <small className="fm-motivo">Oculto{m.motivo ? `: ${m.motivo}` : " por moderación"}</small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </MarcoForo>
  );
}
