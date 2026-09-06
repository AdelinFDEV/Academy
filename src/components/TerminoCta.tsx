import Link from "next/link";
import { ArrowRight, Play, Bookmark, Compass } from "lucide-react";
import { getLatestVideos } from "@/lib/youtube";
import { YOUTUBE_URL } from "@/lib/contacto";

/**
 * La banda de conversión de las fichas del diccionario.
 *
 * ── Por qué está aquí y no en otro sitio ───────────────────────────────────
 *
 * Las 50 fichas del diccionario son la puerta por la que entra el tráfico frío
 * de Google: alguien busca «qué es un exchange», aterriza, lee y se va. Sin un
 * paso siguiente, esa visita no deja nada.
 *
 * ── Dónde se coloca, y por qué no más arriba ───────────────────────────────
 *
 * Va DEBAJO del título y la definición corta, no encima. Quien llega buscando
 * qué significa una palabra tiene que ver la respuesta antes que una oferta;
 * si lo primero es un banner, se vuelve a Google y eso Google lo mide. Así la
 * definición responde en el primer vistazo y la banda aparece justo después,
 * todavía sin hacer scroll en un portátil.
 *
 * ── Por qué «crear cuenta» y no «ir al inicio» ─────────────────────────────
 *
 * «Ir al inicio» no es una llamada a la acción, es navegación: nadie pulsa
 * «inicio» por lo que le ofrece. La cuenta gratuita sí tiene un gancho
 * concreto y además contextual — **guardar términos** es una función que ya
 * existe en esta misma página y que solo funciona con sesión. Se pide algo
 * ofreciendo algo, que es la única forma de que un desconocido se registre.
 *
 * A quien ya ha entrado se le ofrece otra cosa: las guías. Enseñarle «crea tu
 * cuenta» a alguien que la tiene es la forma más rápida de parecer un robot.
 */
export default async function TerminoCta({
  termino,
  logueado,
}: {
  termino: string;
  logueado: boolean;
}) {
  // Si YouTube falla, `videos` viene vacío y la banda se pinta sin el vídeo.
  // Nunca debe tumbar una página que existe para posicionar.
  const videos = await getLatestVideos(1).catch(() => []);
  const ultimo = videos[0] ?? null;

  return (
    <aside className="tcta" aria-label="Sigue aprendiendo">
      <div className="tcta-texto">
        <p className="tcta-title">
          {logueado
            ? "¿Te ha servido? Hay mucho más"
            : `Ya sabes qué es ${termino}. ¿Y ahora qué?`}
        </p>
        <p className="tcta-sub">
          {logueado
            ? "Las guías interactivas llevan estos conceptos a la práctica, con ejercicios y ejemplos reales."
            : "Con una cuenta gratuita guardas los términos que vas aprendiendo y desbloqueas las herramientas de la academia. Sin tarjeta."}
        </p>

        <div className="tcta-botones">
          {logueado ? (
            <Link href="/guias" className="tcta-btn">
              <Compass size={15} strokeWidth={2.2} aria-hidden="true" />
              Ver las guías
              <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          ) : (
            <Link href="/register" className="tcta-btn">
              <Bookmark size={15} strokeWidth={2.2} aria-hidden="true" />
              Crear cuenta gratis
              <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          )}

          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tcta-btn tcta-btn--yt"
          >
            <Play size={14} strokeWidth={2.4} aria-hidden="true" />
            Ver el canal
          </a>
        </div>
      </div>

      {/* El último vídeo sale solo del canal: no hay nada que actualizar a mano
          cuando se publica uno nuevo. */}
      {ultimo && (
        <a
          href={ultimo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="tcta-video"
        >
          <span className="tcta-video-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ultimo.thumbnail} alt="" loading="lazy" />
            <span className="tcta-video-play" aria-hidden="true">
              <Play size={16} strokeWidth={2.6} />
            </span>
          </span>
          <span className="tcta-video-texto">
            <span className="tcta-video-label">Último vídeo</span>
            <span className="tcta-video-title">{ultimo.title}</span>
          </span>
        </a>
      )}
    </aside>
  );
}
