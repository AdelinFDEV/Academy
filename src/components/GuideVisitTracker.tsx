"use client";
import { useEffect } from "react";

export default function GuideVisitTracker({ guideSlug }: { guideSlug: string }) {
  useEffect(() => {
    fetch("/api/guide-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guide_slug: guideSlug }),
    }).catch(() => {});
  }, [guideSlug]);
  return null;
}
