/**
 * Los siete últimos días, para pintar la racha como en el sistema de diseño
 * («Progreso y racha»: una casilla por día, encendida si cuenta). No inventa
 * nada: enciende los `racha` días seguidos que terminan en `hasta` (el último
 * día que entró, en la zona de la academia: ver `@/lib/streak`).
 *
 * Trabaja con fechas «YYYY-MM-DD» y aritmética en UTC sobre ellas, así que no
 * depende de la zona de la máquina ni de los cambios de hora.
 */

const LETRAS = ["D", "L", "M", "X", "J", "V", "S"] as const;
const DIA_MS = 24 * 60 * 60 * 1000;

function aUtc(dia: string): number {
  const [a, m, d] = dia.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

function aTexto(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export interface DiaRacha {
  dia: string;
  letra: string;
  encendido: boolean;
  hoy: boolean;
}

/** `hoy` y `hasta` en «YYYY-MM-DD». Sin racha (`racha` 0 o `hasta` nulo), todo apagado. */
export function semanaDeRacha(racha: number, hasta: string | null, hoy: string): DiaRacha[] {
  const finRacha = hasta ? aUtc(hasta) : null;
  const inicioRacha = finRacha !== null && racha > 0 ? finRacha - (racha - 1) * DIA_MS : null;
  const base = aUtc(hoy);
  return Array.from({ length: 7 }, (_, i) => {
    const ms = base - (6 - i) * DIA_MS;
    const encendido = inicioRacha !== null && finRacha !== null && ms >= inicioRacha && ms <= finRacha;
    return { dia: aTexto(ms), letra: LETRAS[new Date(ms).getUTCDay()], encendido, hoy: i === 6 };
  });
}
