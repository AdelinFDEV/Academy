// lucide no trae el logo de YouTube (son marcas registradas y las quitó
// de la librería). MonitorPlay dice lo mismo sin usar marca ajena.
import { Play, MonitorPlay, ArrowUpRight } from "lucide-react";
import { getLatestVideos } from "@/lib/youtube";
import { YOUTUBE_URL } from "@/lib/contacto";

/**
 * El último vídeo del canal, al final de cada ficha del diccionario.
 *
 * ── Por qué al final y no arriba ───────────────────────────────────────────
 *
 * Estuvo unas horas metido en la banda de la cuenta, arriba, y ahí el vídeo
 * salía en 92 píxeles: como acompañante de otra oferta, no como una propuesta
 * propia. Un vídeo pequeño no invita a nadie a verlo.
 *
 * Al final funciona mejor por dos razones. La primera es de tamaño: solo, tiene
 * el ancho entero y la miniatura se ve. La segunda es de momento — quien ha
 * llegado hasta el final de 1.400 palabras ya ha decidido que el sitio le sirve,
 * y ese es el instante para pedirle otro paso, no el primer segundo.
 *
 * ── La miniatura ───────────────────────────────────────────────────────────
 *
 * YouTube devuelve `hqdefault.jpg`, que es 480×360 — formato 4:3 con franjas
 * negras arriba y abajo en los vídeos modernos. Se recorta a 16:9 con
 * `object-fit: cover`, que se come exactamente esas franjas. Por eso el
 * contenedor lleva proporción fija: sin ella se verían las bandas.
 *
 * Si YouTube no responde, esto **no pinta nada** en vez de dejar un hueco roto.
 * Una ficha del diccionario existe para posicionar, y no puede depender de que
 * una API de terceros conteste.
 */
export default async function TerminoVideo() {
  const videos = await getLatestVideos(1).catch(() => []);
  const ultimo = videos[0];
  if (!ultimo) return null;

  return (
    <section className="tvid" aria-label="Último vídeo del canal">
      <a
        href={ultimo.url}
        target="_blank"
        rel="noopener noreferrer"
        className="tvid-thumb"
        aria-label={`Ver «${ultimo.title}» en YouTube`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ultimo.thumbnail} alt="" loading="lazy" />
        <span className="tvid-play" aria-hidden="true">
          <Play size={26} strokeWidth={2.4} fill="currentColor" />
        </span>
      </a>

      <div className="tvid-texto">
        <span className="tvid-label">
          <MonitorPlay size={14} strokeWidth={2.2} aria-hidden="true" />
          Último vídeo del canal
        </span>

        <h2 className="tvid-title">
          <a href={ultimo.url} target="_blank" rel="noopener noreferrer">
            {ultimo.title}
          </a>
        </h2>

        <p className="tvid-sub">
          Análisis, operativa en directo y lo que se mueve en el mercado,
          explicado sin humo.
        </p>

        <div className="tvid-botones">
          <a
            href={ultimo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="tvid-btn"
          >
            <Play size={14} strokeWidth={2.6} fill="currentColor" aria-hidden="true" />
            Ver el vídeo
          </a>
          <a
            href={YOUTUBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tvid-btn tvid-btn--ghost"
          >
            Suscribirse al canal
            <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
