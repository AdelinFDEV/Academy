"use client";
import { useEffect } from "react";

// Fires POST /api/streak on mount so any dashboard page visit counts toward the streak.
// The endpoint is idempotent: if already called today it returns cached values instantly.
export default function StreakTracker() {
  useEffect(() => {
    fetch("/api/streak", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
