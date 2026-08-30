"use client";

import { useRef, useEffect, useState } from "react";

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  // El vídeo es decorativo (opacidad 0.26 bajo el scrim) pero pesa ~2 MB y era
  // el elemento LCP de la home. Se descarga tras el load para que el LCP lo
  // resuelva el póster.
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    if (document.readyState === "complete") {
      setLoadVideo(true);
      return;
    }
    const start = () => setLoadVideo(true);
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || !loadVideo) return;

    function restart() {
      if (!video) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    function resume() {
      if (!video || !video.paused) return;
      video.play().catch(() => {});
    }

    video.load();
    video.play().catch(() => {});

    video.addEventListener("ended", restart);
    // Recover if the browser pauses/stalls the video
    video.addEventListener("stalled", restart);
    video.addEventListener("suspend", resume);

    return () => {
      video.removeEventListener("ended", restart);
      video.removeEventListener("stalled", restart);
      video.removeEventListener("suspend", resume);
    };
  }, [loadVideo]);

  return (
    <video
      ref={ref}
      className="hero-video"
      poster="/hero-poster.webp"
      autoPlay
      loop
      muted
      playsInline
      preload="none"
    >
      {loadVideo && (
        <>
          <source src="/hero.webm" type="video/webm" />
          <source src="/hero-opt.mp4" type="video/mp4" />
        </>
      )}
    </video>
  );
}
