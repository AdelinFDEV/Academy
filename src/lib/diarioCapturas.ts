import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Las capturas de una operación del Diario: el gráfico antes de entrar y
 * después de cerrar (13-11-2026). Solo servidor.
 *
 * Viven en el bucket PRIVADO `diario-capturas`, sin ninguna policy: solo entra
 * la clave de servicio. El navegador nunca habla con Storage; sube y pide las
 * imágenes a `/api/trades/captura`, que comprueba que la operación es de quien
 * la pide y, para verlas, da una URL firmada de pocos minutos.
 *
 * Lo que se guarda no es el archivo que subió el usuario, sino un WebP
 * recodificado por el servidor (`comprobarYRecodificar`, el mismo filtro que
 * las imágenes del foro): sin metadatos y sin nada escondido.
 *
 * SQL: `scripts/add-trades-capturas.sql`.
 */

export const BUCKET = "diario-capturas";
export const TIPOS = ["antes", "despues"] as const;
export type TipoCaptura = (typeof TIPOS)[number];

/** Columna de `trades` que dice cuándo se subió cada captura (null = no hay). */
export const COLUMNA: Record<TipoCaptura, "captura_antes" | "captura_despues"> = {
  antes: "captura_antes",
  despues: "captura_despues",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const esUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);
export const esTipo = (v: unknown): v is TipoCaptura => typeof v === "string" && (TIPOS as readonly string[]).includes(v);

/** Una carpeta por usuario: así un reinicio borra la suya entera. */
const ruta = (userId: string, tradeId: string, tipo: TipoCaptura) => `${userId}/${tradeId}-${tipo}.webp`;

export async function guardarCaptura(userId: string, tradeId: string, tipo: TipoCaptura, webp: Buffer): Promise<string | null> {
  const { error } = await createAdminClient().storage.from(BUCKET).upload(ruta(userId, tradeId, tipo), webp, {
    contentType: "image/webp",
    upsert: true,
    cacheControl: "300",
  });
  return error ? error.message : null;
}

export async function borrarCaptura(userId: string, tradeId: string, tipo: TipoCaptura): Promise<void> {
  await createAdminClient().storage.from(BUCKET).remove([ruta(userId, tradeId, tipo)]);
}

/** Al borrar una operación: sus dos capturas, existan o no. */
export async function borrarCapturasDeOperacion(userId: string, tradeId: string): Promise<void> {
  await createAdminClient().storage.from(BUCKET).remove(TIPOS.map((t) => ruta(userId, tradeId, t)));
}

/** Al reiniciar el diario: toda la carpeta del usuario, de mil en mil. */
export async function borrarCapturasDeUsuario(userId: string): Promise<void> {
  const almacen = createAdminClient().storage.from(BUCKET);
  for (let vuelta = 0; vuelta < 50; vuelta++) {
    const { data } = await almacen.list(userId, { limit: 1000 });
    if (!data?.length) return;
    const { error } = await almacen.remove(data.map((f) => `${userId}/${f.name}`));
    if (error) return;
  }
}

/** URL para ver una captura durante unos minutos. */
export async function urlDeCaptura(userId: string, tradeId: string, tipo: TipoCaptura): Promise<string | null> {
  const { data } = await createAdminClient().storage.from(BUCKET).createSignedUrl(ruta(userId, tradeId, tipo), 300);
  return data?.signedUrl ?? null;
}
