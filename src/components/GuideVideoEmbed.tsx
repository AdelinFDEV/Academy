import { SquarePlay } from "lucide-react";

interface Props {
  youtubeId: string;
  title: string;
}

export default function GuideVideoEmbed({ youtubeId, title }: Props) {
  return (
    <div className="gbc-video-wrap">
      <div className="gbc-video-eyebrow">
        <SquarePlay size={14} /> Míralo en vídeo
      </div>
      <div className="gbc-video-frame">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
      <p className="gbc-video-caption">
        Si prefieres verlo explicado paso a paso, este es el mismo tema en el canal de AdelinBTC.
      </p>
    </div>
  );
}
