import Link from "next/link";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import Firma from "@/components/foro/Firma";
import TextoForo from "@/components/foro/TextoForo";
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
 */

const marcas = (m: { editado: boolean; editadoPorModeracion: boolean }) =>
  m.editadoPorModeracion ? "Editado por moderación" : m.editado ? "Editado" : null;

function Respuesta({ r, cerrado }: { r: MensajeForo; cerrado: boolean }) {
  const marca = marcas(r);
  return (
    <li className={`fh-respuesta${r.esGanadora ? " is-ganadora" : ""}`} id={`r-${r.id}`}>
      {r.esGanadora && <p className="fh-ganadora">Respuesta elegida por quien preguntó</p>}
      <Firma autor={r.autor} fecha={r.fecha} />
      <TextoForo texto={r.texto} />
      <div className="fh-pie">
        <MeGusta respuestaId={r.id} inicial={r.meGusta} />
        {marca && <span className="fh-marca">{marca}</span>}
      </div>
      <AccionesMensaje respuestaId={r.id} esRespuesta esGanadora={r.esGanadora} hiloCerrado={cerrado} texto={r.texto} fecha={r.fecha} />

      {r.replicas.length > 0 && (
        <ol className="fh-replicas">
          {r.replicas.map((x) => {
            const marcaReplica = marcas(x);
            return (
              <li key={x.id} className="fh-replica" id={`r-${x.id}`}>
                <Firma autor={x.autor} fecha={x.fecha} compacta />
                {x.citado && <p className="fh-cita">En respuesta a {x.citado}</p>}
                <TextoForo texto={x.texto} />
                <div className="fh-pie">
                  <MeGusta respuestaId={x.id} inicial={x.meGusta} />
                  {marcaReplica && <span className="fh-marca">{marcaReplica}</span>}
                </div>
                <AccionesMensaje respuestaId={x.id} hiloCerrado={cerrado} texto={x.texto} fecha={x.fecha} />
              </li>
            );
          })}
        </ol>
      )}
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

  return (
    <div className="blog-page">
      <SiteNav user={conSesion} />

      <ContextoHilo preguntaId={hilo.id} conSesion={conSesion}>
      <main className="blog-main fo-main fh-main">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Foro</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/foro/${hilo.categoria.slug}`}>{hilo.categoria.nombre}</Link>
        </nav>

        {aviso && <p className="fo-aviso" role="status">{aviso}</p>}

        <article className="fh-pregunta">
          <header>
            <div className="fh-sellos">
              {hilo.fijado && <span className="fo-sello">Fijado</span>}
              {hilo.respuestas.some((r) => r.esGanadora) && <span className="fo-sello fo-sello--resuelto">Resuelto</span>}
            </div>
            <h1 className="fh-titulo">{hilo.titulo}</h1>
            <Firma autor={hilo.autor} fecha={hilo.fecha} />
          </header>

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

          <footer className="fh-pie-pregunta">
            <Etiquetas
              inicial={{ interesante: hilo.etiquetas.interesante, gracias: hilo.etiquetas.gracias, yo_tambien: hilo.etiquetas.yoTambien }}
            />
            {marca && <span className="fh-marca">{marca}</span>}
          </footer>
          <AccionesMensaje hiloCerrado={hilo.cerrado} texto={hilo.texto} titulo={hilo.titulo} fecha={hilo.fecha} />
        </article>

        <section className="fh-respuestas" aria-labelledby="fh-respuestas-titulo">
          <header className="fh-respuestas-cab">
            <h2 id="fh-respuestas-titulo">
              {hilo.totalRespuestas === 0
                ? "Sin respuestas todavía"
                : `${hilo.totalRespuestas} ${hilo.totalRespuestas === 1 ? "respuesta" : "respuestas"}`}
            </h2>
            {hilo.totalRespuestas > 1 && (
              <nav className="fh-orden" aria-label="Orden de las respuestas">
                <Link href={url} className={orden === "relevancia" ? "is-activo" : undefined} aria-current={orden === "relevancia" ? "true" : undefined}>
                  Más valoradas
                </Link>
                <Link
                  href={`${url}?orden=recientes`}
                  className={orden === "recientes" ? "is-activo" : undefined}
                  aria-current={orden === "recientes" ? "true" : undefined}
                  rel="nofollow"
                >
                  Más recientes
                </Link>
              </nav>
            )}
          </header>

          {hilo.respuestas.length > 0 && (
            <ol className="fh-lista">
              {hilo.respuestas.map((r) => <Respuesta key={r.id} r={r} cerrado={hilo.cerrado} />)}
            </ol>
          )}

          {hilo.cerrado ? (
            <p className="fh-cerrado">
              {hilo.respuestas.some((r) => r.esGanadora)
                ? "Resuelto: este hilo ya tiene respuesta y no admite más."
                : "Este hilo está cerrado y no admite más respuestas."}
            </p>
          ) : (
            <div className="fh-responder">
              <h3>Responder a esta pregunta</h3>
              <Responder />
            </div>
          )}
        </section>

        <p className="fh-opiniones">
          Las preguntas y respuestas de este foro son opiniones de sus autores, no de AdelinBTC Academy, y no son
          asesoramiento financiero, fiscal ni legal.
        </p>
        <DisclaimerRiesgo variante="general" />
      </main>
      </ContextoHilo>

      <Footer />
    </div>
  );
}
