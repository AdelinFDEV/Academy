import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createAdminClientOpcional } from "@/lib/supabase/admin";
import type { VarianteAviso } from "@/components/DisclaimerRiesgo";
import { estadoCurso, type EstadoCurso, type IntentoBase, type ModuloBase } from "@/lib/cursos-progreso";
export { duracion } from "@/lib/cursos-progreso";

/**
 * Los cursos de la academia — lectura desde Supabase.
 *
 * El contenido vive en la base de datos, no en el código (esquema y porqué en
 * `scripts/create-cursos.sql`; cómo se escribe un curso, en `CURSOS.md`). Las
 * reglas de desbloqueo, nota y cronograma están en `cursos-progreso.ts`, que
 * no sabe nada de Supabase.
 *
 * ── Con qué clave se lee cada cosa ────────────────────────────────────────
 *
 *  · El CATÁLOGO y el TEMARIO públicos se leen con `createAdminClientOpcional()`
 *    por lo mismo que las entradas: la policy de `curso_lecciones` esconde las
 *    filas a quien no es Premium, y sin ellas no se puede decir cuánto dura un
 *    curso. Se piden títulos y minutos — **nunca `contenido`**.
 *  · El AULA se lee siempre con la clave de servicio. Además de ser Premium hay
 *    que tener el módulo desbloqueado, y eso RLS no lo sabe: lo decide
 *    `estadoCurso()` antes de enseñar nada.
 *
 * `.eq("published", true)` no se quita nunca de las lecturas públicas: saltando
 * RLS es lo único que separa un borrador de un curso visible. El admin sí ve
 * los borradores, igual que con las entradas, para revisarlos antes de publicar.
 */

export type NivelCurso = "básico" | "intermedio" | "avanzado";

export interface CursoResumen {
  slug: string;
  titulo: string;
  subtitulo: string | null;
  nivel: NivelCurso;
  portada: string | null;
  color: string;
  modulos: number;
  lecciones: number;
  minutos: number;
}

export interface Curso {
  id: string;
  slug: string;
  titulo: string;
  subtitulo: string | null;
  descripcion: string | null;
  objetivos: string[];
  nivel: NivelCurso;
  portada: string | null;
  color: string;
  aviso: VarianteAviso;
  logro: string;
  preguntas_final: number;
  revisado: string | null;
  published: boolean;
  updated_at: string;
}

export interface CursoCompleto {
  curso: Curso;
  modulos: ModuloBase[];
}

type FilaResumen = {
  slug: string;
  titulo: string;
  subtitulo: string | null;
  nivel: NivelCurso;
  portada: string | null;
  color: string;
  curso_modulos: { curso_lecciones: { minutos: number }[] | null }[] | null;
};

/**
 * Los cursos publicados, en el orden del catálogo.
 *
 * Si la consulta falla —por ejemplo, porque `create-cursos.sql` aún no se ha
 * ejecutado— devuelve una lista vacía: la página enseña su estado «en
 * preparación» en vez de un 500. Va envuelta en `cache` porque `/cursos` la
 * pide dos veces por petición (la metadata decide el `noindex`).
 */
export const cursosPublicados = cache(async (): Promise<CursoResumen[]> => {
  const lector = createAdminClientOpcional() ?? (await createClient());

  const { data, error } = await lector
    .from("cursos")
    .select("slug, titulo, subtitulo, nivel, portada, color, curso_modulos(curso_lecciones(minutos))")
    .eq("published", true)
    .order("orden", { ascending: true });

  if (error || !data) {
    if (error) console.error("[cursos] No se pudo leer el catálogo:", error.message);
    return [];
  }

  return (data as FilaResumen[]).map((c) => {
    const modulos = c.curso_modulos ?? [];
    const lecciones = modulos.flatMap((m) => m.curso_lecciones ?? []);
    return {
      slug: c.slug,
      titulo: c.titulo,
      subtitulo: c.subtitulo,
      nivel: c.nivel,
      portada: c.portada,
      color: c.color,
      modulos: modulos.length,
      lecciones: lecciones.length,
      minutos: lecciones.reduce((total, l) => total + l.minutos, 0),
    };
  });
});

const COLUMNAS_CURSO =
  "id, slug, titulo, subtitulo, descripcion, objetivos, nivel, portada, color, aviso, logro, preguntas_final, revisado, published, updated_at";

type FilaModulo = Omit<ModuloBase, "lecciones" | "nota_minima"> & {
  nota_minima: number | string;
  curso_lecciones: ModuloBase["lecciones"] | null;
};

/**
 * Un curso con su temario: módulos y lecciones, **sin el texto de ninguna**.
 * Sirve para la ficha pública y para el aula. Con `conBorradores` (solo el
 * admin) también devuelve cursos sin publicar.
 */
export const cursoPorSlug = cache(async (slug: string, conBorradores = false): Promise<CursoCompleto | null> => {
  const lector = createAdminClientOpcional() ?? (await createClient());

  let consulta = lector.from("cursos").select(COLUMNAS_CURSO).eq("slug", slug);
  if (!conBorradores) consulta = consulta.eq("published", true);
  const { data: curso, error } = await consulta.maybeSingle();
  if (error || !curso) return null;

  const { data: modulos } = await lector
    .from("curso_modulos")
    .select("id, orden, titulo, descripcion, nota_minima, preguntas_examen, curso_lecciones(id, slug, titulo, resumen, minutos, orden)")
    .eq("curso_id", curso.id)
    .order("orden", { ascending: true });

  return {
    curso: { ...curso, objetivos: Array.isArray(curso.objetivos) ? (curso.objetivos as string[]) : [] } as Curso,
    modulos: ((modulos ?? []) as FilaModulo[]).map((m) => ({
      id: m.id,
      orden: m.orden,
      titulo: m.titulo,
      descripcion: m.descripcion,
      // `numeric` llega de PostgREST como texto.
      nota_minima: Number(m.nota_minima),
      preguntas_examen: m.preguntas_examen,
      lecciones: [...(m.curso_lecciones ?? [])].sort((a, b) => a.orden - b.orden),
    })),
  };
});

// ── El alumno ─────────────────────────────────────────────────────────────

export interface Sesion {
  userId: string;
  nombre: string;
  role: string;
  esPremium: boolean;
  esAdmin: boolean;
}

/** Quién mira. `null` sin sesión. El rol sale de la base de datos, nunca de la petición. */
export const sesionActual = cache(async (): Promise<Sesion | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: perfil } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  const role = perfil?.role ?? "free";
  return {
    userId: user.id,
    nombre: perfil?.full_name || user.email?.split("@")[0] || "Alumno",
    role,
    esPremium: role === "premium" || role === "admin",
    esAdmin: role === "admin",
  };
});

export interface Certificado {
  codigo: string;
  nota_final: number;
  nota_modulos: number;
  nota_examen: number;
  nombre: string;
  created_at: string;
}

export interface DatosAlumno {
  inscripcion: { minutos_semana: number; created_at: string } | null;
  completadas: Set<string>;
  intentos: IntentoBase[];
  certificado: Certificado | null;
}

/** Todo lo del alumno en un curso. Con la clave de servicio: lo usa el aula. */
export async function datosAlumno(userId: string, curso: CursoCompleto): Promise<DatosAlumno> {
  const db = createAdminClient();
  const leccionIds = curso.modulos.flatMap((m) => m.lecciones.map((l) => l.id));

  const [inscripcion, progreso, intentos, certificado] = await Promise.all([
    db.from("curso_inscripciones").select("minutos_semana, created_at").eq("user_id", userId).eq("curso_id", curso.curso.id).maybeSingle(),
    leccionIds.length
      ? db.from("curso_progreso").select("leccion_id").eq("user_id", userId).in("leccion_id", leccionIds)
      : Promise.resolve({ data: [] as { leccion_id: string }[] }),
    db.from("curso_intentos")
      .select("id, modulo_id, estado, nota, aprobado, created_at, entregado_at")
      .eq("user_id", userId)
      .eq("curso_id", curso.curso.id)
      .order("created_at", { ascending: true }),
    db.from("curso_certificados")
      .select("codigo, nota_final, nota_modulos, nota_examen, nombre, created_at")
      .eq("user_id", userId)
      .eq("curso_id", curso.curso.id)
      .maybeSingle(),
  ]);

  return {
    inscripcion: inscripcion.data ?? null,
    completadas: new Set((progreso.data ?? []).map((p) => p.leccion_id)),
    intentos: ((intentos.data ?? []) as IntentoBase[]).map((i) => ({ ...i, nota: i.nota === null ? null : Number(i.nota) })),
    certificado: certificado.data
      ? {
          ...certificado.data,
          nota_final: Number(certificado.data.nota_final),
          nota_modulos: Number(certificado.data.nota_modulos),
          nota_examen: Number(certificado.data.nota_examen),
        }
      : null,
  };
}

/** El texto de una lección. Solo se llama DESPUÉS de comprobar que está abierta. */
export async function contenidoLeccion(leccionId: string): Promise<string> {
  const { data } = await createAdminClient().from("curso_lecciones").select("contenido").eq("id", leccionId).single();
  return data?.contenido ?? "";
}

/** Los logros de los cursos: uno por curso publicado, y los que tiene el alumno. */
export async function logrosDeCursos(userId: string) {
  const lector = createAdminClientOpcional() ?? (await createClient());
  const [{ data: cursos }, { data: certificados }] = await Promise.all([
    lector.from("cursos").select("id, slug, titulo, logro, color").eq("published", true).order("orden"),
    lector.from("curso_certificados").select("curso_id, nota_final, created_at").eq("user_id", userId),
  ]);
  return (cursos ?? []).map((c) => {
    const cert = (certificados ?? []).find((x) => x.curso_id === c.id);
    return {
      slug: c.slug as string,
      titulo: c.titulo as string,
      logro: c.logro as string,
      color: c.color as string,
      conseguido: cert ? { fecha: cert.created_at as string, nota: Number(cert.nota_final) } : null,
    };
  });
}

// ── El contexto del aula ──────────────────────────────────────────────────

export interface ContextoAula {
  sesion: Sesion;
  curso: CursoCompleto;
  datos: DatosAlumno;
  estado: EstadoCurso;
}

/**
 * Quién mira, el curso, lo que lleva hecho y qué tiene abierto. Lo usan las
 * páginas del aula y las rutas de la API, **las dos**, para que decidan con
 * los mismos datos y la misma regla.
 *
 * Errores: 401 sin sesión, 403 sin Premium, 404 si el curso no existe (o es un
 * borrador y no eres admin).
 */
export async function contextoAula(slug: string): Promise<ContextoAula | { error: string; status: 401 | 403 | 404 }> {
  const sesion = await sesionActual();
  if (!sesion) return { error: "Inicia sesión para entrar al aula.", status: 401 };
  if (!sesion.esPremium) return { error: "Los cursos son para alumnos Premium.", status: 403 };

  const curso = await cursoPorSlug(slug, sesion.esAdmin);
  if (!curso) return { error: "Ese curso no existe.", status: 404 };

  const datos = await datosAlumno(sesion.userId, curso);
  const estado = estadoCurso(curso.modulos, datos.completadas, datos.intentos, { esAdmin: sesion.esAdmin });
  return { sesion, curso, datos, estado };
}
