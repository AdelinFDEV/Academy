import JsonLd from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { GUIDES } from "@/lib/guides";

/**
 * Migas de pan en JSON-LD para una guía: Inicio › Guías › la guía.
 *
 * Existe como componente y no copiado en cada guía porque el nombre sale de
 * `GUIDES` (`src/lib/guides.ts`), que ya es la fuente de verdad del listado y
 * del sitemap. Así el título del dato estructurado no puede desincronizarse
 * del que se ve en `/guias`.
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
      data={breadcrumbSchema([
        { name: "Inicio", path: "/" },
        { name: "Guías", path: "/guias" },
        { name: guia.title, path: `/guias/${guia.slug}` },
      ])}
    />
  );
}
