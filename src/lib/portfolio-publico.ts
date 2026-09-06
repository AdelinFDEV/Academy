import { createAdminClient } from "@/lib/supabase/admin";
import { calcularDCA, precioBitcoin, type CompraDCA } from "@/lib/dca";

/**
 * Cifras AGREGADAS del portfolio para la ficha pública.
 *
 * La prueba de que la cartera es real son los números, no los adjetivos. Pero
 * solo salen agregados: **nunca qué monedas ni a qué precio entré**, que es
 * justo lo que se paga. Aquí no hay nada por posición, y no debe añadirse.
 *
 * Se lee con el cliente admin porque `portfolio_positions` tiene RLS y a un
 * anónimo le devuelve cero filas. La verificación no hace falta: lo que sale
 * de aquí es público a propósito.
 *
 * Si algo falla —Supabase caído, CoinGecko sin responder— devuelve `null` y la
 * página **omite el bloque entero**. Preferimos no enseñar cifras a enseñar
 * cifras equivocadas: una rentabilidad mal calculada en una página que presume
 * de transparencia hace más daño que no ponerla.
 */

/**
 * ¿Se publican los IMPORTES en euros, o solo la rentabilidad?
 *
 * Por defecto **no**. La rentabilidad y el número de posiciones prueban que la
 * cartera es real; el importe invertido no prueba nada y sí revela cuánto
 * capital mueves. Con una cartera modesta, además, juega en contra: la cifra
 * distrae de lo que se quiere demostrar, que es que las posiciones existen y
 * que se publican también cuando van mal.
 *
 * Ponlo en `true` si prefieres enseñarlo. No hay que tocar nada más.
 */
export const MOSTRAR_IMPORTES = false;

export interface ResumenPublico {
  posiciones: number;
  /** Suma de compras, en dólares. */
  invertido: number;
  /** Valor de mercado ahora mismo, en dólares. */
  valorActual: number;
  /** Rentabilidad total en porcentaje. Puede ser negativa, y así se enseña. */
  rentabilidadPct: number;
  /** Año de la compra más antigua: sirve para decir "desde 2024". */
  desdeAnio: number | null;
  /**
   * El DCA de Bitcoin, si hay compras cargadas.
   *
   * Va aparte y no sumado al spot a propósito: son dos estrategias distintas
   * y mezclarlas daría una rentabilidad que no describe a ninguna de las dos.
   * Aquí, como en el resto del resumen, **solo agregados**: ni una fila, ni un
   * importe si `MOSTRAR_IMPORTES` está en false.
   */
  dca: {
    compras: number;
    invertido: number;
    btc: number;
    precioMedio: number;
    rentabilidadPct: number;
    desdeAnio: number | null;
  } | null;
}

interface Posicion {
  coingecko_id: string | null;
  buy_price: number | null;
  quantity: number | null;
  buy_date: string | null;
}

/** Precio en dólares por id de CoinGecko. */
type Precios = Record<string, { usd?: number }>;

async function preciosDe(ids: string[]): Promise<Precios> {
  if (!ids.length) return {};

  // Orden estable: dos peticiones equivalentes comparten la caché de Next.
  const lista = [...new Set(ids)].sort().join(",");

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(lista)}&vs_currencies=usd`,
      { headers: { Accept: "application/json" }, next: { revalidate: 300 } },
    );
    if (!res.ok) return {};
    return (await res.json()) as Precios;
  } catch {
    return {};
  }
}

export async function resumenPortfolioPublico(): Promise<ResumenPublico | null> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("portfolio_positions")
      .select("coingecko_id, buy_price, quantity, buy_date");

    if (error || !data?.length) return null;

    const posiciones = data as Posicion[];
    const ids = posiciones.map((p) => p.coingecko_id).filter((v): v is string => !!v);
    const precios = await preciosDe(ids);

    // Sin ningún precio no se puede calcular la rentabilidad, y dar por bueno
    // el precio de compra la dejaría en 0 % — un número falso.
    const hayPrecios = ids.some((id) => typeof precios[id]?.usd === "number");
    if (!hayPrecios) return null;

    let invertido = 0;
    let valorActual = 0;
    let anioMin: number | null = null;

    for (const p of posiciones) {
      const cantidad = p.quantity ?? 0;
      const compra = p.buy_price ?? 0;
      if (cantidad <= 0 || compra <= 0) continue;

      invertido += compra * cantidad;

      const actual = p.coingecko_id ? precios[p.coingecko_id]?.usd : undefined;
      valorActual += (typeof actual === "number" ? actual : compra) * cantidad;

      if (p.buy_date) {
        const anio = new Date(p.buy_date).getFullYear();
        if (Number.isFinite(anio) && (anioMin === null || anio < anioMin)) anioMin = anio;
      }
    }

    if (invertido <= 0) return null;

    return {
      posiciones: posiciones.length,
      invertido,
      valorActual,
      rentabilidadPct: ((valorActual - invertido) / invertido) * 100,
      desdeAnio: anioMin,
      dca: await resumenDCA(),
    };
  } catch {
    return null;
  }
}

/**
 * El agregado del DCA de Bitcoin para la ficha pública.
 *
 * Devuelve `null` en silencio si la tabla no existe todavía o si CoinGecko no
 * responde: el resumen del spot no debe caerse porque el DCA falle. La ficha ya
 * sabe pintar sin este bloque.
 *
 * Aquí **nunca** se devuelven las compras una a una. Solo cuántas son y los
 * agregados; el detalle es de Premium y vive en `/portfolio`.
 */
async function resumenDCA(): Promise<ResumenPublico["dca"]> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("dca_compras")
      .select("id, fecha, importe, precio_btc, estado, notas");

    if (error || !data?.length) return null;

    const precio = await precioBitcoin();
    if (precio === null) return null;

    const r = calcularDCA(data as CompraDCA[], precio);
    if (r.invertido <= 0) return null;

    return {
      compras: r.compras.filter((c) => c.estado === "realizada").length,
      invertido: r.invertido,
      btc: r.btc,
      precioMedio: r.precioMedio,
      rentabilidadPct: r.rentabilidadPct,
      desdeAnio: r.primera ? Number(r.primera.slice(0, 4)) : null,
    };
  } catch {
    return null;
  }
}
