import Image from "next/image";

/**
 * El cohete junto a «Mejora como trader», en el menú del móvil (17-11-2026).
 * Primero fue una escena dibujada en SVG al pie de la hoja y después un
 * cohete en SVG; desde el mismo día es una pegatina del cuaderno (ESTILO.md,
 * «Las pegatinas del cuaderno»), generada por el admin con el prompt base.
 * Original en public/; aquí, la copia ligera de 200 px de alto
 * (public/cuaderno/cohete-pegatina.webp, 15 KB). Decoración pura (`alt=""`);
 * el sitio y la animación, en menu-movil.css (`.mm-cohete`).
 */
export default function CoheteGarabato() {
  return (
    <Image
      src="/cuaderno/cohete-pegatina.webp"
      alt=""
      width={152}
      height={200}
      className="mm-cohete"
      draggable={false}
    />
  );
}
