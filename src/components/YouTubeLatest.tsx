import type { YouTubeVideo } from "@/lib/youtube";
import { Play, ExternalLink } from "lucide-react";

export default function YouTubeLatest({ videos }: { videos: YouTubeVideo[] }) {
  if (!videos || videos.length === 0) return null;

  return (
    <section className="yt-latest">
      <div className="yt-latest-head">
        <p className="yt-latest-title">
          <span className="yt-latest-logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" />
            </svg>
          </span>
          Últimos vídeos
        </p>
        <a
          href="https://www.youtube.com/@AdelinBTC"
          target="_blank"
          rel="noopener noreferrer"
          className="yt-latest-channel"
        >
          Ver canal <ExternalLink size={12} aria-hidden="true" />
        </a>
      </div>

      <div className="yt-latest-grid">
        {videos.map((v) => (
          <a
            key={v.id}
            href={v.url}
            target="_blank"
            rel="noopener noreferrer"
            className="yt-card"
          >
            <span className="yt-card-thumb">
              <img src={v.thumbnail} alt="" loading="lazy" />
              <span className="yt-card-play" aria-hidden="true">
                <Play size={20} fill="currentColor" />
              </span>
            </span>
            <span className="yt-card-title">{v.title}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
