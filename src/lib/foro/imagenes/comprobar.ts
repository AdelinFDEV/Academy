import "server-only";
import sharp from "sharp";

/**
 * Comprobar y recodificar una imagen subida por un usuario (FORO.md §6.6).
 *
 * Entra el archivo tal cual lo subió. Sale, o un WebP nuevo generado por el
 * servidor, o un rechazo. Lo que se guarda y se enseña NUNCA es el archivo
 * original: es otro, pintado de cero a partir de sus píxeles. Eso:
 *   · destruye cualquier cosa escondida en el original (un script pegado al
 *     final, un archivo que es a la vez imagen y otra cosa);
 *   · borra los metadatos EXIF, que en una foto de móvil llevan la ubicación
 *     GPS de quien la hizo.
 *
 * Aquí no se toca la red ni la base de datos: solo bytes. Así se puede probar
 * con archivos maliciosos sin montar nada.
 */

export const IMAGEN = {
  /** Lo que puede pesar el archivo subido. El bucket lo limita también. */
  bytesMaximos: 5 * 1024 * 1024,
  /** Lado mayor de la imagen guardada. */
  ladoGuardado: 1600,
  /** Lado mayor que se admite en el original. */
  ladoMaximo: 10_000,
  /**
   * Píxeles totales que se admiten. Una imagen de 20.000 × 20.000 de un solo
   * color pesa pocos KB comprimida y ocupa 1,6 GB al abrirla: se corta ANTES
   * de decodificar, leyendo solo su cabecera.
   */
  pixelesMaximos: 40_000_000,
  /** Lo que puede pesar el WebP guardado. El bucket público lo limita también. */
  bytesGuardados: 2 * 1024 * 1024,
} as const;

export type ImagenLista = { ok: true; webp: Buffer; ancho: number; alto: number };
export type ImagenRechazada = { ok: false; motivo: string };

const rechazo = (motivo: string): ImagenRechazada => ({ ok: false, motivo });

type Formato = "jpeg" | "png" | "webp";

/**
 * Qué es el archivo DE VERDAD, por sus primeros bytes. No se mira la
 * extensión ni el tipo que diga el navegador: los dos los elige quien sube.
 * Un SVG (que puede llevar código), un GIF, un PDF o un PHP renombrado a
 * `.jpg` no empiezan por ninguna de estas firmas.
 */
function formatoReal(b: Buffer): Formato | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.length >= 12 && b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
  return null;
}

export async function comprobarYRecodificar(original: Buffer): Promise<ImagenLista | ImagenRechazada> {
  if (original.length === 0) return rechazo("El archivo está vacío.");
  if (original.length > IMAGEN.bytesMaximos) return rechazo("La imagen pesa más de 5 MB.");

  const formato = formatoReal(original);
  if (!formato) return rechazo("Solo se pueden subir imágenes JPG, PNG o WebP.");

  try {
    // `limitInputPixels` hace que sharp se niegue a abrir una imagen enorme;
    // `failOn: "error"` rechaza un archivo roto en vez de pintar lo que pueda.
    const opciones = { limitInputPixels: IMAGEN.pixelesMaximos, failOn: "error", animated: false } as const;
    const meta = await sharp(original, opciones).metadata();

    // La cabecera tiene que decir lo mismo que la firma.
    if (meta.format !== formato) return rechazo("El archivo no es una imagen válida.");
    if (!meta.width || !meta.height) return rechazo("El archivo no es una imagen válida.");
    if (meta.width > IMAGEN.ladoMaximo || meta.height > IMAGEN.ladoMaximo) return rechazo("La imagen es demasiado grande.");
    // Nada animado: un WebP con varios fotogramas es un GIF con otro nombre.
    if ((meta.pages ?? 1) > 1) return rechazo("No se pueden subir imágenes animadas.");

    const { data, info } = await sharp(original, opciones)
      .rotate() // aplica la orientación del EXIF antes de tirarlo
      .resize({ width: IMAGEN.ladoGuardado, height: IMAGEN.ladoGuardado, fit: "inside", withoutEnlargement: true })
      // Sin `withMetadata()`: sharp no copia EXIF, ICC ni XMP al archivo nuevo.
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    if (data.length > IMAGEN.bytesGuardados) return rechazo("La imagen es demasiado compleja. Prueba con una captura más pequeña.");
    return { ok: true, webp: data, ancho: info.width, alto: info.height };
  } catch {
    // Archivo roto, truncado, o por encima del tope de píxeles.
    return rechazo("El archivo no es una imagen válida o es demasiado grande.");
  }
}
