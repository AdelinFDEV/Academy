import { createAdminClient } from "@/lib/supabase/admin";
import { RANGOS, cargarPremium, type Rango } from "@/lib/crecimiento";
import { cargarDineroPorMes } from "@/lib/objetivosServidor";
import { type Movimiento } from "@/lib/objetivos";
import { todasLasFilas } from "@/lib/supabase/todasLasFilas";
import SeccionDinero from "./SeccionDinero";

export const dynamic = "force-dynamic";

/**
 * Pestaña Dinero: lo ganado por meses, las ganancias frente a los gastos de
 * la empresa y Premium (suscripciones y lo cobrado por Stripe). El periodo
 * (?rango=) solo afecta a Premium. Lee con la clave de servicio, detrás del
 * layout de /admin, que exige rol admin (src/proxy.ts).
 */
export default async function DineroPage({ searchParams }: { searchParams: Promise<{ rango?: string }> }) {
  const { rango: pedido } = await searchParams;
  const rango: Rango = pedido && pedido in RANGOS ? (pedido as Rango) : "30";
  const admin = createAdminClient();
  const [premium, dineroMeses, movimientos, prueba] = await Promise.all([
    cargarPremium(admin, rango),
    cargarDineroPorMes(admin),
    // Lo apuntado a mano y lo que copia Stripe (cobros, comisiones y
    // devoluciones); los ingresos del cierre del día ya van en dineroMeses.
    todasLasFilas<Movimiento>((a, b) =>
      admin
        .from("movimientos")
        .select("id, tipo, fecha, concepto, categoria, importe, recurrente, hasta, origen")
        .in("origen", ["manual", "stripe"])
        .order("fecha", { ascending: false })
        .order("id")
        .range(a, b)
    ),
    // Sin la tabla (SQL sin lanzar), el bloque lo dice en vez de salir vacío.
    admin.from("movimientos").select("id", { count: "exact", head: true }),
  ]);
  const finanzas = {
    movimientos: movimientos.map((m) => ({ ...m, importe: Number(m.importe) })),
    falta: prueba.error?.code === "PGRST205",
  };
  return <SeccionDinero premium={premium} rango={rango} dineroMeses={dineroMeses} finanzas={finanzas} />;
}
