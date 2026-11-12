import "server-only";
import { bd } from "../bd";

/**
 * Dónde vive cada imagen del foro en Supabase Storage (FORO.md §6.6).
 *
 * Dos buckets, los dos SIN policies: solo entra la clave de servicio.
 *
 *   foro-pendientes (privado)
 *     originales/<id>      lo que subió el usuario, sin tocar. Dura minutos.
 *     listas/<id>.webp     ya recodificada, a la espera de su pregunta.
 *     ocultas/<id>.webp    de una pregunta oculta por moderación.
 *   foro (público)
 *     <id>.webp            de una pregunta publicada. Es la única que se ve.
 *
 * El nombre es siempre el id que puso el servidor: nunca nada que venga del
 * usuario. Y el estado que manda es el de la tabla: `sincronizar` deja el
 * almacén como diga ella, y se puede llamar las veces que haga falta.
 */

const PRIVADO = "foro-pendientes";
const PUBLICO = "foro";

const original = (id: string) => `originales/${id}`;
const lista = (id: string) => `listas/${id}.webp`;
const oculta = (id: string) => `ocultas/${id}.webp`;
const publica = (id: string) => `${id}.webp`;

/** La URL pública de una imagen publicada. */
export function urlPublica(id: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PUBLICO}/${publica(id)}`;
}

/** URL firmada de UN SOLO USO para subir el original. Caduca sola. */
export async function urlParaSubir(id: string): Promise<string | null> {
  const { data, error } = await bd().storage.from(PRIVADO).createSignedUploadUrl(original(id));
  if (error || !data) {
    console.error("[foro] no se pudo firmar la subida");
    return null;
  }
  return data.signedUrl;
}

/** Descarga el original que subió el usuario. null si no está o pesa de más. */
export async function leerOriginal(id: string, bytesMaximos: number): Promise<Buffer | null> {
  const { data, error } = await bd().storage.from(PRIVADO).download(original(id));
  if (error || !data) return null;
  if (data.size > bytesMaximos) return null;
  return Buffer.from(await data.arrayBuffer());
}

export async function borrarOriginal(id: string): Promise<void> {
  await bd().storage.from(PRIVADO).remove([original(id)]);
}

/** Guarda la imagen ya recodificada, en privado. El tipo lo fija el servidor. */
export async function guardarLista(id: string, webp: Buffer): Promise<boolean> {
  const { error } = await bd().storage.from(PRIVADO).upload(lista(id), webp, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) console.error("[foro] no se pudo guardar una imagen recodificada");
  return !error;
}

/** URL firmada y corta para que SU AUTOR vea la imagen antes de publicar. */
export async function vistaPrevia(id: string): Promise<string | null> {
  const { data } = await bd().storage.from(PRIVADO).createSignedUrl(lista(id), 15 * 60);
  return data?.signedUrl ?? null;
}

/** Copia las imágenes recodificadas al bucket público. Todo o nada. */
export async function publicar(ids: string[]): Promise<boolean> {
  const almacen = bd().storage;
  const hechas: string[] = [];
  for (const id of ids) {
    const { error } = await almacen.from(PRIVADO).copy(lista(id), publica(id), { destinationBucket: PUBLICO });
    if (error) {
      console.error("[foro] no se pudo publicar una imagen");
      if (hechas.length) await almacen.from(PUBLICO).remove(hechas.map(publica));
      return false;
    }
    hechas.push(id);
  }
  return true;
}

/** Deshace `publicar` cuando la pregunta al final no se creó. */
export async function despublicar(ids: string[]): Promise<void> {
  if (ids.length) await bd().storage.from(PUBLICO).remove(ids.map(publica));
}

/** Tras publicar la pregunta: la copia privada ya no hace falta. */
export async function olvidarListas(ids: string[]): Promise<void> {
  if (ids.length) await bd().storage.from(PRIVADO).remove(ids.map(lista));
}

/**
 * Deja el almacén como dice la tabla para las imágenes de una pregunta:
 *   publicada → en el bucket público;
 *   oculta    → fuera del público, guardada en privado por si se restaura;
 *   borrada   → en ningún sitio.
 * Se llama después de cualquier cosa que pueda cambiar el estado de una
 * pregunta (un reporte que la oculta, una moderación, un borrado). Es
 * idempotente: mover lo que ya está en su sitio falla sin consecuencias.
 */
export async function sincronizar(preguntaId: number): Promise<void> {
  const cliente = bd();
  const { data: imagenes } = await cliente
    .from("foro_imagenes")
    .select("id, estado")
    .eq("pregunta_id", preguntaId);

  for (const img of imagenes ?? []) {
    const id = String(img.id);
    if (img.estado === "oculta") {
      await cliente.storage.from(PUBLICO).move(publica(id), oculta(id), { destinationBucket: PRIVADO });
    } else if (img.estado === "publicada") {
      await cliente.storage.from(PRIVADO).move(oculta(id), publica(id), { destinationBucket: PUBLICO });
    } else if (img.estado === "borrada") {
      await cliente.storage.from(PUBLICO).remove([publica(id)]);
      await cliente.storage.from(PRIVADO).remove([oculta(id), lista(id), original(id)]);
    }
  }
}

/**
 * La limpieza del cron: lo que se subió y nunca llegó a una pregunta.
 *   · imágenes confirmadas sin pregunta desde hace más de 24 horas;
 *   · subidas pedidas y nunca confirmadas desde hace más de 2 horas.
 * Devuelve cuántas quitó de cada.
 */
export async function limpiarHuerfanas(): Promise<{ imagenes: number; subidas: number }> {
  const cliente = bd();
  const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const haceDosHoras = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: viejas } = await cliente
    .from("foro_imagenes")
    .select("id")
    .eq("estado", "subida")
    .is("pregunta_id", null)
    .lt("creada_at", ayer)
    .limit(500);
  const idsImagenes = (viejas ?? []).map((v) => String(v.id));
  if (idsImagenes.length) {
    await cliente.storage.from(PRIVADO).remove(idsImagenes.flatMap((id) => [lista(id), original(id)]));
    await cliente.from("foro_imagenes").delete().in("id", idsImagenes).eq("estado", "subida").is("pregunta_id", null);
  }

  const { data: sinConfirmar } = await cliente
    .from("foro_subidas")
    .select("id")
    .is("confirmada_at", null)
    .lt("creada_at", haceDosHoras)
    .limit(500);
  const idsSubidas = (sinConfirmar ?? []).map((s) => String(s.id));
  if (idsSubidas.length) {
    await cliente.storage.from(PRIVADO).remove(idsSubidas.map(original));
    await cliente.from("foro_subidas").delete().in("id", idsSubidas).is("confirmada_at", null);
  }

  return { imagenes: idsImagenes.length, subidas: idsSubidas.length };
}
