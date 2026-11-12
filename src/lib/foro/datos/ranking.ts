import "server-only";
import { bd } from "../bd";
import { nivelDe } from "../limites";
import type { FilaRanking, RankingForo } from "../tipos";

/**
 * El ranking del foro (FORO.md §10.4): quién ayuda más.
 *
 * Tres tablas (puntos, respuestas ganadoras y gracias recibidas) y dos
 * periodos para la de puntos (este mes y siempre). Sale de `foro_reputacion`,
 * que el cron recalcula cada día desde el libro de puntos.
 *
 * No aparecen: el admin (no compite), quien ha pedido no salir, quien no tiene
 * alias y las cuentas expulsadas. Cada fila es posición, foto, alias, nivel y
 * cifra: ni un id, ni un enlace a ningún perfil.
 */

const CUANTOS = 25;

type Fila = { usuario_id: string; puntos: number; puntos_mes: number; mes: string; ganadoras: number; gracias: number };

export async function ranking(): Promise<RankingForo> {
  const cliente = bd();
  const mesActual = new Date().toISOString().slice(0, 8) + "01";

  // Se piden de más y se filtra después: el admin y los expulsados se quitan aquí.
  const pedir = (columna: "puntos" | "puntos_mes" | "ganadoras" | "gracias") => {
    let q = cliente
      .from("foro_reputacion")
      .select("usuario_id, puntos, puntos_mes, mes, ganadoras, gracias")
      .eq("fuera_del_ranking", false)
      .gt(columna, 0);
    if (columna === "puntos_mes") q = q.eq("mes", mesActual);
    return q.order(columna, { ascending: false }).order("usuario_id", { ascending: true }).limit(CUANTOS * 2);
  };

  const [siempre, mes, ganadoras, gracias] = await Promise.all([
    pedir("puntos"), pedir("puntos_mes"), pedir("ganadoras"), pedir("gracias"),
  ]);
  const listas = {
    siempre: (siempre.data ?? []) as Fila[],
    mes: (mes.data ?? []) as Fila[],
    ganadoras: (ganadoras.data ?? []) as Fila[],
    gracias: (gracias.data ?? []) as Fila[],
  };

  const ids = Array.from(new Set(Object.values(listas).flat().map((f) => String(f.usuario_id))));
  const [perfiles, expulsados] = ids.length
    ? await Promise.all([
        cliente.from("profiles").select("id, alias, avatar, role").in("id", ids),
        cliente.from("foro_sanciones").select("usuario_id").in("usuario_id", ids).eq("tipo", "expulsion").is("levantada_at", null),
      ])
    : [{ data: [] }, { data: [] }];

  const fuera = new Set((expulsados.data ?? []).map((e) => String(e.usuario_id)));
  const perfil = new Map(
    (perfiles.data ?? [])
      .filter((p) => typeof p.alias === "string" && p.alias && p.role !== "admin" && !fuera.has(String(p.id)))
      .map((p) => [String(p.id), { alias: String(p.alias), avatar: typeof p.avatar === "string" ? p.avatar : null }]),
  );

  const tabla = (filas: Fila[], cifra: (f: Fila) => number): FilaRanking[] =>
    filas
      .filter((f) => perfil.has(String(f.usuario_id)))
      .slice(0, CUANTOS)
      .map((f, i) => {
        const p = perfil.get(String(f.usuario_id))!;
        return { posicion: i + 1, alias: p.alias, avatar: p.avatar, nivel: nivelDe(Number(f.puntos)), cifra: cifra(f) };
      });

  return {
    puntosDelMes: tabla(listas.mes, (f) => Number(f.puntos_mes)),
    puntosDeSiempre: tabla(listas.siempre, (f) => Number(f.puntos)),
    ganadoras: tabla(listas.ganadoras, (f) => Number(f.ganadoras)),
    gracias: tabla(listas.gracias, (f) => Number(f.gracias)),
  };
}
