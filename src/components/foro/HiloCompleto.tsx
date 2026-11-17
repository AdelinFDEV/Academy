import Link from "next/link";
import { BadgeCheck, CornerDownRight, Lock, MessageCircle, Pin } from "lucide-react";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Tecla from "@/components/cuaderno/Tecla";
import Firma from "@/components/foro/Firma";
import MarcoForo from "@/components/foro/MarcoForo";
import TextoForo from "@/components/foro/TextoForo";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import AccionesMensaje from "@/components/foro/participar/AccionesMensaje";
import ContextoHilo from "@/components/foro/participar/ContextoHilo";
import Etiquetas from "@/components/foro/participar/Etiquetas";
import MeGusta from "@/components/foro/participar/MeGusta";
import Responder from "@/components/foro/participar/Responder";
import type { HiloForo, MensajeForo } from "@/lib/foro/tipos";
import "@/app/foro/hilo.css";

/**
 * Un hilo: la pregunta, sus imágenes, sus etiquetas y sus respuestas con sus
 * réplicas. Es la página que lee todo el mundo y la que indexa Google, así
 * que el HTML es igual para todos: nada de aquí depende de quién mira.
 *
 * Los botones (me gusta, etiquetas, responder, reportar…) son componentes de
 * cliente que piden APARTE lo personal de quien mira (`ContextoHilo`). Sin
 * JavaScript, o para Google, la página se lee entera igual.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): la pregunta es una hoja de
 * cuaderno con la pestaña y el margen del color de su categoría; cada
 * respuesta, una nota pegada con cinta, con su «me gusta» en un riel a la
 * izquierda; la elegida va la primera, en menta y con su pegatina; y las
 * réplicas cuelgan de su respuesta como notas más pequeñas, con una sola
 * sangría, porque el hilo tiene un nivel.
 */

const marcas = (m: { editado: boolean; editadoPorModeracion: boolean }) =>
  m.editadoPorModeracion ? "Editado por moderación" : m.editado ? "Editado" : null;

function Respuesta({ r, cerrado }: { r: MensajeForo; cerrado: boolean }) {
  const marca = marcas(r);
  return (
    <li className={`fh-resp${r.esGanadora ? " is-ganadora" : ""}`} id={`r-${r.id}`}>
      {r.esGanadora && (
        <>
          {/* La pegatina es el adorno; lo que se lee es la cinta de al lado. */}
          <span className="fh-pegatina" aria-hidden="true">
            <BadgeCheck size={24} strokeWidth={2.6} />
            Elegida
          </span>
          <p className="fh-cinta">
            <BadgeCheck size={15} strokeWidth={2.8} aria-hidden="true" />
            Respuesta elegida por quien preguntó
          </p>
        </>
      )}

      <div className="fh-resp-dentro">
        {/* El riel: el «me gusta», a la izquierda del texto. */}
        <div className="fh-riel">
          <MeGusta respuestaId={r.id} inicial={r.meGusta} />
        </div>

        <div className="fh-resp-cuerpo">
          <header className="fh-mensaje-cab">
            <Firma autor={r.autor} fecha={r.fecha} />
            {marca && <span className="fh-editado">{marca}</span>}
          </header>
          <TextoForo texto={r.texto} />
          <AccionesMensaje respuestaId={r.id} esRespuesta esGanadora={r.esGanadora} hiloCerrado={cerrado} texto={r.texto} fecha={r.fecha} />

          {r.replicas.length > 0 && (
            <ol className="fh-replicas">
              {r.replicas.map((x) => {
                const marcaReplica = marcas(x);
                return (
                  <li key={x.id} className="fh-replica" id={`r-${x.id}`}>
                    <header className="fh-mensaje-cab">
                      <Firma autor={x.autor} fecha={x.fecha} compacta />
                      {marcaReplica && <span className="fh-editado">{marcaReplica}</span>}
                    </header>
                    {x.citado && (
                      <p className="fh-cita">
                        <CornerDownRight size={13} strokeWidth={2.6} aria-hidden="true" />
                        En respuesta a <b>{x.citado}</b>
                      </p>
                    )}
                    <TextoForo texto={x.texto} />
                    <div className="fh-replica-pie">
                      <MeGusta respuestaId={x.id} inicial={x.meGusta} />
                      <AccionesMensaje respuestaId={x.id} hiloCerrado={cerrado} texto={x.texto} fecha={x.fecha} />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </li>
  );
}

export default function HiloCompleto({
  hilo,
  orden,
  conSesion,
  aviso,
}: {
  hilo: HiloForo;
  orden: "relevancia" | "recientes";
  conSesion: boolean;
  aviso: string | null;
}) {
  const url = `/foro/${hilo.id}-${hilo.slug}`;
  const marca = marcas(hilo);
  const { Icono } = aspectoDe(hilo.categoria.slug);
  const resuelto = hilo.respuestas.some((r) => r.esGanadora);
  const meGustaTotal = hilo.respuestas.reduce((n, r) => n + r.meGusta + r.replicas.reduce((m, x) => m + x.meGusta, 0), 0);
  const valoraciones = hilo.etiquetas.interesante + hilo.etiquetas.gracias + hilo.etiquetas.yoTambien;

  return (
    <MarcoForo conSesion={conSesion} tono={colorDe(hilo.categoria.slug)}>
      <ContextoHilo preguntaId={hilo.id} conSesion={conSesion}>
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Foro</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/foro/${hilo.categoria.slug}`}>{hilo.categoria.nombre}</Link>
        </nav>

        {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

        {/* ── La pregunta, como el arranque de una hoja ── */}
        <header className="fh-cabecera">
          <div className="fh-sellos">
            <Link href={`/foro/${hilo.categoria.slug}`} className="fo-cat">
              <Icono size={13} strokeWidth={2.6} aria-hidden="true" />
              {hilo.categoria.nombre}
            </Link>
            {resuelto && (
              <span className="fo-sello fo-sello--resuelto">
                <BadgeCheck size={13} strokeWidth={2.8} aria-hidden="true" /> Resuelto
              </span>
            )}
            {hilo.fijado && (
              <span className="fo-sello"><Pin size={12} strokeWidth={2.8} aria-hidden="true" /> Fijado</span>
            )}
          </div>
          <h1 className="fh-hilo-titulo">{hilo.titulo}</h1>
          <Firma autor={hilo.autor} fecha={hilo.fecha} />
        </header>

        <div className="fh-rejilla">
          <div className="fh-principal">
            <article className="fh-pregunta">
              <TextoForo texto={hilo.texto} className="fh-texto-pregunta" />

              {hilo.imagenes.length > 0 && (
                <ul className="fh-imagenes">
                  {hilo.imagenes.map((img, i) => (
                    <li key={img.url}>
                      <a href={img.url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element -- ya recodificada a WebP de 1.600 px por el servidor (FORO.md §6.6) */}
                        <img
                          src={img.url}
                          alt={`Imagen ${i + 1} de la pregunta «${hilo.titulo}»`}
                          width={img.ancho}
                          height={img.alto}
                          loading="lazy"
                          decoding="async"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              <footer className="fh-pregunta-pie">
                <Etiquetas
                  inicial={{ interesante: hilo.etiquetas.interesante, gracias: hilo.etiquetas.gracias, yo_tambien: hilo.etiquetas.yoTambien }}
                />
                <div className="fh-pregunta-acciones">
                  {marca && <span className="fh-editado">{marca}</span>}
                  <AccionesMensaje hiloCerrado={hilo.cerrado} texto={hilo.texto} titulo={hilo.titulo} fecha={hilo.fecha} />
                </div>
              </footer>
            </article>

            {/* ── Las respuestas ── */}
            <section className="fh-respuestas" aria-labelledby="fh-respuestas-titulo">
              <header className="fh-respuestas-cab">
                <h2 id="fh-respuestas-titulo" className="fo-seccion-titulo">
                  {hilo.totalRespuestas === 0
                    ? "Sin respuestas todavía"
                    : `${hilo.totalRespuestas} ${hilo.totalRespuestas === 1 ? "respuesta" : "respuestas"}`}
                </h2>
                {hilo.totalRespuestas > 1 && (
                  <nav className="fh-orden" aria-label="Orden de las respuestas">
                    <Tecla
                      href={url}
                      color={orden === "relevancia" ? "coral" : "blanca"}
                      tamano="peq"
                      aria-current={orden === "relevancia" ? "true" : undefined}
                    >
                      Más valoradas
                    </Tecla>
                    <Tecla
                      href={`${url}?orden=recientes`}
                      color={orden === "recientes" ? "coral" : "blanca"}
                      tamano="peq"
                      aria-current={orden === "recientes" ? "true" : undefined}
                      rel="nofollow"
                    >
                      Más recientes
                    </Tecla>
                  </nav>
                )}
              </header>

              {hilo.respuestas.length === 0 ? (
                <div className="fo-vacio">
                  <b>Nadie ha respondido todavía</b>
                  <p>Si sabes la respuesta, es tu momento.</p>
                </div>
              ) : (
                <ol className="fh-lista">
                  {hilo.respuestas.map((r) => <Respuesta key={r.id} r={r} cerrado={hilo.cerrado} />)}
                </ol>
              )}

              {hilo.cerrado ? (
                <p className={`fh-cerrado${resuelto ? " is-resuelto" : ""}`}>
                  <span className="fh-cerrado-icono" aria-hidden="true">
                    {resuelto ? <BadgeCheck size={20} strokeWidth={2.6} /> : <Lock size={18} strokeWidth={2.6} />}
                  </span>
                  {resuelto
                    ? "Resuelto: este hilo ya tiene respuesta y no admite más."
                    : "Este hilo está cerrado y no admite más respuestas."}
                </p>
              ) : (
                <div className="fh-responder" id="responder">
                  <h3 className="fh-responder-titulo">
                    <span className="fh-responder-icono" aria-hidden="true"><MessageCircle size={18} strokeWidth={2.6} /></span>
                    Tu respuesta
                  </h3>
                  <Responder />
                </div>
              )}
            </section>
          </div>

          {/* ── La columna lateral ── */}
          <aside className="fh-lateral">
            <section className="fh-ficha fo-tarjeta" aria-label="Sobre este hilo">
              <dl>
                <div>
                  <dt>Respuestas</dt>
                  <dd>{hilo.totalRespuestas}</dd>
                </div>
                <div>
                  <dt>Me gusta</dt>
                  <dd>{meGustaTotal}</dd>
                </div>
                <div>
                  <dt>Valoraciones</dt>
                  <dd>{valoraciones}</dd>
                </div>
              </dl>
              <p className={`fh-estado${resuelto ? " is-resuelto" : ""}`}>
                {resuelto ? "Resuelto" : hilo.cerrado ? "Cerrado" : hilo.totalRespuestas > 0 ? "Abierto, con respuestas" : "Esperando la primera respuesta"}
              </p>
              {!hilo.cerrado && (
                <Tecla href="#responder" color="coral" ancho className="fh-ficha-responder">
                  <MessageCircle size={17} strokeWidth={2.6} aria-hidden="true" />
                  Responder
                </Tecla>
              )}
            </section>

            {/* Antes de responder: un pósit, como una nota al margen. */}
            <section className="fh-recordatorio" aria-label="Antes de responder">
              <h2>Antes de responder</h2>
              <ul>
                <li>Responde a lo que se pregunta, con tus palabras.</li>
                <li>Nada de contactar por privado ni de enlaces de referido.</li>
                <li>Nunca pidas ni publiques una frase semilla.</li>
              </ul>
              <Link href="/foro/normas">Normas del foro</Link>
            </section>
          </aside>
        </div>

        <p className="fh-opiniones">
          Las preguntas y respuestas de este foro son opiniones de sus autores, no de AdelinBTC Academy, y no son
          asesoramiento financiero, fiscal ni legal.
        </p>
        <DisclaimerRiesgo variante="general" />
      </ContextoHilo>
    </MarcoForo>
  );
}
