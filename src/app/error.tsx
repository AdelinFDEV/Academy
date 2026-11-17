"use client";

import { useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Tecla from "@/components/cuaderno/Tecla";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import InterruptorSonido from "@/components/cuaderno/InterruptorSonido";
import "@/components/site-nav.css";
import "./pagina-estado.css";

/**
 * El error inesperado de cualquier página (error.js de Next), estilo
 * «Cuaderno de estudio» (17-11-2026), hermano de not-found.tsx: la misma mesa
 * con su tarjeta que se gira y una tecla para volver a intentarlo.
 *
 * Es un componente de cliente (Next lo exige), así que la barra es la tira
 * con la marca y el altavoz, como en las páginas legales: SiteNav lee la sesión en el
 * servidor y aquí no se puede. Los fallos del layout raíz no llegan aquí (eso
 * sería global-error.js, que no existe).
 *
 * `retry` vuelve a pedir y pintar la página (Next 16.3+; `reset` solo repinta).
 */
export default function ErrorPagina({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;

  return (
    <div className="pe">
      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          Adelin<em>BTC</em>
        </Link>
        {/* El altavoz, también aquí: los sonidos vienen encendidos y
            silenciarlos tiene que estar a mano en todas las páginas. */}
        <div className="blog-nav-end">
          <span className="nav-sonido">
            <InterruptorSonido />
          </span>
        </div>
      </nav>

      <main className="pe-main">
        <div className="pe-texto">
          <p className="pe-nota">algo ha fallado</p>
          <h1 className="pe-titulo">
            Esta página se ha <span className="fluor">atascado</span>
          </h1>
          <p className="pe-lead">
            Algo ha fallado al cargarla. Vuelve a intentarlo y, si sigue igual, prueba de nuevo en unos
            minutos.
          </p>
          <div className="pe-acciones">
            <Tecla tamano="grande" onClick={() => retry()}>Volver a intentarlo</Tecla>
            <Tecla href="/" color="blanca" tamano="grande">Ir a la portada</Tecla>
          </div>
          {digest && <p className="pe-codigo">Código del fallo: {digest}</p>}
        </div>

        <div className="pe-mesa">
          <span className="pe-cifra" aria-hidden="true">¡Uy!</span>
          <span className="pe-mazo pe-mazo--1" aria-hidden="true" />
          <span className="pe-mazo pe-mazo--2" aria-hidden="true" />
          <TarjetaEstudio
            className="pe-tarjeta"
            color="amarillo"
            tema="Error"
            pregunta="¿Qué ha pasado?"
            respuesta="Un tropiezo"
            detalle="La página no ha podido cargarse. Volver a intentarlo suele bastar."
          />
          <p className="pe-flecha" aria-hidden="true">gira la tarjeta ↑</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
