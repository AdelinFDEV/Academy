import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema, guideSchema } from "@/lib/schema";
import { GUIDES } from "@/lib/guides";

/**
 * El JSON-LD de una guía: el `Article` con su muro declarado y las migas de
 * pan Inicio › Guías › la guía.
 *
 * Conserva el nombre de cuando solo emitía las migas porque es el que buscan
 * `scripts/check-code.mjs` y las instrucciones de `/admin/guias-instrucciones`.
 *
 * Existe como componente y no copiado en cada guía porque todo sale de
 * `GUIDES` (`src/lib/guides.ts`), que ya es la fuente de verdad del listado y
 * del sitemap. Así el título del dato estructurado no puede desincronizarse
 * del que se ve en `/guias`, y el muro se declara en un solo sitio (`muro`).
 *
 * Si el slug no está en `GUIDES` no emite nada. No es un descuido: una guía que
 * falta en ese array **ya está rota** para el SEO — no aparece en el sitemap ni
 * en el listado, así que Google no la ve. Inventarle aquí unas migas no lo
 * arreglaría; lo que hay que hacer es darla de alta en `GUIDES`.
 */
export default function GuideBreadcrumbJsonLd({ slug }: { slug: string }) {
  const guia = GUIDES.find((g) => g.slug === slug);
  if (!guia) return null;

  return (
    <JsonLd
      data={[
        guideSchema({
          slug: guia.slug,
          title: guia.title,
          description: guia.description,
          abierta: guia.muro === null,
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
