import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Ánimo y nota de un día del Diario de Trading. Tabla: scripts/create-diario-dias.sql. */

const NOTA_MAX = 600;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

async function premiumUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isPremium = profile?.role === "premium" || profile?.role === "admin";
  return { user: isPremium ? user : null, supabase };
}

interface Body {
  fecha?: unknown;
  animo?: unknown;
  nota?: unknown;
}

/**
 * Guarda el día entero (ánimo y nota). Si los dos quedan vacíos, borra la fila:
 * un día sin nada apuntado no ocupa sitio.
 */
export async function PUT(req: Request) {
  const { user, supabase } = await premiumUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  const { fecha, animo, nota } = body;
  if (typeof fecha !== "string" || !FECHA.test(fecha) || isNaN(new Date(`${fecha}T12:00:00`).getTime())) {
    return NextResponse.json({ error: "Fecha inválida" }, { status: 400 });
  }
  if (animo != null && !(typeof animo === "number" && Number.isInteger(animo) && animo >= 1 && animo <= 4)) {
    return NextResponse.json({ error: "Ánimo inválido" }, { status: 400 });
  }
  if (nota != null && typeof nota !== "string") {
    return NextResponse.json({ error: "Nota inválida" }, { status: 400 });
  }
  const texto = typeof nota === "string" ? nota.trim() : "";
  if (texto.length > NOTA_MAX) {
    return NextResponse.json({ error: `La nota no puede pasar de ${NOTA_MAX} caracteres` }, { status: 400 });
  }

  if (animo == null && !texto) {
    const { error } = await supabase.from("diario_dias").delete().eq("user_id", user.id).eq("fecha", fecha);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ fecha, animo: null, nota: null });
  }

  const { data, error } = await supabase
    .from("diario_dias")
    .upsert(
      { user_id: user.id, fecha, animo: animo ?? null, nota: texto || null, updated_at: new Date().toISOString() },
      { onConflict: "user_id,fecha" },
    )
    .select("fecha, animo, nota")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
