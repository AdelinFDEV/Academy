/**
 * El DCA de Bitcoin: los cálculos que en el Excel eran fórmulas.
 *
 * ── De dónde sale esto ─────────────────────────────────────────────────────
 *
 * De «DCA Bitcoin.xlsx», 39 compras entre el 24-11-2025 y el 31-08-2026. Las
 * columnas del Excel se traducen así:
 *
 *   INVERSIÓN        → `importe` (en la tabla)
 *   PRECIO DE BTC    → `precio_btc` (en la tabla)
 *   CANTIDAD DE BTC  → `btc`, calculado: importe / precio_btc
 *   RENTABILIDAD %   → `rentabilidadPct`
 *   RENTABILIDAD $   → `ganancia`
 *   INVERTIDO        → `invertido`
 *
 * ── La diferencia importante con el Excel ──────────────────────────────────
 *
 * El Excel calcula la rentabilidad contra `$H$2 = 200.000`, que **no es el
 * precio de mercado sino un objetivo**. Por eso ahí sale «obtenido: 11.445»
 * con 6.700 invertidos: es lo que valdría *si* Bitcoin llegara a 200.000.
 *
 * Aquí se separan las dos cosas, y no es un capricho:
 *
 *   · `real`      — contra el precio de CoinGecko de ahora mismo. Es lo que se
 *                   enseña como rentabilidad, a secas.
 *   · `proyeccion` — contra los 200.000. Se enseña aparte y **etiquetado como
 *                   objetivo**, nunca como ganancia.
 *
 * Presentar la proyección como rentabilidad sería anunciar un +170 % que nadie
 * ha ganado todavía. La web tiene un descargo que promete justo lo contrario, y
 * es exactamente el tipo de cosa que acaba en una reclamación.
 */

/** Precio objetivo del Excel (`$H$2`). Es una hipótesis, no una previsión. */
export const PRECIO_OBJETIVO = 200_000;

/** Todo va en dólares, como el Excel del que salen las compras. */
export const MONEDA = "USD" as const;

export interface CompraDCA {
  id: string;
  fecha: string;
  importe: number;
  precio_btc: number;
  estado: "realizada" | "pendiente";
  notas: string | null;
}

/** Una compra con lo que se deriva de ella. */
export interface CompraCalculada extends CompraDCA {
  /** `importe / precio_btc`. No se guarda: sería un dato derivado que algún día deja de cuadrar. */
  btc: number;
  /** Lo que valen hoy esos BTC. */
  valorActual: number;
  /** Ganancia o pérdida en dólares, contra el precio de ahora. */
  ganancia: number;
  /** Lo mismo en porcentaje. */
  rentabilidadPct: number;
}

export interface ResumenDCA {
  compras: CompraCalculada[];
  /** Solo cuenta lo realizado: una compra pendiente no ha movido dinero. */
  invertido: number;
  btc: number;
  /** `invertido / btc`. El número que de verdad juzga un DCA. */
  precioMedio: number;
  precioActual: number;
  valorActual: number;
  ganancia: number;
  rentabilidadPct: number;
  /** Qué pasaría a `PRECIO_OBJETIVO`. Se enseña aparte y como hipótesis. */
  proyeccion: {
    precio: number;
    valor: number;
    ganancia: number;
    rentabilidadPct: number;
    /** Cuánto tendría que subir BTC desde hoy para llegar ahí. */
    subidaNecesariaPct: number;
  };
  primera: string | null;
  ultima: string | null;
}

/**
 * Monta el resumen a partir de las compras y del precio de BTC.
 *
 * Es una función pura y sin dependencias a propósito: así se puede probar con
 * números fijos, que es como se comprobó que cuadra con el Excel.
 */
export function calcularDCA(compras: CompraDCA[], precioActual: number): ResumenDCA {
  const realizadas = compras.filter((c) => c.estado === "realizada");

  const calculadas: CompraCalculada[] = compras.map((c) => {
    const btc = c.importe / c.precio_btc;
    const valorActual = btc * precioActual;
    const ganancia = valorActual - c.importe;
    return {
      ...c,
      btc,
      valorActual,
      ganancia,
      rentabilidadPct: c.importe > 0 ? (ganancia / c.importe) * 100 : 0,
    };
  });

  const invertido = realizadas.reduce((a, c) => a + c.importe, 0);
  const btc = realizadas.reduce((a, c) => a + c.importe / c.precio_btc, 0);
  const valorActual = btc * precioActual;
  const ganancia = valorActual - invertido;

  const valorObjetivo = btc * PRECIO_OBJETIVO;
  const fechas = realizadas.map((c) => c.fecha).sort();

  return {
    compras: calculadas,
    invertido,
    btc,
    precioMedio: btc > 0 ? invertido / btc : 0,
    precioActual,
    valorActual,
    ganancia,
    rentabilidadPct: invertido > 0 ? (ganancia / invertido) * 100 : 0,
    proyeccion: {
      precio: PRECIO_OBJETIVO,
      valor: valorObjetivo,
      ganancia: valorObjetivo - invertido,
      rentabilidadPct: invertido > 0 ? ((valorObjetivo - invertido) / invertido) * 100 : 0,
      subidaNecesariaPct:
        precioActual > 0 ? ((PRECIO_OBJETIVO - precioActual) / precioActual) * 100 : 0,
    },
    primera: fechas[0] ?? null,
    ultima: fechas.at(-1) ?? null,
  };
}

/**
 * Precio de Bitcoin en dólares, de CoinGecko.
 *
 * Cinco minutos de caché, el mismo intervalo que usa el Radar: son datos de
 * orientación, no de ejecución, y CoinGecko limita las llamadas del plan
 * gratuito. Devuelve `null` si falla — quien llama decide qué enseñar, pero
 * nunca un precio inventado.
 */
export async function precioBitcoin(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { bitcoin?: { usd?: number } };
    const precio = json.bitcoin?.usd;
    return typeof precio === "number" && precio > 0 ? precio : null;
  } catch {
    return null;
  }
}
