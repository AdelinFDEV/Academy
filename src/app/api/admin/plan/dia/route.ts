import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { FUENTES, type Fuente } from "@/lib/objetivos";

export const dynamic = "force-dynamic";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Si falta la tabla (PGRST205), dice qué hacer en vez del error de PostgREST. */
function fallo(e: { code?: string; message: string }) {
  const mensaje = e.code === "PGRST205"
    ? "Falta crear las tablas del cierre del día: ejecuta scripts/create-objetivos.sql en el SQL Editor de Supabase."
    : e.message;
  return NextResponse.json({ error: mensaje }, { status: 500 });
}

/**
 * Guarda el cierre de un día: productividad, nota y lo ganado por fuente.
 * Volver a guardar el mismo día lo sustituye entero, salvo con `parcial`
 * (el marcado rápido del calendario), que deja el dinero como estaba. Solo admin; las dos
 * tablas no tienen policies (scripts/create-objetivos.sql).
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
  const filas: { fecha: string; fuente: Fuente; importe: number }[] = [];
  for (const [fuente, valor] of Object.entries(entrada)) {
    if (!(fuente in FUENTES)) return NextResponse.json({ error: "Fuente desconocida." }, { status: 400 });
    if (valor === "" || valor === null || valor === undefined) continue;
    const importe = Number(String(valor).replace(",", "."));
    if (!Number.isFinite(importe) || importe < 0 || importe > 1e8) {
      return NextResponse.json({ error: `Cantidad no válida en ${FUENTES[fuente as Fuente].texto}.` }, { status: 400 });
    }
    if (importe > 0) filas.push({ fecha, fuente: fuente as Fuente, importe: Math.round(importe * 100) / 100 });
  }

  const admin = createAdminClient();

  // Parcial: desde el calendario solo se marca productividad y nota; el dinero no se toca.
  if (b.parcial === true) {
    if (productividad === null && !nota) {
      const { count, error: e0 } = await admin.from("ingresos_dia").select("fecha", { count: "exact", head: true }).eq("fecha", fecha);
      if (e0) return fallo(e0);
      if (!count) {
        const { error: e1 } = await admin.from("dias_balance").delete().eq("fecha", fecha);
        if (e1) return fallo(e1);
        return NextResponse.json({ ok: true, borrado: true });
      }
    }
    const { error: e2 } = await admin
      .from("dias_balance")
      .upsert({ fecha, productividad, nota, updated_at: new Date().toISOString() }, { onConflict: "fecha" });
    if (e2) return fallo(e2);
    return NextResponse.json({ ok: true });
  }

  const vacio = productividad === null && !nota && !filas.length;

  // Sustituye el día entero: lo que se haya quitado en el formulario se borra.
  const { error: e1 } = await admin.from("ingresos_dia").delete().eq("fecha", fecha);
  if (e1) return fallo(e1);

  if (vacio) {
    const { error: e2 } = await admin.from("dias_balance").delete().eq("fecha", fecha);
    if (e2) return fallo(e2);
    return NextResponse.json({ ok: true, borrado: true });
  }

  const { error: e3 } = await admin
    .from("dias_balance")
    .upsert({ fecha, productividad, nota, updated_at: new Date().toISOString() }, { onConflict: "fecha" });
  if (e3) return fallo(e3);

  if (filas.length) {
    const { error: e4 } = await admin.from("ingresos_dia").insert(filas);
    if (e4) return fallo(e4);
  }
  return NextResponse.json({ ok: true });
}
