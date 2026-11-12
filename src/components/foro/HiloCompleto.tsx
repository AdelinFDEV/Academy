import Link from "next/link";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import Firma from "@/components/foro/Firma";
import TextoForo from "@/components/foro/TextoForo";
import { ETIQUETAS } from "@/lib/foro/limites";
import type { HiloForo, MensajeForo } from "@/lib/foro/tipos";
import "@/app/foro/hilo.css";

/**
 * Un hilo: la pregunta, sus imágenes, sus etiquetas y sus respuestas con sus
 * réplicas. Es la página que lee todo el mundo y la que indexa Google, así
 * que es igual para todos: nada de aquí depende de quién mira.
 */

const marcas = (m: { editado: boolean; editadoPorModeracion: boolean }) =>
  m.editadoPorModeracion ? "Editado por moderación" : m.editado ? "Editado" : null;

function Respuesta({ r }: { r: MensajeForo }) {
  const marca = marcas(r);
  return (
    <li className={`fh-respuesta${r.esGanadora ? " is-ganadora" : ""}`} id={`r-${r.id}`}>
      {r.esGanadora && <p className="fh-ganadora">Respuesta elegida por quien preguntó</p>}
      <Firma autor={r.autor} fecha={r.fecha} />
      <TextoForo texto={r.texto} />
      <p className="fh-pie">
        <span className="fh-megusta">
          <b>{r.meGusta}</b> me gusta
        </span>
        {marca && <span className="fh-marca">{marca}</span>}
      </p>

      {r.replicas.length > 0 && (
        <ol className="fh-replicas">
          {r.replicas.map((x) => {
            const marcaReplica = marcas(x);
            return (
              <li key={x.id} className="fh-replica" id={`r-${x.id}`}>
                <Firma autor={x.autor} fecha={x.fecha} compacta />
                {x.citado && <p className="fh-cita">En respuesta a {x.citado}</p>}
                <TextoForo texto={x.texto} />
                <p className="fh-pie">
                  {x.meGusta > 0 && (
                    <span className="fh-megusta">
                      <b>{x.meGusta}</b> me gusta
                    </span>
                  )}
                  {marcaReplica && <span className="fh-marca">{marcaReplica}</span>}
                </p>
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
  const cuentas = [hilo.etiquetas.interesante, hilo.etiquetas.gracias, hilo.etiquetas.yoTambien];

  return (
    <div className="blog-page">
      <SiteNav user={conSesion} />

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
            <ul className="fh-etiquetas" aria-label="Valoraciones de la pregunta">
              {ETIQUETAS.map((e, i) => (
                <li key={e.id} title={e.ayuda}>
                  <b>{cuentas[i]}</b> {e.nombre}
                </li>
              ))}
            </ul>
            {marca && <span className="fh-marca">{marca}</span>}
          </footer>
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
              {hilo.respuestas.map((r) => <Respuesta key={r.id} r={r} />)}
            </ol>
          )}

          {hilo.cerrado && (
            <p className="fh-cerrado">
              {hilo.respuestas.some((r) => r.esGanadora)
                ? "Resuelto: este hilo ya tiene respuesta y no admite más."
                : "Este hilo está cerrado y no admite más respuestas."}
            </p>
          )}
        </section>

        <p className="fh-opiniones">
          Las preguntas y respuestas de este foro son opiniones de sus autores, no de AdelinBTC Academy, y no son
          asesoramiento financiero, fiscal ni legal.
        </p>
        <DisclaimerRiesgo variante="general" />
      </main>

      <Footer />
    </div>
  );
}
