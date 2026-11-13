import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { comprobarYRecodificar } from "@/lib/foro/imagenes/comprobar";
import { COLUMNA, borrarCaptura, esTipo, esUuid, guardarCaptura, urlDeCaptura } from "@/lib/diarioCapturas";

/**
 * Las capturas de antes y después de una operación del Diario.
 *   GET    ?id=<operación>&tipo=antes|despues  → redirige a la imagen (URL firmada)
 *   POST   multipart: id, tipo, archivo        → la guarda y devuelve la operación
 *   DELETE { id, tipo }                        → la quita y devuelve la operación
 *
 * En las tres se comprueba lo mismo: sesión, acceso al Diario y que la
 * operación es de quien la pide. Ver `src/lib/diarioCapturas.ts`.
 */

/** Tope de lo que se acepta. El navegador ya la reduce antes de enviarla. */
const BYTES_MAXIMOS = 4 * 1024 * 1024;
const FALTA_SQL = "Las capturas aún no están activadas: falta ejecutar scripts/add-trades-capturas.sql en Supabase.";

async function acceso() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const puede = profile?.role === "premium" || profile?.role === "admin";
  return { user: puede ? user : null, supabase };
}

const no = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(req: Request) {
  const { user, supabase } = await acceso();
  if (!user) return no("Unauthorized", 401);

  const p = new URL(req.url).searchParams;
  const id = p.get("id");
  const tipo = p.get("tipo");
  if (!esUuid(id) || !esTipo(tipo)) return no("Petición inválida", 400);

  const { data: trade } = await supabase.from("trades").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!trade?.[COLUMNA[tipo]]) return no("No hay captura", 404);

  const url = await urlDeCaptura(user.id, id, tipo);
  if (!url) return no("No hay captura", 404);

  // La URL firmada dura 5 minutos; el navegador puede reutilizar la redirección 4.
  return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, max-age=240" } });
}

export async function POST(req: Request) {
  const { user, supabase } = await acceso();
  if (!user) return no("Unauthorized", 401);

  const form = await req.formData().catch(() => null);
  const id = form?.get("id");
  const tipo = form?.get("tipo");
  const archivo = form?.get("archivo");
  if (!esUuid(id) || !esTipo(tipo) || !(archivo instanceof Blob)) return no("Petición inválida", 400);
  if (archivo.size > BYTES_MAXIMOS) return no("La captura pesa demasiado. Prueba con una más pequeña.", 413);

  const { data: trade } = await supabase.from("trades").select("id").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (!trade) return no("Operación no encontrada", 404);

  const imagen = await comprobarYRecodificar(Buffer.from(await archivo.arrayBuffer()));
  if (!imagen.ok) return no(imagen.motivo, 400);

  const fallo = await guardarCaptura(user.id, id, tipo, imagen.webp);
  if (fallo) {
    console.error("[diario-capturas] subir:", fallo);
    return no(/bucket/i.test(fallo) ? FALTA_SQL : "No se pudo guardar la captura", 500);
  }

  const { data, error } = await supabase
    .from("trades")
    .update({ [COLUMNA[tipo]]: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    // Sin la columna no hay forma de saber que la captura existe: se retira.
    await borrarCaptura(user.id, id, tipo);
    return no(/captura_/.test(error.message) ? FALTA_SQL : error.message, 500);
  }
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { user, supabase } = await acceso();
  if (!user) return no("Unauthorized", 401);

  const cuerpo: { id?: unknown; tipo?: unknown } = await req.json().catch(() => ({}));
  const { id, tipo } = cuerpo;
  if (!esUuid(id) || !esTipo(tipo)) return no("Petición inválida", 400);

  const { data, error } = await supabase
    .from("trades")
    .update({ [COLUMNA[tipo]]: null })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return no(/captura_/.test(error.message) ? FALTA_SQL : error.message, 500);
  await borrarCaptura(user.id, id, tipo);
  return NextResponse.json(data);
}
