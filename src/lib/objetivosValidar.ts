import type { createAdminClient } from "@/lib/supabase/admin";
import { ANIMOS, CANALES, EMOCIONES, ESTADOS, METRICAS, REPETICIONES, TIPOS, hoyISO, periodosDe, type Objetivo } from "@/lib/objetivos";

/**
 * Lo que entra en las tablas de /admin/objetivos pasa por aquí.
 *
 * Cada validador devuelve SOLO las columnas que conoce: el cuerpo de la
 * petición nunca se inserta tal cual, para que no pueda escribir columnas
 * arbitrarias. Sirven igual para crear que para editar, porque el panel manda
 * siempre la ficha entera.
 */

export const RECURSOS = {
  objetivo: "objetivos",
  pieza: "contenido_plan",
  nota: "diario_notas",
} as const;
export type Recurso = keyof typeof RECURSOS;

type Resultado = { datos: Record<string, unknown>; error?: never } | { error: string; datos?: never };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function opcional(v: unknown): string | null {
  const t = texto(v);
  return t ? t : null;
}

function esFecha(v: string): boolean {
  return FECHA.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

function objetivo(b: Record<string, unknown>): Resultado {
  const titulo = texto(b.titulo);
  const metrica = texto(b.metrica);
  const repeticion = texto(b.repeticion) || "no";
  const meta = Number(b.meta);
  const desde = texto(b.desde);
  const hasta = texto(b.hasta);

  if (!titulo) return { error: "Ponle un nombre al objetivo." };
  if (!(metrica in METRICAS)) return { error: "Elige cómo se mide." };
  if (!(repeticion in REPETICIONES)) return { error: "Repetición desconocida." };
  if (!Number.isFinite(meta) || meta <= 0) return { error: "La meta tiene que ser un número mayor que cero." };
  if (!esFecha(desde)) return { error: "Falta la fecha de inicio." };
  if (repeticion === "no" && !hasta) return { error: "Un objetivo de una sola vez necesita fecha de fin." };
  if (hasta && !esFecha(hasta)) return { error: "La fecha de fin no es válida." };
  if (hasta && hasta < desde) return { error: "La fecha de fin es anterior a la de inicio." };

  return {
    datos: {
      titulo,
      metrica,
      repeticion,
      meta,
      desde,
      hasta: hasta || null,
      notas: opcional(b.notas),
      archivado: b.archivado === true,
      updated_at: new Date().toISOString(),
    },
  };
}

function pieza(b: Record<string, unknown>): Resultado {
  const titulo = texto(b.titulo);
  const canal = texto(b.canal);
  const tipo = texto(b.tipo);
  const estado = texto(b.estado) || "idea";
  const fecha = texto(b.fecha);
  const enlace = opcional(b.enlace);

  if (!titulo) return { error: "Ponle un título a la pieza." };
  if (!(canal in CANALES)) return { error: "Elige el canal." };
  if (!(tipo in TIPOS)) return { error: "Elige el tipo." };
  if (!(estado in ESTADOS)) return { error: "Estado desconocido." };
  if (fecha && !esFecha(fecha)) return { error: "La fecha no es válida." };
  if (enlace && !/^https?:\/\//i.test(enlace)) return { error: "El enlace tiene que empezar por http:// o https://." };

  return {
    datos: {
      titulo,
      canal,
      tipo,
      estado,
      fecha: fecha || null,
      enlace,
      notas: opcional(b.notas),
      // Si deja de estar publicada, se limpia la fecha. Si está publicada NO se
      // toca aquí: la pone la API solo cuando aún no la tiene
      // (marcarPublicada), para que editar una pieza ya publicada no le cambie
      // el día en que salió.
      ...(estado === "publicado" ? {} : { publicado_en: null }),
      updated_at: new Date().toISOString(),
    },
  };
}

function nota(b: Record<string, unknown>): Resultado {
  const textoNota = texto(b.texto);
  const fecha = texto(b.fecha);
  const animo = b.animo === null || b.animo === undefined || b.animo === "" ? null : Number(b.animo);
  const objetivoId = opcional(b.objetivo_id);
  const emocion = opcional(b.emocion);

  if (!textoNota) return { error: "La nota está vacía." };
  if (textoNota.length > 20000) return { error: "La nota es demasiado larga." };
  if (fecha && !esFecha(fecha)) return { error: "La fecha no es válida." };
  if (animo !== null && !(Number.isInteger(animo) && animo >= 1 && animo <= ANIMOS.length)) {
    return { error: "El ánimo va del 1 al 5." };
  }
  if (objetivoId && !/^[0-9a-f-]{36}$/i.test(objetivoId)) return { error: "Objetivo desconocido." };
  if (emocion && !(emocion in EMOCIONES)) return { error: "Emoción desconocida." };

  return {
    datos: {
      texto: textoNota,
      ...(fecha ? { fecha } : {}),
      animo,
      emocion,
      objetivo_id: objetivoId,
      ancla: b.ancla === true,
      updated_at: new Date().toISOString(),
    },
  };
}

export const VALIDAR: Record<Recurso, (b: Record<string, unknown>) => Resultado> = { objetivo, pieza, nota };

export function esRecurso(v: string): v is Recurso {
  return v in RECURSOS;
}

/**
 * Pone la fecha de publicación a una pieza recién marcada como publicada.
 * Solo si aún no la tiene: si ya estaba publicada, conserva la original.
 */
export async function marcarPublicada(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  datos: Record<string, unknown>
) {
  if (datos.estado !== "publicado") return;
  await admin.from("contenido_plan").update({ publicado_en: new Date().toISOString() }).eq("id", id).is("publicado_en", null);
}

/**
 * Fija lo que lleva un objetivo manual en su periodo actual. Lo usan el
 * formulario («Llevo en este periodo») y el botón +1. Cada periodo tiene su
 * fila en `objetivo_registros`: es lo que deja historial.
 */
export async function fijarProgreso(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  calcular: (actual: number) => number
): Promise<string | null> {
  const { data: o } = await admin.from("objetivos").select("*").eq("id", id).maybeSingle();
  if (!o) return "Objetivo no encontrado.";
  if (o.metrica !== "manual") return "Este objetivo se mide solo.";

  const periodo = periodosDe(o as Objetivo, hoyISO()).actual.desde;
  const { data: fila } = await admin
    .from("objetivo_registros")
    .select("valor")
    .eq("objetivo_id", id)
    .eq("periodo", periodo)
    .maybeSingle();

  const valor = Math.max(0, calcular(Number(fila?.valor ?? 0)));
  if (!Number.isFinite(valor)) return "Valor no válido.";
  const { error } = await admin
    .from("objetivo_registros")
    .upsert({ objetivo_id: id, periodo, valor, updated_at: new Date().toISOString() }, { onConflict: "objetivo_id,periodo" });
  return error ? error.message : null;
}
