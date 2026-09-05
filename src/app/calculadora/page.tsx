import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import CalculadoraClient from "./CalculadoraClient";

/**
 * Título y descripción escritos para lo que teclea un principiante, no para lo
 * que llamamos nosotros a la herramienta: nadie busca "predicción de precio",
 * pero muchísima gente busca si su moneda "puede llegar a" un precio. La
 * palabra clave va delante porque Google recorta por el final (ver AGENTS.md).
 */
export const metadata: Metadata = {
  title: "Calculadora de precio objetivo cripto",
  description:
    "¿Puede esta moneda llegar a 10 €? Calcula qué capitalización de mercado haría falta y compárala con la de Bitcoin y Ethereum. Gratis y sin registro.",
  alternates: { canonical: "/calculadora" },
};

export default async function CalculadoraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Antes esto era `if (!user) redirect("/login")`. La calculadora es la única
  // herramienta que no usa ningún dato propio: solo capitalización de mercado
  // pública. Cerrarla no protegía nada y costaba la puerta de entrada gratuita
  // — y de paso la dejaba fuera de Google, que solo veía el salto a /login.
  // Ahora se usa sin cuenta, con un tope de cálculos (ver CalculadoraClient).
  let role = "free";
  let userName = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? "free";
    userName = profile?.full_name ?? user.email?.split("@")[0] ?? "Usuario";
  }

  const isPremium = role === "premium" || role === "admin";
  const isAdmin   = role === "admin";

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav
        user={!!user}
        isPremium={isPremium}
        userName={user ? userName : undefined}
        isAdmin={isAdmin}
      />

      <main className="blog-main">
        <CalculadoraClient isLoggedIn={!!user} />

        {/*
          Texto explicativo, y no de relleno: sin él esta página es una
          herramienta sin una sola frase que indexar, y Google no tiene con qué
          posicionarla. Está escrito para lo que pregunta alguien que empieza
          —"¿puede llegar a X?", "está barata porque vale poco"— porque ese es
          el buscador al que queremos responder. Los enlaces van al diccionario,
          con el ancla sobre palabras que ya estaban en el texto (ver AGENTS.md).
        */}
        <section className="calc-explica">
          <h2 className="calc-explica-title">
            Por qué una moneda no sube solo porque sea barata
          </h2>
          <p>
            Es el error más repetido de quien empieza: ver una moneda a
            0,0001 € y pensar que llegar a 1 € es fácil «porque le falta poco».
            Lo que decide cuánto puede valer una moneda no es su precio, sino su{" "}
            <Link href="/glosario/market-cap">capitalización de mercado</Link>:
            el precio multiplicado por su{" "}
            <Link href="/glosario/oferta-circulante">oferta circulante</Link>, es
            decir, todas las monedas que hay realmente en el mercado.
          </p>
          <p>
            Si una moneda tiene 100.000 millones de unidades, que llegue a 1 €
            significa que valdría 100.000 millones de euros — más que casi
            cualquier empresa cotizada. Visto así, la pregunta se responde sola.
          </p>

          <h2 className="calc-explica-title">Cómo se usa esta calculadora</h2>
          <p>
            Escribe cuántas monedas hay en circulación y el precio al que te
            gustaría verla. La calculadora te dice qué capitalización haría
            falta para ese precio y la pone al lado de la
            de <Link href="/glosario/bitcoin">Bitcoin</Link> y Ethereum, con
            datos en tiempo real. Si el número que sale es varias veces el de
            Bitcoin, ya tienes tu respuesta.
          </p>
          <p>
            No es una predicción ni un consejo de inversión: es una comprobación
            de si un precio objetivo se sostiene. Sirve para descartar fantasías
            antes de poner dinero, que es la parte del{" "}
            <Link href="/glosario/dyor">análisis por tu cuenta</Link> que más
            gente se salta.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
