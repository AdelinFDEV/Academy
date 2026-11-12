import "server-only";
import { z } from "zod";
import { bd, llamar } from "../bd";
import { sincronizar } from "../imagenes/almacen";
import type { ResultadoAccion } from "../peticion";
import { LIMITES } from "../limites";
import { huella, limpiar } from "../texto/normalizar";

/**
 * Lo que hace el admin (FORO.md §7). Solo se llega aquí por `rutaForoAdmin`,
 * que ya ha comprobado que quien llama es admin con la verificación en dos
 * pasos pasada; cada función de Postgres vuelve a comprobar el rol.
 *
 * Ninguna acción recibe el id de un usuario: se sanciona AL AUTOR DE UN
 * MENSAJE, y es el servidor quien busca quién es. Así ni el panel de
 * moderación necesita ids de usuario en el navegador.
 *
 * Todo queda en el registro (`foro_moderacion`), que no se puede editar ni
 * borrar. El motivo de ocultar, borrar o sancionar lo ve el afectado.
 */

const idPregunta = z.int().positive();
const idRespuesta = z.uuid();
const motivo = z.string().max(2000).optional();

/** El motivo, limpio y recortado a lo que admite la tabla. */
const motivoLimpio = (m: string | undefined) => Array.from(limpiar(m ?? "")).slice(0, 1000).join("");

export const esquemaModerar = z.strictObject({
  accion: z.enum(["ocultar", "restaurar", "borrar", "desestimar", "cerrar", "reabrir", "fijar", "desfijar", "mover"]),
  pregunta: idPregunta,
  respuesta: idRespuesta.optional(),
  motivo,
  categoria: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).max(40).optional(),
});

export async function moderar(adminId: string, d: z.infer<typeof esquemaModerar>): Promise<ResultadoAccion> {
  const r = await llamar("foro_moderar", {
    p_admin: adminId,
    p_accion: d.accion,
    p_pregunta: d.pregunta,
    p_respuesta: d.respuesta ?? null,
    p_motivo: motivoLimpio(d.motivo),
    p_categoria: d.categoria ?? null,
  });
  // Ocultar, restaurar o borrar una PREGUNTA mueve sus imágenes: al público,
  // fuera de él, o a ningún sitio.
  if (r.ok && !d.respuesta && ["ocultar", "restaurar", "borrar"].includes(d.accion)) {
    await sincronizar(d.pregunta);
  }
  return r.ok ? { ok: true, datos: {} } : r;
}

export const esquemaSancionar = z.strictObject({
  /** El mensaje por el que se sanciona: de él sale a quién. */
  pregunta: idPregunta,
  respuesta: idRespuesta.optional(),
  tipo: z.enum(["aviso", "suspension", "expulsion"]),
  /** Solo en una suspensión: 7 la primera, 30 la siguiente (FORO.md §7.3). */
  dias: z.int().min(1).max(365).optional(),
  motivo: z.string().min(3).max(2000),
});

export async function sancionarAutor(adminId: string, d: z.infer<typeof esquemaSancionar>): Promise<ResultadoAccion> {
  const cliente = bd();
  const { data: mensaje } = d.respuesta
    ? await cliente.from("foro_respuestas").select("autor_id").eq("id", d.respuesta).eq("pregunta_id", d.pregunta).maybeSingle()
    : await cliente.from("foro_preguntas").select("autor_id").eq("id", d.pregunta).maybeSingle();
  // Sin autor: el mensaje no existe o su cuenta ya se borró.
  if (!mensaje?.autor_id) return { ok: false, error: "no_existe" };

  const r = await llamar("foro_sancionar", {
    p_admin: adminId,
    p_usuario: mensaje.autor_id,
    p_tipo: d.tipo,
    p_dias: d.tipo === "suspension" ? (d.dias ?? 7) : null,
    p_motivo: motivoLimpio(d.motivo),
  });
  return r.ok ? { ok: true, datos: {} } : r;
}

export const esquemaLevantar = z.strictObject({ sancion: z.uuid(), motivo });

export async function levantarSancion(adminId: string, d: z.infer<typeof esquemaLevantar>): Promise<ResultadoAccion> {
  const r = await llamar("foro_levantar_sancion", {
    p_admin: adminId,
    p_sancion: d.sancion,
    p_motivo: motivoLimpio(d.motivo),
  });
  return r.ok ? { ok: true, datos: {} } : r;
}

export const esquemaModo = z.strictObject({ modo: z.enum(["cerrado", "lectura", "abierto"]), motivo });

/** El interruptor: `lectura` corta toda escritura en el acto, sin desplegar nada. */
export function cambiarModo(adminId: string, d: z.infer<typeof esquemaModo>): Promise<ResultadoAccion> {
  return llamar("foro_cambiar_modo", { p_admin: adminId, p_modo: d.modo, p_motivo: motivoLimpio(d.motivo) });
}

export const esquemaEditarAdmin = z.strictObject({
  pregunta: idPregunta,
  respuesta: idRespuesta.optional(),
  /** Solo al editar una pregunta, y solo si se quiere cambiar. */
  titulo: z.string().min(1).max(LIMITES.titulo.max * 2).optional(),
  cuerpo: z.string().min(1).max(LIMITES.pregunta.max * 2),
  motivo: z.string().min(3).max(2000),
});

/**
 * El admin corrige un mensaje ajeno: quitar un teléfono o una frase sin tener
 * que ocultar el mensaje entero. Queda marcado «editado por moderación», la
 * versión anterior se guarda y el motivo va al registro.
 *
 * El texto se limpia (invisibles, espacios) pero NO pasa por los detectores:
 * es el admin quien lo escribe. Las longitudes las vigila la tabla.
 */
export async function editarComoAdmin(adminId: string, d: z.infer<typeof esquemaEditarAdmin>): Promise<ResultadoAccion> {
  const cuerpo = limpiar(d.cuerpo);
  const titulo = !d.respuesta && d.titulo ? limpiar(d.titulo, { unaLinea: true }) : null;
  const r = await llamar("foro_editar_admin", {
    p_admin: adminId,
    p_pregunta: d.pregunta,
    p_respuesta: d.respuesta ?? null,
    p_titulo: titulo,
    p_cuerpo: cuerpo,
    // Sin título nuevo la huella sale solo del cuerpo: sirve igual para cazar duplicados.
    p_huella: titulo ? huella(titulo, cuerpo) : huella(cuerpo),
    p_motivo: motivoLimpio(d.motivo),
  });
  return r.ok ? { ok: true, datos: {} } : r;
}
