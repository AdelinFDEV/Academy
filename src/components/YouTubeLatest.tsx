import type { YouTubeVideo } from "@/lib/youtube";
import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { YOUTUBE_URL } from "@/lib/contacto";
import Tecla from "@/components/cuaderno/Tecla";
import "./youtube-latest.css";

/**
 * Los últimos vídeos del canal, en la portada. El más reciente va en grande y
 * los otros dos en fila a su lado. Estilo «Cuaderno de estudio» desde el
 * 17-11-2026: cada vídeo es una tarjeta de papel con la miniatura enmarcada,
 * en el naranja de la marca (el canal es de Adelin).
 *
 * Todo son enlaces a YouTube: aquí no se incrusta ningún reproductor, así que
 * no se carga nada de Google hasta que el visitante pulsa.
 */

const DIA = 24 * 60 * 60 * 1000;

/** «hoy», «hace 3 días», «hace 2 semanas»… o la fecha, si ya es antiguo. */
function hace(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const dias = Math.floor((Date.now() - t) / DIA);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 28) return dias < 14 ? "Hace 1 semana" : `Hace ${Math.floor(dias / 7)} semanas`;
  return new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Bucharest" });
}

function LogoYouTube({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" />
    </svg>
  );
}

export default function YouTubeLatest({ videos }: { videos: YouTubeVideo[] }) {
  if (!videos || videos.length === 0) return null;
  const [principal, ...resto] = videos;

  return (
    <section className="ytl" aria-labelledby="ytl-titulo">
      <div className="ytl-inner">
        <header className="ytl-cabecera">
          <div>
            <h2 id="ytl-titulo" className="ytl-titulo">
              Lo último del{" "}
              <span className="ytl-titulo-mano">
                canal
                {/* La gorra de los vídeos, dejada caer sobre la palabra (18-11-2026). */}
                <Image src="/cuaderno/gorra-pegatina.webp" alt="" width={160} height={137} className="ytl-gorra" draggable={false} />
              </span>
            </h2>
          </div>
          <Tecla href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" color="blanca" tamano="peq" className="ytl-ver-canal">
            <LogoYouTube size={17} /> Ver el canal <ArrowUpRight size={16} strokeWidth={2.8} aria-hidden="true" />
          </Tecla>
        </header>

        <div className={`ytl-rejilla${resto.length === 0 ? " ytl-rejilla--uno" : ""}`}>
          {/* El más reciente, en grande. La miniatura grande de YouTube (640 px). */}
          <a href={principal.url} target="_blank" rel="noopener noreferrer" className="ytl-principal">
            <span className="ytl-marco">
              {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube, ya servida a su tamaño */}
              <img src={`https://i.ytimg.com/vi/${principal.id}/sddefault.jpg`} alt="" loading="lazy" className="ytl-imagen" />
              <span className="ytl-play" aria-hidden="true"><Play size={28} fill="currentColor" /></span>
            </span>
            <span className="ytl-postit" aria-hidden="true">Último vídeo</span>
            <span className="ytl-principal-texto">
              <span className="ytl-fecha">{hace(principal.publishedAt)}</span>
              <span className="ytl-principal-titulo">{principal.title}</span>
              <span className="ytl-ver">Ver en YouTube <ArrowUpRight size={15} strokeWidth={2.6} aria-hidden="true" /></span>
            </span>
          </a>

          {resto.length > 0 && (
            <div className="ytl-lado">
              {resto.map((v) => (
                <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="ytl-tarjeta">
                  <span className="ytl-marco ytl-marco--mini">
                    {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube */}
                    <img src={v.thumbnail} alt="" loading="lazy" className="ytl-imagen" />
                    <span className="ytl-play ytl-play--mini" aria-hidden="true"><Play size={16} fill="currentColor" /></span>
                  </span>
                  <span className="ytl-tarjeta-texto">
                    <span className="ytl-fecha">{hace(v.publishedAt)}</span>
                    <span className="ytl-tarjeta-titulo">{v.title}</span>
                    <span className="ytl-ver">Ver en YouTube <ArrowUpRight size={14} strokeWidth={2.6} aria-hidden="true" /></span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
