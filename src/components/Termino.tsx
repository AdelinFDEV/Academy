import Link from "next/link";

/**
 * Un término técnico enlazado a su ficha del diccionario, dentro del texto de
 * una guía. Se usa solo en la PRIMERA aparición de cada término.
 *
 * El `slug` tiene que existir en `src/lib/glosario.ts` y tener `extended`: sin
 * eso, la ficha da 404.
 */
export default function Termino({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <Link href={`/glosario/${slug}`}>{children}</Link>;
}
