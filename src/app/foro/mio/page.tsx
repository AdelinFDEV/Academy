import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import { fechaCorta } from "@/components/foro/fechas";
import { MarcarLeidos, PreferenciaRanking } from "@/components/foro/participar/AccionesMias";
import { loMio } from "@/lib/foro/datos/mio";
import { LOGROS_FORO } from "@/lib/foro/limites";
import { entradaAlForo } from "@/lib/foro/permisos";
import type { AvisoForo } from "@/lib/foro/tipos";
import "../mio.css";

// Es personal: nunca desde la caché, y nunca en un buscador.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Lo mío en el foro",
  alternates: { canonical: "/foro/mio" },
  robots: { index: false, follow: false },
};

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

/**
 * Lo del usuario en el foro: su reputación, sus avisos y sus mensajes con su
 * estado. Pide sesión; todo lo que se lee aquí se filtra por el usuario de la
 * sesión, en el servidor.
 */
export default async function MioPage() {
  const { visible, usuarioId } = await entradaAlForo();
  if (!visible) notFound();
  if (!usuarioId) redirect("/login?next=/foro/mio");

  const mio = await loMio(usuarioId);
  const logros = LOGROS_FORO.filter((l) => mio.logros.includes(l.id));

  return (
    <div className="blog-page">
      <SiteNav user />

      <main className="blog-main fo-main fm-main">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Foro</Link>
        </nav>

        <header className="fo-cabecera">
          <h1 className="fo-titulo">Lo mío en el foro</h1>
          {mio.alias ? (
            <p className="fo-entradilla">Firmas como <b>{mio.alias}</b>.</p>
          ) : (
            <p className="fo-entradilla">
              Todavía no tienes alias. <Link href="/dashboard/perfil">Elígelo en tu perfil</Link> para poder participar.
            </p>
          )}
        </header>

        {mio.sanciones.map((s, i) => (
          <p key={i} className="fo-aviso" role="status">
            <b>{NOMBRE_SANCION[s.tipo] ?? "Sanción"}</b>
            {s.hasta && <> hasta el {fechaCorta(s.hasta)}</>}. Motivo: {s.motivo}
          </p>
        ))}

        <section className="fm-seccion" aria-labelledby="fm-reputacion">
          <h2 id="fm-reputacion">Tu reputación</h2>
          <dl className="fm-cifras">
            <div><dt>Nivel</dt><dd>{mio.nivel}</dd></div>
            <div><dt>Puntos</dt><dd>{mio.puntos}</dd></div>
            <div><dt>Este mes</dt><dd>{mio.puntosDelMes}</dd></div>
            <div><dt>Respuestas elegidas</dt><dd>{mio.ganadoras}</dd></div>
            <div><dt>Gracias recibidas</dt><dd>{mio.gracias}</dd></div>
          </dl>
          {logros.length > 0 && (
            <ul className="fm-logros" aria-label="Logros del foro">
              {logros.map((l) => <li key={l.id} title={l.ayuda}>{l.nombre}</li>)}
            </ul>
          )}
          <PreferenciaRanking fuera={mio.fueraDelRanking} />
        </section>

        <section className="fm-seccion" aria-labelledby="fm-avisos">
          <div className="fp-fila fp-fila--entre">
            <h2 id="fm-avisos">
              Avisos {mio.sinLeer > 0 && <span className="fm-cuenta">{mio.sinLeer} sin leer</span>}
            </h2>
            <MarcarLeidos hay={mio.sinLeer > 0} />
          </div>
          {mio.avisos.length === 0 ? (
            <p className="fm-vacio">No tienes avisos.</p>
          ) : (
            <ul className="fm-lista">
              {mio.avisos.map((a) => (
                <li key={a.id} className={a.leido ? undefined : "es-nuevo"}>
                  <span className="fm-linea">
                    {a.hilo ? (
                      <Link href={`/foro/${a.hilo.id}-${a.hilo.slug}${a.respuestaId ? `#r-${a.respuestaId}` : ""}`}>{fraseDe(a)}</Link>
                    ) : (
                      fraseDe(a)
                    )}
                    <time dateTime={a.fecha}>{fechaCorta(a.fecha)}</time>
                  </span>
                  {a.hilo && <small>«{a.hilo.titulo}»</small>}
                  {a.motivo && <small>Motivo: {a.motivo}</small>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="fm-seccion" aria-labelledby="fm-mensajes">
          <h2 id="fm-mensajes">Tus mensajes</h2>
          {mio.mensajes.length === 0 ? (
            <p className="fm-vacio">Todavía no has publicado nada.</p>
          ) : (
            <ul className="fm-lista">
              {mio.mensajes.map((m) => (
                <li key={m.respuestaId ?? `p-${m.preguntaId}`}>
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
                    <small className="fm-oculto">Oculto{m.motivo ? `: ${m.motivo}` : " por moderación"}</small>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
