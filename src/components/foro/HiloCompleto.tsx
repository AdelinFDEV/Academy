import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, BadgeCheck, CornerDownRight, HandHeart, Heart, Lightbulb, Lock, MessageCircle, Pin, Users } from "lucide-react";
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

  return (
    <MarcoForo conSesion={conSesion} tono={colorDe(hilo.categoria.slug)}>
      <ContextoHilo preguntaId={hilo.id} conSesion={conSesion}>
        {/* ── El inicio del hilo (23-11-2026, rehecho de cero: pedido por el
            admin) ── Una hoja en el pastel de su categoría, como la cabecera
            del foro: arriba, la vuelta y las migas; la categoría en una
            pegatina con «pregunta en …» a mano; el titular grande; y abajo la
            firma en una ficha blanca y los datos del hilo en chips. En la
            esquina, la pegatina del «?» o, si ya está resuelto, un sello. */}
        <header className={`fhc${resuelto ? " is-resuelto" : ""}`}>
          {resuelto ? (
            <span className="fhc-sello" aria-hidden="true">
              <BadgeCheck size={22} strokeWidth={2.6} />
              ¡Resuelta!
            </span>
          ) : (
            <Image src="/cuaderno/pregunta-pegatina.webp" alt="" width={225} height={300} className="fhc-pegatina" draggable={false} />
          )}

          <nav className="fhc-migas" aria-label="Estás en">
            <Link href="/foro" className="fhc-volver">
              <ArrowLeft size={15} strokeWidth={2.8} aria-hidden="true" /> Foro
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/foro/${hilo.categoria.slug}`}>{hilo.categoria.nombre}</Link>
          </nav>

          <div className="fhc-cat">
            <Link href={`/foro/${hilo.categoria.slug}`} className="fhc-cat-icono" aria-label={`Categoría: ${hilo.categoria.nombre}`}>
              <Icono size={26} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <p className="fhc-nota">pregunta en {hilo.categoria.nombre.toLowerCase()}</p>
          </div>

          <h1 className="fhc-titulo">{hilo.titulo}</h1>

          <div className="fhc-pie">
            <div className="fhc-firma">
              <Firma autor={hilo.autor} fecha={hilo.fecha} />
            </div>
            <ul className="fhc-datos" aria-label="Datos del hilo">
              <li>
                <MessageCircle size={15} strokeWidth={2.6} aria-hidden="true" />
                <b>{hilo.totalRespuestas}</b> {hilo.totalRespuestas === 1 ? "respuesta" : "respuestas"}
              </li>
              {/* Las tres reacciones de la pregunta, en su color (las mismas
                  teclas del pie), para verlo todo de un vistazo. */}
              <li className="is-interesante">
                <Lightbulb size={15} strokeWidth={2.6} aria-hidden="true" />
                <b>{hilo.etiquetas.interesante}</b> Interesante
              </li>
              <li className="is-gracias">
                <HandHeart size={15} strokeWidth={2.6} aria-hidden="true" />
                <b>{hilo.etiquetas.gracias}</b> Gracias
              </li>
              <li className="is-yotambien">
                <Users size={15} strokeWidth={2.6} aria-hidden="true" />
                <b>{hilo.etiquetas.yoTambien}</b> Yo también
              </li>
              {meGustaTotal > 0 && (
                <li>
                  <Heart size={15} strokeWidth={2.6} aria-hidden="true" />
                  <b>{meGustaTotal}</b> me gusta
                </li>
              )}
              {resuelto && (
                <li className="is-resuelto">
                  <BadgeCheck size={15} strokeWidth={2.8} aria-hidden="true" /> Resuelto
                </li>
              )}
              {hilo.fijado && (
                <li>
                  <Pin size={14} strokeWidth={2.8} aria-hidden="true" /> Fijado
                </li>
              )}
              {hilo.cerrado && !resuelto && (
                <li>
                  <Lock size={14} strokeWidth={2.8} aria-hidden="true" /> Cerrado
                </li>
              )}
            </ul>
          </div>
        </header>

        {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

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
                  comentarios={hilo.totalRespuestas}
                />
                <div className="fh-pregunta-acciones">
                  {marca && <span className="fh-editado">{marca}</span>}
                  <AccionesMensaje hiloCerrado={hilo.cerrado} texto={hilo.texto} titulo={hilo.titulo} fecha={hilo.fecha} />
                </div>
              </footer>
            </article>

            {/* ── Responder (23-11-2026): siempre justo al acabar la pregunta,
                antes de las respuestas; el pósit de las normas, al lado. ── */}
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
              <div className="fh-responder-zona">
                <div className="fh-responder" id="responder">
                  <h3 className="fh-responder-titulo">
                    <span className="fh-responder-icono" aria-hidden="true"><MessageCircle size={18} strokeWidth={2.6} /></span>
                    Tu respuesta
                  </h3>
                  <Responder />
                </div>

                {/* Antes de responder: el pósit, al lado del formulario. */}
                <section className="fh-recordatorio" aria-label="Antes de responder">
                  <h2>Antes de responder</h2>
                  <ul>
                    <li>Responde a lo que se pregunta, con tus palabras.</li>
                    <li>Nada de contactar por privado ni de enlaces de referido.</li>
                    <li>Nunca pidas ni publiques una frase semilla.</li>
                  </ul>
                  <Link href="/foro/normas">Normas del foro</Link>
                </section>
              </div>
            )}

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

            </section>
          </div>

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
