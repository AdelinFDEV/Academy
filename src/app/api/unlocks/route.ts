import { NextResponse } from "next/server";
import { DEFILLAMA_SLUGS, type LiveUnlock, type LiveUnlockDetail, type LiveEvent } from "@/app/herramientas/liberaciones/tokenData";

// Índice de emisiones de DefiLlama (gratuito, sin API key). Pesa ~21 MB, así que
// NO se puede cachear con el fetch cache de Next (límite 2 MB/entrada). Lo bajamos
// como mucho una vez cada TTL con caché en memoria del módulo y servimos JSON
// diminuto: la lista (sin parámetro) o el detalle de un token (?token=id).
const SRC = "https://defillama-datasets.llama.fi/emissionsIndex";
const TTL = 6 * 60 * 60 * 1000; // 6 h — los calendarios de unlock cambian despacio

let cache: { data: Record<string, LiveUnlockDetail>; ts: number } | null = null;

// Slug DefiLlama → id de nuestro token (mapa inverso de DEFILLAMA_SLUGS).
const SLUG_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(DEFILLAMA_SLUGS).map(([id, slug]) => [slug, id])
);

interface CliffAlloc { recipient?: string; category?: string; amount?: number }
interface UnlockEvt { timestamp: number; cliffAllocations?: CliffAlloc[] }
interface IndexEntry {
  protocolSlug: string;
  nextEvent?: { date: number; toUnlock: number; proportion: number } | null;
  unlockEvents?: UnlockEvt[];
}

const iso = (unixSeconds: number) => new Date(unixSeconds * 1000).toISOString().slice(0, 10);

function buildDetail(entry: IndexEntry): LiveUnlockDetail {
  const ev = entry.nextEvent;
  const base: LiveUnlock =
    ev && ev.date && typeof ev.toUnlock === "number"
      ? { nextDate: iso(ev.date), toUnlock: ev.toUnlock, proportion: ev.proportion ?? 0 }
      : { nextDate: "", toUnlock: 0, proportion: 0 };

  const all: LiveEvent[] = [];
  for (const ue of entry.unlockEvents ?? []) {
    if (!ue.timestamp) continue;
    for (const a of ue.cliffAllocations ?? []) {
      if (!a.amount || a.amount <= 0) continue;
      all.push({ date: iso(ue.timestamp), tokens: a.amount, category: a.recipient || a.category || "Liberación", type: "cliff" });
    }
  }
  all.sort((a, b) => a.date.localeCompare(b.date));

  // Acotamos el payload: últimos 8 eventos pasados + próximos 40.
  const today = new Date().toISOString().slice(0, 10);
  const past = all.filter(e => e.date < today).slice(-8);
  const future = all.filter(e => e.date >= today).slice(0, 40);

  return { ...base, events: [...past, ...future] };
}

async function getCache(): Promise<Record<string, LiveUnlockDetail>> {
  const now = Date.now();
  if (cache && now - cache.ts < TTL) return cache.data;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const res = await fetch(SRC, { headers: { Accept: "application/json" }, cache: "no-store", signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`status ${res.status}`);

  const json = (await res.json()) as { data?: IndexEntry[] };
  const out: Record<string, LiveUnlockDetail> = {};
  for (const entry of json.data ?? []) {
    const id = SLUG_TO_ID[entry.protocolSlug];
    if (!id) continue;
    out[id] = buildDetail(entry);
  }
  cache = { data: out, ts: now };
  return out;
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");

  try {
    const data = await getCache();

    // Detalle de un token concreto (página [token]).
    if (token) {
      const detail = data[token];
      return NextResponse.json(detail && detail.events.length ? detail : {}, {
        headers: { "Cache-Control": "public, s-maxage=21600" },
      });
    }

    // Lista: solo tokens con próximo unlock real (nextDate presente), sin events.
    const list: Record<string, LiveUnlock> = {};
    for (const [id, d] of Object.entries(data)) {
      if (d.nextDate) list[id] = { nextDate: d.nextDate, toUnlock: d.toUnlock, proportion: d.proportion };
    }
    return NextResponse.json(list, { headers: { "Cache-Control": "public, s-maxage=21600" } });
  } catch (e) {
    console.error("[unlocks] fetch failed:", (e as Error).message);
    if (cache) {
      if (token) {
        const detail = cache.data[token];
        return NextResponse.json(detail && detail.events.length ? detail : {});
      }
      const list: Record<string, LiveUnlock> = {};
      for (const [id, d] of Object.entries(cache.data)) {
        if (d.nextDate) list[id] = { nextDate: d.nextDate, toUnlock: d.toUnlock, proportion: d.proportion };
      }
      return NextResponse.json(list);
    }
    return NextResponse.json({}); // el cliente cae a los datos estáticos
  }
}
