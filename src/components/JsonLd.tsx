import type { JsonLdNode } from "@/lib/schema";

/**
 * Inserta uno o varios nodos JSON-LD en la página.
 *
 * Va con `<script type="application/ld+json">` y `dangerouslySetInnerHTML`
 * porque es la única forma de que React no escape las comillas del JSON: con
 * `{JSON.stringify(...)}` como hijo, las `"` salen como `&quot;` y Google no
 * puede leerlo.
 *
 * Cuando hay más de un nodo se emiten dentro de un `@graph` en un solo script,
 * que es como se declara que las entidades pertenecen al mismo grafo y pueden
 * referenciarse entre ellas por `@id`.
 *
 * Es un componente de servidor a propósito: el JSON tiene que estar en el HTML
 * que recibe el rastreador, no aparecer después con JavaScript.
 */
export default function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const nodos = Array.isArray(data) ? data : [data];
  const payload =
    nodos.length === 1
      ? { "@context": "https://schema.org", ...nodos[0] }
      : { "@context": "https://schema.org", "@graph": nodos };

  return (
    <script
      type="application/ld+json"
      // `</script>` dentro de una cadena del JSON cerraría la etiqueta antes de
      // tiempo. No debería pasar con estos datos, pero escaparlo cuesta nada y
      // evita una inyección si algún día un campo viene de la base de datos con
      // HTML dentro.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
      }}
    />
  );
}
