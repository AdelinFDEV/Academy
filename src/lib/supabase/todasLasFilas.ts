/**
 * Supabase devuelve como mucho 1.000 filas por consulta (max-rows de
 * PostgREST) y lo hace en silencio: sin error, solo se corta. En una serie
 * ordenada de la más antigua a la más reciente, lo que se pierde es justo lo
 * último, y la gráfica se congela sin avisar.
 *
 * Esto pide de 1.000 en 1.000 hasta acabar. La consulta tiene que venir
 * ordenada por algo estable, o las páginas se solapan.
 *
 *   const filas = await todasLasFilas((a, b) =>
 *     admin.from("ingresos_dia").select("fecha, importe").order("fecha").order("fuente").range(a, b));
 */

const PAGINA = 1000;

type Respuesta<T> = { data: T[] | null; error: { message: string } | null };

export async function todasLasFilas<T>(pedir: (desde: number, hasta: number) => PromiseLike<Respuesta<T>>): Promise<T[]> {
  const filas: T[] = [];
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await pedir(desde, desde + PAGINA - 1);
    if (error) {
      console.error("[todasLasFilas]", error.message);
      break;
    }
    filas.push(...(data ?? []));
    if (!data || data.length < PAGINA) break;
  }
  return filas;
}
