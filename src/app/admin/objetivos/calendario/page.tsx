import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { cargarObjetivos } from "@/lib/objetivosServidor";
import { diaRumania, hoyISO, medianocheRumania, type Pieza } from "@/lib/objetivos";
import SeccionCalendario, { type Hecho } from "./SeccionCalendario";
import FaltaSql from "../FaltaSql";

export const dynamic = "force-dynamic";

/** "AAAA-MM" válido de la URL, o el mes actual. */
function mesPedido(mes: string | undefined, hoy: string): string {
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return mes;
  return hoy.slice(0, 7);
}

/** Primer día del mes y primer día del mes siguiente, en "AAAA-MM-DD". */
function limitesMes(mes: string): { ini: string; fin: string } {
  const [a, m] = mes.split("-").map(Number);
  return { ini: `${mes}-01`, fin: new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 10) };
}

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: mesUrl } = await searchParams;
  const hoy = hoyISO();
  const mes = mesPedido(mesUrl, hoy);
  const { ini, fin } = limitesMes(mes);
  const admin = createAdminClient();
  // El mes de Rumanía, no el de UTC: lo publicado a la 1 de la madrugada del
  // día 1 es de este mes.
  const desdeInstante = medianocheRumania(ini).toISOString();
  const hastaInstante = medianocheRumania(fin).toISOString();

  const [{ objetivos, faltaSql }, piezasRes, entradasRes, videosRes] = await Promise.all([
    cargarObjetivos(admin),
    admin.from("contenido_plan").select("*").gte("fecha", ini).lt("fecha", fin).order("fecha"),
    // Lo que de verdad salió ese mes, aunque no estuviera en el plan.
    admin.from("posts").select("slug, title, created_at").eq("published", true)
      .gte("created_at", desdeInstante).lt("created_at", hastaInstante),
    admin.from("content_announcements").select("ref, announced_at").eq("kind", "video")
      .gte("announced_at", desdeInstante).lt("announced_at", hastaInstante),
  ]);
  if (faltaSql) return <FaltaSql />;

  const hechos: Hecho[] = [
    ...(entradasRes.data ?? []).map((p) => ({
      fecha: diaRumania(p.created_at),
      tipo: "entrada" as const,
      titulo: p.title,
      enlace: `${SITE_URL}/post/${p.slug}`,
    })),
    ...(videosRes.data ?? []).map((v) => ({
      fecha: diaRumania(v.announced_at),
      tipo: "video" as const,
      titulo: "Vídeo publicado en YouTube",
      enlace: `https://youtu.be/${v.ref}`,
    })),
  ];

  // Lo detectado que ya cerró una pieza planeada (mismo enlace) no se repite:
  // la pieza verde ya lo cuenta.
  const piezas = (piezasRes.data ?? []) as Pieza[];
  const enlacesCerrados = new Set(piezas.map((p) => p.enlace).filter(Boolean));
  const sueltos = hechos.filter((h) => !enlacesCerrados.has(h.enlace));

  return (
    <SeccionCalendario
      hoy={hoy}
      mes={mes}
      objetivos={objetivos}
      piezas={piezas}
      hechos={sueltos}
    />
  );
}
