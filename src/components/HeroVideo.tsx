"use client";

import { useRef, useEffect } from "react";

export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    function restart() {
      if (!video) return;
      video.currentTime = 0;
      video.play().catch(() => {});
    }

    video.addEventListener("ended", restart);
    // Recover if the browser pauses/stalls the video
    video.addEventListener("stalled", restart);
    video.addEventListener("suspend", () => {
      if (video && !video.paused) return;
      video?.play().catch(() => {});
    });

    return () => {
      video.removeEventListener("ended", restart);
      video.removeEventListener("stalled", restart);
    };
  }, []);

  return (
    <video
      ref={ref}
      className="home-banner-video"
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
    >
      <source src="/hero.webm" type="video/webm" />
      <source src="/hero-opt.mp4" type="video/mp4" />
    </video>
  );
}
