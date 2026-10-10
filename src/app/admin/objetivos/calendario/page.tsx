import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/site";
import { cargarBalances, cargarDineroPorMes, cargarObjetivos, cerrarPiezaPlaneada } from "@/lib/objetivosServidor";
import { esShort, subidasEntre } from "@/lib/actividadMes";
import type { VideoSubido } from "@/lib/youtube";
import { diaRumania, hoyISO, medianocheRumania, sumarDiasISO, type Pieza } from "@/lib/objetivos";
import SeccionCalendario, { type Animo, type Hecho } from "./SeccionCalendario";
import FaltaSql from "../FaltaSql";

export const dynamic = "force-dynamic";

/** "AAAA-MM" válido de la URL, o el mes actual. */
function mesPedido(mes: string | undefined, hoy: string): string {
  if (mes && /^\d{4}-(0[1-9]|1[0-2])$/.test(mes)) return mes;
  return hoy.slice(0, 7);
}

/** El lunes de la semana de `fecha`. */
function lunesDe(fecha: string): string {
  return sumarDiasISO(fecha, -((new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7));
}

/** Lunes válido de la URL (cualquier día vale: se lleva a su lunes), o el de esta semana. */
function semanaPedida(semana: string | undefined, hoy: string): string {
  if (semana && /^\d{4}-\d{2}-\d{2}$/.test(semana) && !Number.isNaN(Date.parse(`${semana}T00:00:00Z`))) return lunesDe(semana);
  return lunesDe(hoy);
}

/**
 * Da por hecha la pieza planeada de cada subida que aún no tenga una. El bot
 * ya lo hace con los vídeos largos al anunciarlos, pero los Shorts no se
 * anuncian, y un vídeo largo sale aquí antes de que el bot lo anuncie.
 */
async function cerrarSubidasPlaneadas(admin: ReturnType<typeof createAdminClient>, videos: VideoSubido[]) {
  if (!videos.length) return;
  const enlaces = videos.map((v) => `https://youtu.be/${v.id}`);
  const { data } = await admin.from("contenido_plan").select("enlace").in("enlace", enlaces);
  const cerradas = new Set((data ?? []).map((p) => p.enlace));
  await Promise.all(
    videos
      .filter((v) => !cerradas.has(`https://youtu.be/${v.id}`))
      .map((v) =>
        cerrarPiezaPlaneada(admin, {
          canal: "youtube",
          tipos: [esShort(v) ? "short" : "video"],
          cuando: new Date(v.publishedAt),
          enlace: `https://youtu.be/${v.id}`,
        })
      )
  );
}

/**
 * Calendario: vista de mes (de un vistazo) o de semana (el detalle). La vista
 * va en la URL (?vista=semana&semana=AAAA-MM-DD o ?vista=mes&mes=AAAA-MM);
 * sin ella, el navegador recuerda la última que usaste.
 */
export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ mes?: string; vista?: string; semana?: string }> }) {
  const { mes: mesUrl, vista: vistaUrl, semana: semanaUrl } = await searchParams;
  const hoy = hoyISO();
  const vista = vistaUrl === "semana" ? "semana" : "mes";

  // El rango que se pinta: [ini, fin) en días.
  let ini: string;
  let fin: string;
  let mes: string;
  let lunes: string;
  if (vista === "semana") {
    lunes = semanaPedida(semanaUrl, hoy);
    ini = lunes;
    fin = sumarDiasISO(lunes, 7);
    mes = lunes.slice(0, 7);
  } else {
    mes = mesPedido(mesUrl, hoy);
    const [a, m] = mes.split("-").map(Number);
    ini = `${mes}-01`;
    fin = new Date(Date.UTC(a, m, 1)).toISOString().slice(0, 10);
    lunes = lunesDe(mes === hoy.slice(0, 7) ? hoy : ini);
  }
  const finIncluido = sumarDiasISO(fin, -1);

  const admin = createAdminClient();
  // El día de Rumanía, no el de UTC: lo publicado a la 1 de la madrugada del
  // día 1 es de ese día.
  const desdeInstante = medianocheRumania(ini).toISOString();
  const hastaInstante = medianocheRumania(fin).toISOString();

  // En el mes, también el mes anterior: el resumen compara con él.
  const [a, m] = mes.split("-").map(Number);
  const iniAnterior = vista === "mes" ? new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 10) : ini;

  // Lo subido a YouTube, con su día real y Shorts incluidos. Va antes que las
  // piezas porque puede cerrar alguna planeada (y moverla al día real).
  const subidas = await subidasEntre(admin, new Date(desdeInstante), new Date(hastaInstante));
  if (subidas.fuente === "api") await cerrarSubidasPlaneadas(admin, subidas.videos);

  const [{ objetivos, faltaSql }, piezasRes, entradasRes, animosRes, balances, dineroMeses] = await Promise.all([
    cargarObjetivos(admin),
    admin.from("contenido_plan").select("*").gte("fecha", ini).lt("fecha", fin).order("fecha"),
    // Lo que de verdad salió, aunque no estuviera en el plan.
    admin.from("posts").select("slug, title, created_at").eq("published", true)
      .gte("created_at", desdeInstante).lt("created_at", hastaInstante),
    // El ánimo del diario. Solo las columnas que hacen falta: el texto de las
    // notas no sale del diario.
    admin.from("diario_notas").select("id, fecha, animo, emocion, etiqueta").order("created_at")
      .gte("fecha", iniAnterior).lt("fecha", fin),
    // Cierre del día: productividad, nota y dinero.
    cargarBalances(admin, iniAnterior, finIncluido),
    cargarDineroPorMes(admin),
  ]);
  if (faltaSql) return <FaltaSql />;

  const hechos: Hecho[] = [
    ...(entradasRes.data ?? []).map((p) => ({
      fecha: diaRumania(p.created_at),
      tipo: "entrada" as const,
      titulo: p.title,
      enlace: `${SITE_URL}/post/${p.slug}`,
    })),
    ...subidas.videos.map((v) => ({
      fecha: diaRumania(v.publishedAt),
      tipo: esShort(v) ? ("short" as const) : ("video" as const),
      titulo: subidas.fuente === "api" ? v.title : "Vídeo publicado en YouTube",
      enlace: `https://youtu.be/${v.id}`,
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
      vista={vista}
      vistaExplicita={!!vistaUrl}
      mes={mes}
      lunes={lunes}
      objetivos={objetivos}
      piezas={piezas}
      hechos={sueltos}
      animos={(animosRes.data ?? []) as Animo[]}
      balances={balances}
      dineroMeses={dineroMeses}
    />
  );
}
