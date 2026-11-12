import "server-only";
import { tacoEnTexto } from "@/lib/perfilPublico";
import { LIMITES } from "../limites";
import { detectar } from "./detectores";
import { buscarEnlaces } from "./enlaces";
import { huella, largo, limpiar, paraComparar } from "./normalizar";

/**
 * El filtro por el que pasa TODO texto antes de publicarse (FORO.md §6.4).
 * Es la única barrera previa del foro: no hay revisión humana.
 *
 * Entra el texto tal como lo escribió el usuario. Sale, o el texto limpio y
 * listo para guardar con su huella, o el motivo del rechazo en una frase que
 * se le enseña. Lo rechazado no se guarda en ningún sitio; solo se cuenta
 * qué detector saltó (`foro_registrar_rechazo`).
 *
 * El orden importa: primero se limpia, luego se mide (los límites cuentan lo
 * que queda, no los caracteres invisibles), y los detectores van al final,
 * sobre la forma de comparar.
 */

export type ClaseDeTexto = "pregunta" | "respuesta" | "replica";

export type TextoFiltrado =
  | { ok: true; titulo: string | null; cuerpo: string; huella: string; tieneEnlaces: boolean }
  | { ok: false; detector: string; mensaje: string };

const rechazo = (detector: string, mensaje: string): TextoFiltrado => ({ ok: false, detector, mensaje });

export function filtrar(clase: ClaseDeTexto, entrada: { titulo?: string; cuerpo: string }): TextoFiltrado {
  const limite = LIMITES[clase];
  const cuerpo = limpiar(entrada.cuerpo);
  const titulo = clase === "pregunta" ? limpiar(entrada.titulo ?? "", { unaLinea: true }) : null;

  // ── Medidas ──
  if (titulo !== null) {
    const n = largo(titulo);
    if (n < LIMITES.titulo.min) return rechazo("largo", `El título tiene que tener al menos ${LIMITES.titulo.min} caracteres.`);
    if (n > LIMITES.titulo.max) return rechazo("largo", `El título no puede pasar de ${LIMITES.titulo.max} caracteres.`);
  }
  const n = largo(cuerpo);
  if (n < limite.min) return rechazo("largo", `El texto tiene que tener al menos ${limite.min} caracteres.`);
  if (n > limite.max) return rechazo("largo", `El texto no puede pasar de ${limite.max} caracteres.`);
  if ((cuerpo.match(/\n/g) ?? []).length > LIMITES.saltos) {
    return rechazo("largo", "El texto tiene demasiados saltos de línea.");
  }

  const todo = titulo ? `${titulo}\n${cuerpo}` : cuerpo;

  // Que diga algo: no solo signos, ni una letra repetida, ni todo a gritos.
  const comparable = paraComparar(todo);
  const letras = comparable.replace(/[^a-z]/g, "");
  // Una réplica puede ser muy corta («Sí, eso»): se le pide menos.
  const [minLetras, minDistintas] = clase === "replica" ? [3, 3] : [10, 5];
  if (letras.length < minLetras || new Set(letras).size < minDistintas) {
    return rechazo("sin_contenido", "El mensaje no dice nada: escribe tu duda con palabras.");
  }
  if (/(.)\1{9,}/.test(comparable)) {
    return rechazo("sin_contenido", "Quita los caracteres repetidos del mensaje.");
  }
  const letrasOriginales = todo.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (letrasOriginales.length >= 30 && letrasOriginales === letrasOriginales.toUpperCase()) {
    return rechazo("mayusculas", "No escribas todo en mayúsculas.");
  }

  // ── Enlaces: solo los de la lista blanca ──
  // Se buscan en las dos formas: en la limpia (la que se guarda) y en la de
  // comparar, donde un dominio escrito con letras de otro alfabeto ya se ve.
  const enlaces = [...buscarEnlaces(todo), ...buscarEnlaces(comparable)];
  const malo = enlaces.find((e) => !e.permitido);
  if (malo) {
    return rechazo(
      "enlace",
      "El mensaje lleva un enlace a una web que no está permitida en el foro. Solo se puede enlazar a esta academia, a YouTube, a exploradores de bloques y a webs oficiales.",
    );
  }
  if (enlaces.length > 8) return rechazo("enlace", "Demasiados enlaces en un solo mensaje.");

  // ── Detectores de estafa y palabras malsonantes ──
  let sinEnlaces = comparable;
  for (const e of enlaces) sinEnlaces = sinEnlaces.split(e.texto.toLowerCase()).join(" ");
  const deteccion = detectar(sinEnlaces, comparable);
  if (deteccion) return rechazo(deteccion.detector, deteccion.mensaje);

  if (tacoEnTexto(comparable)) {
    return rechazo("malsonante", "El mensaje lleva una palabra que no está permitida en el foro. Dilo con respeto.");
  }

  return {
    ok: true,
    titulo,
    cuerpo,
    huella: titulo ? huella(titulo, cuerpo) : huella(cuerpo),
    tieneEnlaces: enlaces.length > 0,
  };
}
