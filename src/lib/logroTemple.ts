import "server-only";
import { createClient } from "@/lib/supabase/server";
import { MILESTONES, byChronology, type Trade } from "@/components/trading/tjStats";
import type { SelloLogro } from "@/lib/logros";

/**
 * Los sellos de un logro de la categoría Temple (el primero, «Sangre Fría»,
 * del curso de psicología del trading). Decidido con el admin el 07-11-2026:
 *
 *  I.   Conocimiento — aprobar el examen final. Sale de `curso_certificados`
 *       y es el que hace que el logro cuente como conseguido.
 *  II.  Práctica — `TEMPLE_DIAS` días distintos con el ánimo apuntado en el
 *       Diario de Trading desde que el alumno se inscribió en el curso.
 *  III. Temple — el primer nivel del hito «Sin revancha» (esperar tras una
 *       pérdida), contando solo lo operado DESPUÉS del certificado.
 *
 * Nada se guarda: se recalcula al abrir Logros con la sesión del alumno (RLS
 * le deja leer solo lo suyo). Así no hay fila en `user_badges` que se pueda
 * insertar desde el navegador. Los sellos II y III salen de datos que el
 * alumno apunta él mismo, como todo el Diario: son práctica, no prueba, y por
 * eso el logro se consigue con el I.
 */

export const TEMPLE_DIAS = 21;

const REVANCHA = MILESTONES.find((m) => m.id === "revancha");

export async function sellosTemple(
  userId: string,
  cursoId: string,
  certificadoFecha: string | null,
): Promise<SelloLogro[]> {
  const supabase = await createClient();

  const { data: inscripcion } = await supabase
    .from("curso_inscripciones")
    .select("created_at")
    .eq("user_id", userId)
    .eq("curso_id", cursoId)
    .maybeSingle();

  // La fecha del Diario es la del calendario del usuario, sin hora: se compara
  // con el día de la inscripción en formato YYYY-MM-DD.
  let dias = 0;
  if (inscripcion?.created_at) {
    const desde = String(inscripcion.created_at).slice(0, 10);
    const { count } = await supabase
      .from("diario_dias")
      .select("fecha", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("animo", "is", null)
      .gte("fecha", desde);
    dias = count ?? 0;
  }

  const metaRevancha = REVANCHA?.tiers[0] ?? 5;
  let esperas = 0;
  if (certificadoFecha && REVANCHA) {
    const { data: trades } = await supabase.from("trades").select("*").eq("user_id", userId);
    const ordenadas = ((trades ?? []) as Trade[]).sort(byChronology);
    // La serie se calcula sobre TODAS las operaciones (la anterior a la primera
    // tras el certificado puede ser la pérdida que cuenta) y se resta lo que
    // ya llevaba al aprobar.
    const puntos = REVANCHA.series(ordenadas, null, new Map(), new Date());
    const antes = puntos.filter((p) => p.date <= certificadoFecha).at(-1)?.value ?? 0;
    esperas = Math.max(0, (puntos.at(-1)?.value ?? 0) - antes);
  }

  return [
    {
      id: "conocimiento",
      nombre: "Conocimiento",
      condicion: "Aprueba el examen final del curso",
      hecho: certificadoFecha !== null,
    },
    {
      id: "practica",
      nombre: "Práctica",
      condicion: `Apunta tu ánimo en el Diario ${TEMPLE_DIAS} días desde que empezaste el curso`,
      hecho: dias >= TEMPLE_DIAS,
      progreso: { valor: Math.min(dias, TEMPLE_DIAS), meta: TEMPLE_DIAS, unidad: "días" },
    },
    {
      id: "temple",
      nombre: "Temple",
      condicion: `Tras aprobar, espera ${metaRevancha} veces antes de volver a entrar después de una pérdida`,
      hecho: esperas >= metaRevancha,
      progreso: { valor: Math.min(esperas, metaRevancha), meta: metaRevancha, unidad: "esperas" },
    },
  ];
}
