import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import JsonLd from "@/components/JsonLd";
import GlosarioClient from "./GlosarioClient";
import { GLOSARIO, GLOSARIO_CON_PAGINA, GLOSARIO_CATEGORIAS } from "@/lib/glosario";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import "./glosario.css";

/**
 * Diccionario Cripto — listado de los términos.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026), en amarillo, el color del
 * diccionario: la página es un fichero de vocabulario. Arriba, la caja con una
 * ficha que se gira; abajo, el buscador, las categorías y un abecedario de
 * teclas, y cada término es una ficha de cartulina.
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

/** La ficha que se gira en la cabecera, y las dos que asoman detrás. Términos reales. */
const FRENTE = { slug: "fomo", pregunta: "¿Qué es el FOMO?" };
const DETRAS = ["hodl", "whale"];

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

  // La ficha de delante del fichero de la cabecera: una definición real del
  // diccionario, partida en su primera frase (la respuesta) y el resto.
  const frente = GLOSARIO_CON_PAGINA.find((t) => t.slug === FRENTE.slug);
  const corte = frente ? frente.definition.indexOf(". ") : -1;
  const detras = DETRAS.map((slug) => GLOSARIO_CON_PAGINA.find((t) => t.slug === slug)).filter(
    (t): t is (typeof GLOSARIO_CON_PAGINA)[number] => !!t,
  );
  const etiqueta = (id: string) => GLOSARIO_CATEGORIAS.find((c) => c.id === id)?.label ?? id;

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
        <header className="glx-cab">
          <div className="glx-cab-texto">
            <p className="glx-nota">Gratis y sin registro</p>

            <h1 className="glx-titulo">
              Diccionario cripto{" "}
              <span className="glx-titulo-sub">
                <span className="fluor">En cristiano</span>, no en jerga.
              </span>
            </h1>

            <p className="glx-lead">
              Cada palabra que te encuentras y nadie te explica: qué significa,
              por qué importa y cuál es el error típico. Escrito para quien
              empieza, no para quien ya lo sabe.
            </p>

            <ul className="glx-cifras">
              <li>
                <span className="glx-cifra">{GLOSARIO.length}</span>
                <span className="glx-cifra-txt">Términos</span>
              </li>
              <li>
                <span className="glx-cifra">{GLOSARIO_CATEGORIAS.length}</span>
                <span className="glx-cifra-txt">Categorías</span>
              </li>
              <li>
                <span className="glx-cifra">{GLOSARIO_CON_PAGINA.length}</span>
                <span className="glx-cifra-txt">Con explicación larga</span>
              </li>
            </ul>

            {!user && (
              <p className="glx-sesion">
                <Link href="/login">Inicia sesión</Link>&nbsp;si quieres guardar
                términos en tu dashboard. Leerlos no requiere cuenta.
              </p>
            )}
          </div>

          {/* El fichero: la caja con sus pestañas, dos fichas que asoman y la de
              delante, que se gira y enseña la definición real. */}
          <div className="glx-fichero">
            <span className="glx-caja" aria-hidden="true">
              {["A", "D", "H", "M", "S", "W"].map((l) => (
                <i key={l}>{l}</i>
              ))}
            </span>
            {detras.map((t, i) => (
              <span key={t.slug} className={`glx-asoma glx-asoma--${i + 1}`} aria-hidden="true">
                <span className="glx-asoma-cat">{etiqueta(t.category)}</span>
                <span className="glx-asoma-palabra">{t.term}</span>
              </span>
            ))}
            {frente && (
              <TarjetaEstudio
                className="glx-frente"
                color="amarillo"
                tema={etiqueta(frente.category)}
                pregunta={FRENTE.pregunta}
                respuesta={corte === -1 ? frente.definition : frente.definition.slice(0, corte + 1)}
                detalle={corte === -1 ? undefined : frente.definition.slice(corte + 2)}
              />
            )}
            <p className="glx-fichero-nota" aria-hidden="true">gírala ↑</p>
          </div>
        </header>

        <GlosarioClient isLoggedIn={!!user} initialSaved={initialSaved} />
      </main>

      <Footer />
    </div>
  );
}
