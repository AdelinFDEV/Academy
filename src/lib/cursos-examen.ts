import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { notaCertificado, puntuar, type EstadoCurso } from "@/lib/cursos-progreso";
import type { CursoCompleto, Sesion } from "@/lib/cursos";

/**
 * Los exámenes, en el servidor. **Aquí y solo aquí se leen las respuestas
 * correctas.** Lo que sale hacia el navegador pasa por `PreguntaVisible`, que
 * no tiene `correcta` ni `explicacion`: si algún día hace falta otro campo, se
 * añade a ese tipo y se comprueba que no filtra la solución.
 *
 * El examen se identifica por el ORDEN del módulo (1, 2, 3…) o por `"final"`,
 * que es como aparece en la URL: `/aula/<curso>/examen/2`.
 */

export type ClaveExamen = number | "final";

export interface PreguntaVisible {
  id: string;
  enunciado: string;
  opciones: string[];
}

type FilaPregunta = {
  id: string;
  enunciado: string;
  opciones: string[];
  correcta: number;
  explicacion: string | null;
  leccion_id: string | null;
};

export function claveDesdeTexto(texto: string): ClaveExamen | null {
  if (texto === "final") return "final";
  const n = Number(texto);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** El módulo de un examen, o `null` si es el final. `undefined` si no existe. */
export function moduloDeExamen(curso: CursoCompleto, clave: ClaveExamen) {
  if (clave === "final") return null;
  return curso.modulos.find((m) => m.orden === clave);
}

export function estadoDeExamen(estado: EstadoCurso, clave: ClaveExamen) {
  if (clave === "final") return estado.final;
  return estado.modulos.find((e) => e.modulo.orden === clave)?.examen ?? null;
}

/** Fisher-Yates con números del sistema, no `Math.random`, para el sorteo. */
function barajar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = randomBytes(4).readUInt32BE(0) % (i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

async function bancoDe(cursoId: string, moduloId: string | null): Promise<FilaPregunta[]> {
  let consulta = createAdminClient()
    .from("curso_preguntas")
    .select("id, enunciado, opciones, correcta, explicacion, leccion_id")
    .eq("curso_id", cursoId);
  consulta = moduloId ? consulta.eq("modulo_id", moduloId) : consulta.is("modulo_id", null);
  const { data } = await consulta;
  return (data ?? []) as FilaPregunta[];
}

/** Las preguntas de un intento, en su orden y SIN la solución. */
export async function preguntasDeIntento(intentoId: string, userId: string): Promise<PreguntaVisible[] | null> {
  const db = createAdminClient();
  const { data: intento } = await db
    .from("curso_intentos")
    .select("preguntas, user_id")
    .eq("id", intentoId)
    .single();
  if (!intento || intento.user_id !== userId) return null;

  const ids = intento.preguntas as string[];
  const { data } = await db.from("curso_preguntas").select("id, enunciado, opciones").in("id", ids);
  const porId = new Map((data ?? []).map((p) => [p.id as string, p]));
  return ids
    .map((id) => porId.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ id: p.id as string, enunciado: p.enunciado as string, opciones: p.opciones as string[] }));
}

/**
 * Abre un intento nuevo, con sus preguntas sorteadas, o devuelve el que ya
 * estaba abierto. Quien llama ya ha comprobado que el examen está
 * `disponible` o `abierto`.
 */
export async function abrirIntento(
  sesion: Sesion,
  curso: CursoCompleto,
  clave: ClaveExamen,
): Promise<{ intentoId: string; preguntas: PreguntaVisible[] } | { error: string }> {
  const modulo = moduloDeExamen(curso, clave);
  if (modulo === undefined) return { error: "Ese examen no existe." };
  const moduloId = modulo?.id ?? null;
  const db = createAdminClient();

  let abierto = db
    .from("curso_intentos")
    .select("id")
    .eq("user_id", sesion.userId)
    .eq("curso_id", curso.curso.id)
    .eq("estado", "abierto");
  abierto = moduloId ? abierto.eq("modulo_id", moduloId) : abierto.is("modulo_id", null);
  const { data: yaAbierto } = await abierto.maybeSingle();

  if (yaAbierto) {
    const preguntas = await preguntasDeIntento(yaAbierto.id, sesion.userId);
    return preguntas ? { intentoId: yaAbierto.id, preguntas } : { error: "No se pudo recuperar el examen." };
  }

  const banco = await bancoDe(curso.curso.id, moduloId);
  const cuantas = modulo ? modulo.preguntas_examen : curso.curso.preguntas_final;
  if (banco.length === 0) return { error: "Este examen todavía no tiene preguntas." };

  const elegidas = barajar(banco).slice(0, Math.min(cuantas, banco.length));
  const { data: nuevo, error } = await db
    .from("curso_intentos")
    .insert({
      user_id: sesion.userId,
      curso_id: curso.curso.id,
      modulo_id: moduloId,
      preguntas: elegidas.map((p) => p.id),
    })
    .select("id")
    .single();

  // El índice único de intentos abiertos frena una carrera (dos pestañas
  // pulsando «Empezar» a la vez): la segunda falla y se le da la primera.
  if (error || !nuevo) {
    const { data: ganador } = await abierto.maybeSingle();
    if (!ganador) return { error: "No se pudo abrir el examen." };
    const preguntas = await preguntasDeIntento(ganador.id, sesion.userId);
    return preguntas ? { intentoId: ganador.id, preguntas } : { error: "No se pudo recuperar el examen." };
  }

  return {
    intentoId: nuevo.id,
    preguntas: elegidas.map((p) => ({ id: p.id, enunciado: p.enunciado, opciones: p.opciones })),
  };
}

export interface Correccion {
  nota: number;
  aciertos: number;
  fallos: number;
  aprobado: boolean;
  notaMinima: number;
  /**
   * Una por pregunta. La solución y su explicación SOLO van si aprobó: con
   * un suspenso se dice qué falló y qué lección repasar, no cuál era la buena,
   * o el siguiente intento se aprobaría de memoria.
   */
  detalle: {
    id: string;
    acertada: boolean;
    elegida: number;
    correcta?: number;
    explicacion?: string | null;
    repasar?: { slug: string; titulo: string } | null;
  }[];
  certificado?: { codigo: string; notaFinal: number };
}

/**
 * Corrige un intento abierto. Comprueba que es del alumno, que está abierto y
 * que trae respuesta para TODAS sus preguntas (son obligatorias).
 */
export async function entregarIntento(
  sesion: Sesion,
  curso: CursoCompleto,
  intentoId: string,
  respuestas: Record<string, number>,
): Promise<Correccion | { error: string; status: number }> {
  const db = createAdminClient();
  const { data: intento } = await db
    .from("curso_intentos")
    .select("id, user_id, curso_id, modulo_id, preguntas, estado")
    .eq("id", intentoId)
    .single();

  if (!intento || intento.user_id !== sesion.userId || intento.curso_id !== curso.curso.id) {
    return { error: "Ese examen no es tuyo.", status: 404 };
  }
  if (intento.estado !== "abierto") return { error: "Este examen ya se entregó.", status: 409 };

  const ids = intento.preguntas as string[];
  const sinContestar = ids.filter((id) => !Number.isInteger(respuestas[id]));
  if (sinContestar.length) {
    return { error: `Faltan ${sinContestar.length} preguntas por contestar. Son todas obligatorias.`, status: 400 };
  }

  const { data: filas } = await db
    .from("curso_preguntas")
    .select("id, opciones, correcta, explicacion, leccion_id")
    .in("id", ids);
  const porId = new Map(((filas ?? []) as Omit<FilaPregunta, "enunciado">[]).map((p) => [p.id, p]));
  const preguntas = ids.map((id) => porId.get(id)).filter((p): p is NonNullable<typeof p> => !!p);

  const { nota, aciertos, fallos } = puntuar(
    preguntas.map((p) => ({ id: p.id, opciones: p.opciones.length, correcta: p.correcta })),
    respuestas,
  );
  const modulo = curso.modulos.find((m) => m.id === intento.modulo_id) ?? null;
  const notaMinima = modulo ? modulo.nota_minima : 5;
  const aprobado = nota >= notaMinima;

  // Solo se cierra si seguía abierto: dos entregas a la vez no corrigen dos veces.
  const { data: cerrado } = await db
    .from("curso_intentos")
    .update({
      estado: "entregado",
      nota,
      aciertos,
      fallos,
      aprobado,
      respuestas: Object.fromEntries(ids.map((id) => [id, respuestas[id]])),
      entregado_at: new Date().toISOString(),
    })
    .eq("id", intentoId)
    .eq("estado", "abierto")
    .select("id")
    .maybeSingle();
  if (!cerrado) return { error: "Este examen ya se entregó.", status: 409 };

  const lecciones = new Map(curso.modulos.flatMap((m) => m.lecciones).map((l) => [l.id, l]));
  const detalle = preguntas.map((p) => {
    const acertada = respuestas[p.id] === p.correcta;
    const leccion = p.leccion_id ? lecciones.get(p.leccion_id) : undefined;
    return {
      id: p.id,
      acertada,
      elegida: respuestas[p.id],
      ...(aprobado ? { correcta: p.correcta, explicacion: p.explicacion } : {}),
      repasar: !acertada && leccion ? { slug: leccion.slug, titulo: leccion.titulo } : null,
    };
  });

  const correccion: Correccion = { nota, aciertos, fallos, aprobado, notaMinima, detalle };

  if (aprobado && intento.modulo_id === null) {
    const certificado = await emitirCertificado(sesion, curso, nota);
    if (certificado) correccion.certificado = certificado;
  }
  return correccion;
}

/** Código público del certificado: 10 caracteres sin los que se confunden (0/O, 1/I/L). */
function codigoCertificado(): string {
  const alfabeto = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

async function emitirCertificado(sesion: Sesion, curso: CursoCompleto, notaExamen: number) {
  const db = createAdminClient();
  const { data: existente } = await db
    .from("curso_certificados")
    .select("codigo, nota_final")
    .eq("user_id", sesion.userId)
    .eq("curso_id", curso.curso.id)
    .maybeSingle();
  if (existente) return { codigo: existente.codigo as string, notaFinal: Number(existente.nota_final) };

  // La nota de cada módulo es la del intento que lo aprobó.
  const { data: aprobados } = await db
    .from("curso_intentos")
    .select("modulo_id, nota, entregado_at")
    .eq("user_id", sesion.userId)
    .eq("curso_id", curso.curso.id)
    .eq("aprobado", true)
    .not("modulo_id", "is", null)
    .order("entregado_at", { ascending: true });

  const notaPorModulo = new Map<string, number>();
  for (const a of aprobados ?? []) {
    if (!notaPorModulo.has(a.modulo_id as string)) notaPorModulo.set(a.modulo_id as string, Number(a.nota));
  }
  const notas = curso.modulos.map((m) => notaPorModulo.get(m.id) ?? 0);
  const { notaModulos, notaFinal } = notaCertificado(notas, notaExamen);

  const fila = {
    user_id: sesion.userId,
    curso_id: curso.curso.id,
    nota_final: notaFinal,
    nota_modulos: notaModulos,
    nota_examen: notaExamen,
    nombre: sesion.nombre,
    codigo: codigoCertificado(),
  };
  const { error } = await db.from("curso_certificados").insert(fila);
  if (error) {
    console.error("[cursos] No se pudo emitir el certificado:", error.message);
    return null;
  }
  return { codigo: fila.codigo, notaFinal };
}
