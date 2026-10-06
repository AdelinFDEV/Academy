import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { FUENTES, type Fuente } from "@/lib/objetivos";
import { mensajeError } from "@/lib/objetivosValidar";

export const dynamic = "force-dynamic";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

function fallo(e: { code?: string; message: string }) {
  return NextResponse.json({ error: mensajeError(e) }, { status: 500 });
}

/**
 * Guarda el cierre de un día: productividad y nota (dias_balance) y lo
 * ganado por fuente (movimientos con origen «cierre», uno por fuente).
 *
 * Volver a guardar sustituye SOLO lo que es del cierre de ese día: lo
 * apuntado a mano en Crecimiento / Gastos ese mismo día no se toca, así nada
 * se cuenta dos veces ni se borra sin querer. Con `parcial` (el marcado
 * rápido del calendario) el dinero no se toca en absoluto.
 *
 * Solo admin; las tablas no tienen policies (scripts/create-objetivos.sql).
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Petición vacía" }, { status: 400 });

  const fecha = typeof b.fecha === "string" && FECHA.test(b.fecha) ? b.fecha : null;
  if (!fecha) return NextResponse.json({ error: "Fecha no válida." }, { status: 400 });

  const productividad = b.productividad === null || b.productividad === "" || b.productividad === undefined ? null : Number(b.productividad);
  if (productividad !== null && ![1, 2, 3].includes(productividad)) {
    return NextResponse.json({ error: "Productividad no válida." }, { status: 400 });
  }
  const nota = typeof b.nota === "string" && b.nota.trim() ? b.nota.trim().slice(0, 500) : null;

  const entrada = (b.ingresos && typeof b.ingresos === "object" ? b.ingresos : {}) as Record<string, unknown>;
  const filas: { tipo: "ingreso"; fecha: string; categoria: Fuente; importe: number; origen: "cierre" }[] = [];
  for (const [fuente, valor] of Object.entries(entrada)) {
    if (!(fuente in FUENTES)) return NextResponse.json({ error: "Fuente desconocida." }, { status: 400 });
    if (valor === "" || valor === null || valor === undefined) continue;
    const importe = Number(String(valor).replace(",", "."));
    if (!Number.isFinite(importe) || importe < 0 || importe > 1e8) {
      return NextResponse.json({ error: `Cantidad no válida en ${FUENTES[fuente as Fuente].texto}.` }, { status: 400 });
    }
    if (importe > 0) filas.push({ tipo: "ingreso", fecha, categoria: fuente as Fuente, importe: Math.round(importe * 100) / 100, origen: "cierre" });
  }

  const admin = createAdminClient();

  // Productividad y nota: una fila por día, o ninguna si no hay nada.
  if (productividad === null && !nota) {
    const { error: e1 } = await admin.from("dias_balance").delete().eq("fecha", fecha);
    if (e1) return fallo(e1);
  } else {
    const { error: e1 } = await admin
      .from("dias_balance")
      .upsert({ fecha, productividad, nota, updated_at: new Date().toISOString() }, { onConflict: "fecha" });
    if (e1) return fallo(e1);
  }

  // Parcial: desde el calendario solo se marca productividad y nota.
  if (b.parcial === true) return NextResponse.json({ ok: true });

  // El dinero del cierre de ese día se sustituye entero; lo manual se queda.
  const { error: e2 } = await admin.from("movimientos").delete().eq("fecha", fecha).eq("origen", "cierre");
  if (e2) return fallo(e2);
  if (filas.length) {
    const { error: e3 } = await admin.from("movimientos").insert(filas);
    if (e3) return fallo(e3);
  }
  return NextResponse.json({ ok: true });
}
