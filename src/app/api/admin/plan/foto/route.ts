import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Tope por foto. El navegador ya las reduce a WebP de 1.600 px antes de subirlas (~300 KB). */
const MAX_BYTES = 4 * 1024 * 1024;

/**
 * El tipo REAL del archivo, leído de sus primeros bytes. No se mira ni el
 * nombre ni el tipo que declara el navegador: los dos los pone quien sube, y la
 * auditoría de seguridad ya señaló fiarse de la extensión (TAREAS.md, avatares).
 */
function tipoReal(b: Uint8Array): { ext: "webp" | "jpg" | "png"; mime: string } | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { ext: "webp", mime: "image/webp" };
  }
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  return null;
}

/**
 * Sube una foto del diario al bucket PRIVADO `diario` y devuelve su ruta.
 * Solo el admin. La foto no queda unida a ninguna nota hasta que la nota se
 * guarda con esa ruta en `fotos`.
 */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const form = await req.formData().catch(() => null);
  const archivo = form?.get("foto");
  if (!(archivo instanceof File)) return NextResponse.json({ error: "No llegó ninguna foto." }, { status: 400 });
  if (archivo.size > MAX_BYTES) return NextResponse.json({ error: "La foto pesa demasiado (máx. 4 MB)." }, { status: 400 });

  const bytes = new Uint8Array(await archivo.arrayBuffer());
  const tipo = tipoReal(bytes);
  if (!tipo) return NextResponse.json({ error: "Solo se admiten imágenes WebP, JPG o PNG." }, { status: 400 });

  const ruta = `${randomUUID()}.${tipo.ext}`;
  const { error: subida } = await createAdminClient()
    .storage.from("diario")
    .upload(ruta, bytes, { contentType: tipo.mime, upsert: false });

  if (subida) {
    const sinBucket = /bucket/i.test(subida.message);
    return NextResponse.json(
      { error: sinBucket ? "Falta el bucket «diario»: ejecuta otra vez scripts/create-objetivos.sql." : subida.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, ruta });
}
