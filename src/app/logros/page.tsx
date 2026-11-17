import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Footer from "@/components/Footer";
import { BADGE_DEFS, GUIDE_BADGE_DEFS } from "@/lib/logros";
import SiteNav from "@/components/SiteNav";
import Tecla from "@/components/cuaderno/Tecla";
import Anotacion from "@/components/cuaderno/Anotacion";
import PegatinaLogro, { colorDeLogro } from "@/components/panel/PegatinaLogro";
import "./logros-publico.css";

export const metadata: Metadata = {
  title: "Logros",
  description: "Desbloquea logros completando las guías de la academia y manteniendo tu racha.",
};

/**
 * Los logros, para quien aún no tiene cuenta (con sesión, se va a
 * /dashboard/logros).
 *
 * OJO: hoy esta página no la ve nadie. `/logros` está en `protectedRoutes` de
 * src/proxy.ts, así que sin sesión el proxy manda a /login antes de llegar
 * aquí, y con sesión este componente redirige al panel. Si se quiere abrir al
 * público, hay que sacarla de esa lista (y de los Disallow de robots). Estilo «Cuaderno de estudio» (17-11-2026): una hoja con
 * la colección de pegatinas que se pueden ganar —las de racha y las de cada
 * guía, las mismas de `@/lib/logros`— y la invitación a registrarse.
 */
export default async function LogrosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Con sesión, a sus logros de verdad.
  if (user) redirect("/dashboard/logros");

  const coleccion = [...BADGE_DEFS, ...GUIDE_BADGE_DEFS];

  return (
    <div className="lgp">
      <SiteNav user={false} />

      <main className="lgp-main">
        <header className="lgp-cab">
          <p className="lgp-nota">tu colección de pegatinas</p>
          <h1 className="lgp-titulo">
            Sistema de <Anotacion tipo="highlight" color="var(--amarillo)" retraso={300}>Logros</Anotacion>
          </h1>
          <p className="lgp-sub">
            Completa guías, mantén rachas y desbloquea recompensas únicas.
            Regístrate gratis para empezar a acumular tu progreso.
          </p>
          <div className="lgp-acciones">
            <Tecla href="/register" tamano="grande">
              Registrarte gratis <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
            </Tecla>
            <Tecla href="/login" color="blanca" tamano="grande">Ya tengo cuenta</Tecla>
          </div>
        </header>

        <section className="lgp-hoja" aria-labelledby="lgp-coleccion">
          <span className="lgp-postit" aria-hidden="true">¡por estrenar!</span>
          <h2 id="lgp-coleccion" className="lgp-h2">Las pegatinas que puedes ganar</h2>
          <p className="lgp-hoja-sub">
            Una por cada guía que completes con el quiz perfecto, y otras por entrar varios días seguidos.
          </p>
          <ul className="lgp-rejilla">
            {coleccion.map((badge, i) => (
              <li key={badge.id} className="lgp-logro pgl-anfitrion">
                <PegatinaLogro icono={badge.icon} color={colorDeLogro(badge)} conseguida indice={i} especial={badge.special} />
                <span className="lgp-logro-nombre">{badge.label}</span>
                <span className="lgp-logro-cond">{badge.condition}</span>
              </li>
            ))}
          </ul>
          <div className="lgp-pie">
            <p className="lgp-pie-texto">Regístrate para desbloquear tus logros</p>
            <Tecla href="/register" color="amarillo">Crear cuenta gratis</Tecla>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
