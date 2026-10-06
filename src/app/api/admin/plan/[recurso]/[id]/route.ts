import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECURSOS, VALIDAR, esRecurso, fijarProgreso, marcarPublicada, mensajeError } from "@/lib/objetivosValidar";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ recurso: string; id: string }> };

const UUID = /^[0-9a-f-]{36}$/i;

type Admin = ReturnType<typeof createAdminClient>;

/** Las fotos que tiene ahora una nota, para borrar del bucket las que se quiten. */
async function fotosDeNota(admin: Admin, id: string): Promise<string[]> {
  const { data } = await admin.from("diario_notas").select("fotos").eq("id", id).maybeSingle();
  return (data?.fotos as string[] | null) ?? [];
}

/** Borra fotos del bucket privado. Un fallo aquí no deshace lo guardado: solo deja un archivo huérfano. */
async function borrarFotos(admin: Admin, rutas: string[]) {
  if (!rutas.length) return;
  const { error } = await admin.storage.from("diario").remove(rutas);
  if (error) console.error("[diario] No se pudieron borrar fotos:", error.message);
}

/** Edita un objetivo, una pieza o una nota. Se manda siempre la ficha entera. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso, id } = await params;
  if (!esRecurso(recurso) || !UUID.test(id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Petición vacía" }, { status: 400 });

  const v = VALIDAR[recurso](body as Record<string, unknown>);
  if (!v.datos) return NextResponse.json({ error: v.error }, { status: 400 });

  const admin = createAdminClient();
  const fotosAntes = recurso === "nota" ? await fotosDeNota(admin, id) : [];

  let cambio = admin.from(RECURSOS[recurso]).update(v.datos).eq("id", id);
  // Los movimientos del cierre del día solo los cambia su propia API.
  if (recurso === "movimiento") cambio = cambio.eq("origen", "manual");
  const { error: dbErr } = await cambio;
  if (dbErr) return NextResponse.json({ error: mensajeError(dbErr) }, { status: 500 });

  if (recurso === "pieza") await marcarPublicada(admin, id, v.datos);
  if (recurso === "objetivo" && v.datos.metrica === "manual") {
    const progreso = Number((body as Record<string, unknown>).progreso_periodo);
    if (Number.isFinite(progreso) && progreso >= 0) await fijarProgreso(admin, id, () => progreso);
  }
  if (recurso === "nota") {
    const ahora = new Set((v.datos.fotos as string[] | undefined) ?? []);
    await borrarFotos(admin, fotosAntes.filter((f) => !ahora.has(f)));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso, id } = await params;
  if (!esRecurso(recurso) || !UUID.test(id)) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const admin = createAdminClient();
  const fotos = recurso === "nota" ? await fotosDeNota(admin, id) : [];

  let borrado = admin.from(RECURSOS[recurso]).delete().eq("id", id);
  if (recurso === "movimiento") borrado = borrado.eq("origen", "manual");
  const { error: dbErr } = await borrado;
  if (dbErr) return NextResponse.json({ error: mensajeError(dbErr) }, { status: 500 });

  await borrarFotos(admin, fotos);
  return NextResponse.json({ ok: true });
}
