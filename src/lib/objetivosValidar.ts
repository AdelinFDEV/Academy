import type { createAdminClient } from "@/lib/supabase/admin";
import { AMBITOS, ANIMOS, CANALES, CATEGORIAS_GASTO, EMOCIONES, GASTOS_DE_STRIPE, FUENTES, ESTADOS, ETIQUETAS, FACTORES_MOTIVOS, FACTORES_NEGATIVOS, HORIZONTES, METRICAS, REPETICIONES, TIPOS, hoyISO, periodosDe, type Objetivo } from "@/lib/objetivos";

/** Nombre de una foto del diario tal como lo pone /api/admin/plan/foto: uuid + extensión. */
export const NOMBRE_FOTO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(webp|jpg|png)$/;
export const MAX_FOTOS = 6;

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
  intencion: "diario_intenciones",
  idea: "ideas",
  movimiento: "movimientos",
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
  const ambito = texto(b.ambito) || "negocio";
  const meta = Number(b.meta);
  const desde = texto(b.desde);
  const hasta = texto(b.hasta);

  if (!titulo) return { error: "Ponle un nombre al objetivo." };
  if (!(metrica in METRICAS)) return { error: "Elige cómo se mide." };
  if (!(repeticion in REPETICIONES)) return { error: "Repetición desconocida." };
  if (!(ambito in AMBITOS)) return { error: "Ámbito desconocido." };
  if (!Number.isFinite(meta) || meta <= 0) return { error: "La meta tiene que ser un número mayor que cero." };
  if (!esFecha(desde)) return { error: "Falta la fecha de inicio." };
  if (repeticion === "no" && !hasta) return { error: "Un objetivo de una sola vez necesita fecha de fin." };
  if (hasta && !esFecha(hasta)) return { error: "La fecha de fin no es válida." };
  if (hasta && hasta < desde) return { error: "La fecha de fin es anterior a la de inicio." };

  return {
    datos: {
      titulo,
      metrica,
      ambito,
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
  if (!esFecha(fecha)) return { error: "Ponle un día. Las ideas sin fecha van en la pestaña Ideas." };
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
  const etiqueta = opcional(b.etiqueta);
  const lugar = opcional(b.lugar);
  const lat = b.lat === "" || b.lat === null || b.lat === undefined ? null : Number(b.lat);
  const lng = b.lng === "" || b.lng === null || b.lng === undefined ? null : Number(b.lng);
  const fotos = Array.isArray(b.fotos) ? b.fotos.filter((f): f is string => typeof f === "string") : [];
  // Solo claves conocidas y sin repetir: lo demás se ignora.
  const lista = (v: unknown, validas: object) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === "string" && x in validas))] : [];
  const negativos = lista(b.negativos, FACTORES_NEGATIVOS);
  const motivos = lista(b.motivos, FACTORES_MOTIVOS);

  if (!textoNota) return { error: "La nota está vacía." };
  if (textoNota.length > 20000) return { error: "La nota es demasiado larga." };
  if (fecha && !esFecha(fecha)) return { error: "La fecha no es válida." };
  if (animo !== null && !(Number.isInteger(animo) && animo >= 1 && animo <= ANIMOS.length)) {
    return { error: "El ánimo va del 1 al 5." };
  }
  if (objetivoId && !/^[0-9a-f-]{36}$/i.test(objetivoId)) return { error: "Objetivo desconocido." };
  if (emocion && !(emocion in EMOCIONES)) return { error: "Emoción desconocida." };
  if (etiqueta && !(etiqueta in ETIQUETAS)) return { error: "Etiqueta desconocida." };
  if (lugar && lugar.length > 120) return { error: "El nombre del sitio es demasiado largo." };
  if ((lat === null) !== (lng === null)) return { error: "Ubicación incompleta." };
  if (lat !== null && lng !== null && !(Math.abs(lat) <= 90 && Math.abs(lng) <= 180)) return { error: "Ubicación no válida." };
  if (fotos.length > MAX_FOTOS) return { error: `Como mucho ${MAX_FOTOS} fotos por nota.` };
  if (fotos.some((f) => !NOMBRE_FOTO.test(f))) return { error: "Foto no válida." };

  return {
    datos: {
      texto: textoNota,
      ...(fecha ? { fecha } : {}),
      animo,
      emocion,
      etiqueta,
      lugar,
      lat,
      lng,
      fotos,
      objetivo_id: objetivoId,
      ancla: b.ancla === true,
      negativos,
      motivos,
      updated_at: new Date().toISOString(),
    },
  };
}

function intencion(b: Record<string, unknown>): Resultado {
  const textoIntencion = texto(b.texto);
  const horizonte = texto(b.horizonte);
  const desde = texto(b.desde);

  if (!textoIntencion) return { error: "Escribe lo que te propones." };
  if (textoIntencion.length > 200) return { error: "Mejor en una frase corta: 200 caracteres como mucho." };
  if (!(horizonte in HORIZONTES)) return { error: "¿Para esta semana o para este mes?" };
  if (!esFecha(desde)) return { error: "Fecha no válida." };

  return { datos: { texto: textoIntencion, horizonte, desde, hecha: b.hecha === true, updated_at: new Date().toISOString() } };
}

function idea(b: Record<string, unknown>): Resultado {
  const textoIdea = texto(b.texto);
  const canal = texto(b.canal);
  if (!textoIdea) return { error: "La idea está vacía." };
  if (textoIdea.length > 5000) return { error: "La idea es demasiado larga." };
  if (!(canal in CANALES)) return { error: "¿Para YouTube, la web o Telegram?" };
  return { datos: { texto: textoIdea, canal, hecha: b.hecha === true, updated_at: new Date().toISOString() } };
}

/**
 * Un movimiento apuntado a mano en la pestaña Dinero: un ingreso (con su
 * fuente) o un gasto (con su categoría). El origen no se acepta del cliente:
 * todo lo que entra por aquí es «manual»; lo del cierre lo escribe su API.
 */
function movimiento(b: Record<string, unknown>): Resultado {
  const tipo = texto(b.tipo) === "ingreso" ? "ingreso" : "gasto";
  const concepto = texto(b.concepto);
  const categoria = texto(b.categoria) || "otros";
  const fecha = texto(b.fecha);
  const hasta = texto(b.hasta);
  const importe = Number(String(b.importe ?? "").replace(",", "."));
  const recurrente = b.recurrente === true;

  if (!concepto) return { error: tipo === "ingreso" ? "¿De dónde viene el ingreso?" : "¿En qué se ha gastado?" };
  if (concepto.length > 120) return { error: "El concepto es demasiado largo." };
  if (!(categoria in (tipo === "ingreso" ? FUENTES : CATEGORIAS_GASTO))) return { error: "Categoría desconocida." };
  // Lo de Premium, sus comisiones y sus devoluciones los apunta Stripe solo.
  if (tipo === "ingreso" && categoria === "premium") return { error: "Los cobros de Premium llegan solos desde Stripe." };
  if (tipo === "gasto" && (GASTOS_DE_STRIPE as readonly string[]).includes(categoria)) return { error: "Las comisiones y devoluciones llegan solas desde Stripe." };
  if (!esFecha(fecha)) return { error: "Falta la fecha." };
  if (!Number.isFinite(importe) || importe <= 0 || importe > 1e8) return { error: "El importe tiene que ser un número mayor que cero." };
  if (hasta && !esFecha(hasta)) return { error: "La fecha de fin no es válida." };
  if (hasta && hasta < fecha) return { error: "La fecha de fin es anterior a la de inicio." };

  return {
    datos: {
      tipo,
      concepto,
      categoria,
      fecha,
      importe: Math.round(importe * 100) / 100,
      recurrente,
      hasta: recurrente && hasta ? hasta : null,
      updated_at: new Date().toISOString(),
    },
  };
}

export const VALIDAR: Record<Recurso, (b: Record<string, unknown>) => Resultado> = { objetivo, pieza, nota, intencion, idea, movimiento };

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

/**
 * El error de la base, en castellano cuando es que falta lanzar el SQL: tabla
 * (PGRST205) o columna (PGRST204 / 42703) que aún no existen.
 */
export function mensajeError(e: { code?: string; message: string }): string {
  return ["PGRST205", "PGRST204", "42703"].includes(e.code ?? "")
    ? "Falta actualizar la base de datos: ejecuta scripts/create-objetivos.sql en el SQL Editor de Supabase."
    : e.message;
}
