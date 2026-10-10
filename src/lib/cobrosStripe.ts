import type Stripe from "stripe";
import type { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { diaRumania } from "@/lib/objetivos";

/**
 * Lo que de verdad cobra Stripe, copiado al libro de dinero (`movimientos`).
 *
 * Antes Premium se apuntaba a mano en el cierre del día y, aparte, se estimaba
 * (suscriptores × precio): dos cifras que no tenían por qué coincidir con lo
 * cobrado. Ahora la fuente es el saldo de Stripe (balance transactions), que
 * es dinero real y ya trae la comisión separada:
 *
 *   · cobro (charge / payment)          → ingreso «premium», importe bruto
 *   · su comisión                        → gasto «comisiones»
 *   · devolución o disputa perdida       → gasto «devoluciones»
 *   · cargos de Stripe (stripe_fee…)     → gasto «comisiones»
 *
 * Los traspasos al banco (payouts) no son ni ingreso ni gasto: se ignoran.
 *
 * Es idempotente: cada fila lleva en `externo` el id del movimiento de Stripe
 * (y «:comision» la comisión), así que repasar los mismos días no duplica
 * nada. La llaman el cron diario (red de seguridad) y el webhook de Stripe
 * (para que el cobro aparezca en el momento).
 *
 * Nunca lanza: devuelve cuántas filas escribió, o null si no pudo leer Stripe.
 */

type Admin = ReturnType<typeof createAdminClient>;

type Fila = {
  tipo: "ingreso" | "gasto";
  fecha: string;
  concepto: string;
  categoria: string;
  importe: number;
  origen: "stripe";
  externo: string;
  recurrente: false;
  updated_at: string;
};

const COBROS = new Set(["charge", "payment"]);
const DEVOLUCIONES = new Set(["refund", "payment_refund", "payment_failure_refund", "adjustment"]);
const CARGOS_DE_STRIPE = new Set(["stripe_fee", "tax_fee"]);

const euros = (centimos: number) => Math.round(Math.abs(centimos)) / 100;

function filasDe(bt: Stripe.BalanceTransaction, ahora: string): Fila[] {
  const fecha = diaRumania(bt.created * 1000);
  const base = { fecha, origen: "stripe" as const, recurrente: false as const, updated_at: ahora };
  const filas: Fila[] = [];

  if (COBROS.has(bt.type) && bt.amount > 0) {
    filas.push({ ...base, tipo: "ingreso", concepto: "Cobro Premium", categoria: "premium", importe: euros(bt.amount), externo: bt.id });
  } else if (DEVOLUCIONES.has(bt.type) && bt.amount < 0) {
    filas.push({ ...base, tipo: "gasto", concepto: bt.type === "adjustment" ? "Disputa de un cobro" : "Devolución de Premium", categoria: "devoluciones", importe: euros(bt.amount), externo: bt.id });
  } else if (CARGOS_DE_STRIPE.has(bt.type) && bt.amount < 0) {
    filas.push({ ...base, tipo: "gasto", concepto: "Cargo de Stripe", categoria: "comisiones", importe: euros(bt.amount), externo: bt.id });
  } else {
    return [];
  }

  // La comisión de un cobro o de una disputa. Si Stripe la devuelve (fee
  // negativa en un reembolso), no se apunta: el libro no admite importes negativos.
  if (bt.fee > 0) {
    filas.push({ ...base, tipo: "gasto", concepto: "Comisión de Stripe", categoria: "comisiones", importe: euros(bt.fee), externo: `${bt.id}:comision` });
  }
  return filas;
}

export async function sincronizarCobrosStripe(admin: Admin, dias = 35): Promise<number | null> {
  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    // Sin STRIPE_SECRET_KEY (en local): no hay nada que leer.
    return null;
  }

  try {
    const ahora = new Date().toISOString();
    const filas: Fila[] = [];
    const desde = Math.floor(Date.now() / 1000) - dias * 24 * 60 * 60;
    for await (const bt of stripe.balanceTransactions.list({ created: { gte: desde }, limit: 100 })) {
      if (bt.currency !== "eur") {
        console.warn(`[stripe-cobros] ${bt.id} en ${bt.currency}: el libro va en euros, no se apunta.`);
        continue;
      }
      filas.push(...filasDe(bt, ahora));
    }
    if (!filas.length) return 0;

    const { error } = await admin.from("movimientos").upsert(filas, { onConflict: "externo" });
    if (error) {
      console.error("[stripe-cobros] No se pudieron guardar los cobros:", error.message);
      return null;
    }
    return filas.length;
  } catch (err) {
    console.error("[stripe-cobros] No se pudo leer el saldo de Stripe:", err);
    return null;
  }
}
