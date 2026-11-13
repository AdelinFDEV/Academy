import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, guideSchema } from "@/lib/schema";
import { getGuide } from "@/lib/guides";
import { borradorSinPublicar } from "@/lib/guiasVisibles";
import { sesionActual } from "@/lib/cursos";

/**
 * El JSON-LD de una guía: el `Article` y las migas de pan Inicio › Guías › la
 * guía. Y, desde el 13-11-2026, **la puerta de los borradores**.
 *
 * Conserva el nombre de cuando solo emitía las migas porque es el que buscan
 * `scripts/check-code.mjs` y las instrucciones de `/admin/guias-instrucciones`.
 *
 * Existe como componente y no copiado en cada guía porque todo sale de
 * `src/lib/guides.ts`, que ya es la fuente de verdad del listado y del
 * sitemap. Así el título del dato estructurado no puede desincronizarse del
 * que se ve en `/guias`.
 *
 * ── La puerta ──────────────────────────────────────────────────────────────
 * Toda guía lleva este componente (lo exige `npm run check`), así que es el
 * único sitio por el que pasan todas. Si la guía es un borrador que el admin
 * aún no ha publicado desde /admin/acciones:
 *   · a cualquiera que no sea admin, 404: la página no existe todavía;
 *   · al admin, un aviso arriba de que está viendo un borrador, y sin JSON-LD.
 *
 * Si el slug no está ni en `GUIDES` ni en `BORRADORES` no emite nada: una guía
 * sin dar de alta ya está rota para el SEO, y unas migas no lo arreglan.
 */
export default async function GuideBreadcrumbJsonLd({ slug }: { slug: string }) {
  const guia = getGuide(slug);
  if (!guia) return null;

  if (await borradorSinPublicar(slug)) {
    const sesion = await sesionActual();
    if (!sesion?.esAdmin) notFound();
    return (
      <p className="gbc-borrador" role="status">
        <strong>Borrador.</strong> Solo tú ves esta guía. Para publicarla, ve a{" "}
        <Link href="/admin/acciones">Acciones</Link>.
      </p>
    );
  }

  return (
    <JsonLd
      data={[
        guideSchema({
          slug: guia.slug,
          title: guia.title,
          description: guia.description,
          imagenPropia: guia.imagenPropia,
        }),
        breadcrumbSchema([
          { name: "Inicio", path: "/" },
          { name: "Guías", path: "/guias" },
          { name: guia.title, path: `/guias/${guia.slug}` },
        ]),
      ]}
    />
  );
}
