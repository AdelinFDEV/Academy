import "server-only";
import { z } from "zod";
import { bd, llamar } from "../bd";
import { borrarOriginal, guardarLista, leerOriginal, urlParaSubir, vistaPrevia } from "../imagenes/almacen";
import { comprobarYRecodificar, IMAGEN } from "../imagenes/comprobar";
import type { ResultadoAccion } from "../peticion";

/**
 * Subir una imagen para una pregunta, en dos pasos (FORO.md §6.6):
 *
 *   1. `pedirSubida`: la base de datos comprueba el permiso y el tope de 12 al
 *      día, apunta la subida y se devuelve una URL firmada de un solo uso. El
 *      navegador sube ahí el archivo, a un bucket privado.
 *   2. `confirmarSubida`: el servidor descarga el archivo, comprueba qué es de
 *      verdad, lo recodifica a WebP y lo deja listo, todavía en privado. El
 *      original se borra pase lo que pase.
 *
 * La imagen no se ve en ningún sitio hasta que su pregunta se publica.
 */

export const esquemaPedirSubida = z.strictObject({});

export async function pedirSubida(usuarioId: string): Promise<ResultadoAccion> {
  const r = await llamar("foro_pedir_subida", { p_usuario: usuarioId });
  if (!r.ok) return r;
  const id = String(r.datos.id);
  const url = await urlParaSubir(id);
  if (!url) return { ok: false, error: "interno" };
  return { ok: true, datos: { id, url, bytesMaximos: IMAGEN.bytesMaximos } };
}

export const esquemaConfirmarSubida = z.strictObject({ id: z.uuid() });

export async function confirmarSubida(usuarioId: string, d: z.infer<typeof esquemaConfirmarSubida>): Promise<ResultadoAccion> {
  // ¿Es suya, y sigue sin confirmar? Se mira ANTES de descargar nada: si no,
  // con el id de otro se podría hacer trabajar al servidor con su archivo.
  const { data: subida } = await bd()
    .from("foro_subidas")
    .select("id, confirmada_at")
    .eq("id", d.id)
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  if (!subida || subida.confirmada_at) return { ok: false, error: "imagen_no_valida" };

  const original = await leerOriginal(d.id, IMAGEN.bytesMaximos);
  if (!original) return { ok: false, error: "imagen_no_valida" };

  const imagen = await comprobarYRecodificar(original);
  // El original sobra ya, valga o no: lo que se guarda es el archivo nuevo.
  await borrarOriginal(d.id);
  if (!imagen.ok) return { ok: false, error: "rechazado", mensaje: imagen.motivo };

  if (!(await guardarLista(d.id, imagen.webp))) return { ok: false, error: "interno" };

  const r = await llamar("foro_confirmar_subida", {
    p_usuario: usuarioId,
    p_id: d.id,
    p_ancho: imagen.ancho,
    p_alto: imagen.alto,
    p_bytes: imagen.webp.length,
  });
  if (!r.ok) return r;

  return { ok: true, datos: { id: d.id, ancho: imagen.ancho, alto: imagen.alto, vista: await vistaPrevia(d.id) } };
}

/**
 * ¿Son todas estas imágenes de este usuario, y están listas y sin pregunta?
 * Se comprueba antes de copiarlas al bucket público. La función de Postgres
 * lo vuelve a comprobar al crear la pregunta.
 */
export async function sonSuyasYListas(usuarioId: string, ids: string[]): Promise<boolean> {
  if (new Set(ids).size !== ids.length) return false;
  const { data } = await bd()
    .from("foro_imagenes")
    .select("id")
    .in("id", ids)
    .eq("autor_id", usuarioId)
    .eq("estado", "subida")
    .is("pregunta_id", null);
  return (data ?? []).length === ids.length;
}
