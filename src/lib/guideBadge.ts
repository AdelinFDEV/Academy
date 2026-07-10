// Shared helper used by every guide quiz (GuideQuiz, GuideCycleQuiz,
// GuideWorldQuiz, ...) to persist a guide badge and trigger the unlock
// popup. Centralizing this means new guides get the popup "for free" —
// no need to remember to dispatch the event in each quiz component.
export async function saveGuideBadge(badgeId: string) {
  try {
    const res = await fetch("/api/guide-badge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: badgeId }),
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data.success && !data.alreadyHad) {
      window.dispatchEvent(new CustomEvent("badge-unlocked", { detail: { ids: [badgeId] } }));
    }
  } catch {}
}
