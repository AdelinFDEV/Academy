import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hoyISO } from "@/lib/objetivos";

export const dynamic = "force-dynamic";

/**
 * Apunta una marca (80 kg en press banca, tu peso de hoy…) en un objetivo de
 * tipo «marca». Una por día: apuntar otra el mismo día corrige la anterior.
 * Solo admin; solo objetivos.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ recurso: string; id: string }> }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { recurso, id } = await params;
  if (recurso !== "objetivo" || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { valor?: unknown; fecha?: unknown } | null;
  const valor = Number(body?.valor);
  const fecha = typeof body?.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha) ? body.fecha : hoyISO();
  if (!Number.isFinite(valor) || Math.abs(valor) > 1e9) {
    return NextResponse.json({ error: "Escribe un número." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: o } = await admin.from("objetivos").select("metrica").eq("id", id).maybeSingle();
  if (!o) return NextResponse.json({ error: "Objetivo no encontrado." }, { status: 404 });
  if (o.metrica !== "marca") return NextResponse.json({ error: "Este objetivo no se mide con marcas." }, { status: 400 });

  const { error: dbErr } = await admin
    .from("objetivo_marcas")
    .upsert({ objetivo_id: id, fecha, valor }, { onConflict: "objetivo_id,fecha" });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
