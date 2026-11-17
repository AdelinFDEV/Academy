import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import Tecla from "@/components/cuaderno/Tecla";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import "./pagina-estado.css";

// Sin `robots`: Next ya marca la respuesta 404 como `noindex`.
export const metadata: Metadata = {
  title: "Página no encontrada",
};

/**
 * La página 404 de toda la web, estilo «Cuaderno de estudio» (17-11-2026):
 * una tarjeta de estudio que se gira («¿Dónde está esta página?») sobre un
 * mazo, y dos teclas para volver a terreno conocido. Lleva la barra y el pie
 * de siempre, para que quien llega aquí desde Google pueda seguir navegando.
 *
 * Las URL retiradas (/post/…, /categoria/…, herramientas que ya no existen)
 * NO pasan por aquí: responden 410 desde src/proxy.ts (src/lib/retiradas.ts).
 */
export default async function NotFound() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="pe">
      <SiteNav user={!!user} />

      <main className="pe-main">
        <div className="pe-texto">
          <p className="pe-nota">error 404</p>
          <h1 className="pe-titulo">
            Esta página no está en el <span className="fluor">cuaderno</span>
          </h1>
          <p className="pe-lead">
            Puede que la dirección esté mal escrita o que la página ya no exista. Desde aquí vuelves
            a terreno conocido.
          </p>
          <div className="pe-acciones">
            <Tecla href="/" tamano="grande">Ir a la portada</Tecla>
            <Tecla href="/guias" color="cielo" tamano="grande">Ver las guías</Tecla>
          </div>
        </div>

        <div className="pe-mesa">
          <span className="pe-cifra" aria-hidden="true">404</span>
          <span className="pe-mazo pe-mazo--1" aria-hidden="true" />
          <span className="pe-mazo pe-mazo--2" aria-hidden="true" />
          <TarjetaEstudio
            className="pe-tarjeta"
            color="coral"
            tema="Error 404"
            pregunta="¿Dónde está esta página?"
            respuesta="No existe"
            detalle="Esta dirección no lleva a ninguna página de la academia. Prueba con las guías o vuelve a la portada."
          />
          <p className="pe-flecha" aria-hidden="true">gira la tarjeta ↑</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
