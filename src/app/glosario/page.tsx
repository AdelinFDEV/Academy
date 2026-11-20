import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import GlosarioClient from "./GlosarioClient";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";
import "./glosario.css";

/**
 * Diccionario Cripto — listado de los términos.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026), en amarillo, el color del
 * diccionario: la página es un fichero de vocabulario. Sin cabecera (20-11-2026,
 * pedido por el admin): empieza por el buscador, las categorías y un abecedario
 * de teclas, y cada término es una ficha de cartulina. El <h1> sigue estando,
 * oculto a la vista, para Google y los lectores de pantalla.
 *
 * Es el nodo que enlaza a las fichas de cada término, el bloque de URLs más
 * grande del sitio. La paginación de la lista es SOLO visual —ver el comentario
 * en `GlosarioClient`— para no perder ese enlazado.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/glosario" },
  title: "Diccionario cripto: 49 términos explicados",
  description:
    "Qué significan market cap, apalancamiento, vesting o stop-loss, explicados en cristiano y con ejemplos. Gratis y sin registro.",
};

export default async function GlosarioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const initialSaved: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("saved_terms")
      .select("term")
      .eq("user_id", user.id);
    initialSaved.push(...(data ?? []).map((r) => r.term));
  }

  return (
    <div className="glx">
      <JsonLd
        data={{
          "@type": "DefinedTermSet",
          name: "Diccionario Cripto de AdelinBTC Academy",
          description:
            "Términos de criptomonedas y trading explicados para quien empieza.",
          hasDefinedTerm: GLOSARIO_CON_PAGINA.slice(0, 20).map((t) => ({
            "@type": "DefinedTerm",
            name: t.term,
            description: t.definition,
          })),
        }}
      />

      <SiteNav user={!!user} />

      <main className="glx-main">
        <h1 className="sr-only">Diccionario cripto</h1>

        <GlosarioClient isLoggedIn={!!user} initialSaved={initialSaved} />
      </main>

      <Footer />
    </div>
  );
}
