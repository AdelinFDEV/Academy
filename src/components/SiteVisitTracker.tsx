"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/site-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
