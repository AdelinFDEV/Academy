import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cgFetch, coingeckoIdExiste, errorIdDesconocido, sugerirCoingeckoId } from "@/lib/coingecko";
import { registrarMovimiento } from "@/lib/portfolio-movimientos";
import { NextResponse } from "next/server";

interface FilaPosicion {
  coin_symbol: string;
  coin_name: string;
  coingecko_id: string | null;
  buy_price: number;
  quantity: number;
}

/** Precio de mercado en dólares, o null si CoinGecko no responde. */
async function precioMercado(id: string | null): Promise<number | null> {
  if (!id) return null;
  try {
    const res = await cgFetch(`/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as Record<string, { usd?: number }>;
    const usd = json[id]?.usd;
    return typeof usd === "number" ? usd : null;
  } catch {
    return null;
  }
}

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { coin_symbol, coin_name, coingecko_id, buy_price, quantity, buy_date, notes } = body;

  // Editar es también por donde se ARREGLA un id malo, así que se comprueba
  // igual que al crear: si no, se cambia un id muerto por otro y la fila
  // sigue sin precios. Ver src/lib/coingecko.ts.
  if (coingecko_id) {
    const cgId = coingecko_id.toLowerCase().trim();
    if (!(await coingeckoIdExiste(cgId))) {
      const sugerencia = await sugerirCoingeckoId(coin_symbol || cgId);
      return NextResponse.json({ error: errorIdDesconocido(cgId, sugerencia) }, { status: 400 });
    }
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (coin_symbol) updates.coin_symbol = coin_symbol.toUpperCase().trim();
  if (coin_name) updates.coin_name = coin_name.trim();
  if (coingecko_id) updates.coingecko_id = coingecko_id.toLowerCase().trim();
  if (buy_price !== undefined) updates.buy_price = parseFloat(buy_price);
  if (quantity !== undefined) updates.quantity = parseFloat(quantity);
  if (buy_date) updates.buy_date = buy_date;
  if (notes !== undefined) updates.notes = notes?.trim() || null;

  const supabase = createAdminClient();

  // La fila de antes, para saber si la edición es un MOVIMIENTO (cambia la
  // cantidad) o solo una corrección (precio, fecha, notas), que no se apunta.
  const { data: antes } = await supabase
    .from("portfolio_positions")
    .select("coin_symbol, coin_name, coingecko_id, buy_price, quantity")
    .eq("id", id)
    .maybeSingle<FilaPosicion>();

  const { data, error } = await supabase
    .from("portfolio_positions")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (antes && typeof updates.quantity === "number" && Number.isFinite(updates.quantity)) {
    const qAntes = Number(antes.quantity);
    const qDespues = updates.quantity;
    const diferencia = qDespues - qAntes;
    // Tolerancia relativa: la cantidad sale de dividir dinero entre precio en
    // el formulario, y reeditar sin tocar nada puede mover el último decimal.
    if (Math.abs(diferencia) > Math.max(qAntes, qDespues) * 1e-6) {
      const fila = data as FilaPosicion;
      if (diferencia > 0) {
        // Precio de lo añadido: lo invertido de más entre los tokens de más.
        const invertidoAntes = Number(antes.buy_price) * qAntes;
        const invertidoDespues = Number(fila.buy_price) * qDespues;
        const precio = (invertidoDespues - invertidoAntes) / diferencia;
        await registrarMovimiento(supabase, {
          tipo: "ampliacion",
          coin_symbol: fila.coin_symbol,
          coin_name: fila.coin_name,
          coingecko_id: fila.coingecko_id,
          precio: precio > 0 ? precio : null,
          cantidad: diferencia,
          nota: null,
        });
      } else {
        await registrarMovimiento(supabase, {
          tipo: "reduccion",
          coin_symbol: fila.coin_symbol,
          coin_name: fila.coin_name,
          coingecko_id: fila.coingecko_id,
          precio: await precioMercado(fila.coingecko_id),
          cantidad: -diferencia,
          nota: null,
        });
      }
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { id } = await params;
  const supabase = createAdminClient();
  const { data: antes } = await supabase
    .from("portfolio_positions")
    .select("coin_symbol, coin_name, coingecko_id, buy_price, quantity")
    .eq("id", id)
    .maybeSingle<FilaPosicion>();

  const { error } = await supabase
    .from("portfolio_positions")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Borrar la posición es cerrarla: se apunta como venta al precio de mercado.
  if (antes) {
    await registrarMovimiento(supabase, {
      tipo: "cierre",
      coin_symbol: antes.coin_symbol,
      coin_name: antes.coin_name,
      coingecko_id: antes.coingecko_id,
      precio: await precioMercado(antes.coingecko_id),
      cantidad: Number(antes.quantity),
      nota: null,
    });
  }

  return NextResponse.json({ ok: true });
}
