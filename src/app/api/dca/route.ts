import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Las compras del DCA de Bitcoin.
 *
 * A diferencia de `/api/portfolio`, aquí **no se fusiona nada**: cada compra es
 * una fila, porque en un DCA el histórico es justo lo que hay que enseñar.
 *
 * Leer exige Premium; escribir, ser admin. La tabla no tiene ninguna policy de
 * escritura a propósito, así que todo pasa por aquí con la clave de servicio.
 */

async function getUsuario() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isPremium: false, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "free";
  return {
    user,
    isPremium: role === "premium" || role === "admin",
    isAdmin: role === "admin",
  };
}

export async function GET() {
  const { isPremium } = await getUsuario();
  if (!isPremium) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dca_compras")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * Valida lo que llega del formulario.
 *
 * El precio de BTC se comprueba contra un rango amplio pero no absurdo: el
 * error real que se comete al apuntar una compra a mano es teclear 8800 en vez
 * de 88000, y eso desplaza el precio medio de toda la cartera sin que nada
 * chirríe a simple vista.
 */
function validar(body: Record<string, unknown>) {
  const importe = parseFloat(String(body.importe));
  const precio = parseFloat(String(body.precio_btc));
  const fecha = String(body.fecha ?? "");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return { error: "Falta la fecha (AAAA-MM-DD)." };
  if (!isFinite(importe) || importe <= 0) return { error: "El importe tiene que ser mayor que cero." };
  if (!isFinite(precio) || precio <= 0) return { error: "El precio de BTC tiene que ser mayor que cero." };
  if (precio < 1000) {
    return { error: `¿${precio} $ por bitcoin? Parece que falta algún cero. Si es correcto, dímelo y quito el aviso.` };
  }
  if (new Date(fecha) > new Date()) return { error: "La fecha está en el futuro." };

  const estado = body.estado === "pendiente" ? "pendiente" : "realizada";
  return {
    datos: {
      fecha,
      importe,
      precio_btc: precio,
      estado,
      notas: typeof body.notas === "string" && body.notas.trim() ? body.notas.trim() : null,
    },
  };
}

export async function POST(req: Request) {
  const { isAdmin } = await getUsuario();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { error: fallo, datos } = validar(await req.json());
  if (fallo || !datos) return NextResponse.json({ error: fallo }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("dca_compras").insert(datos).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const { isAdmin } = await getUsuario();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id ?? "");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const { error: fallo, datos } = validar(body);
  if (fallo || !datos) return NextResponse.json({ error: fallo }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("dca_compras")
    .update({ ...datos, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const { isAdmin } = await getUsuario();
  if (!isAdmin) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta el id." }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from("dca_compras").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
