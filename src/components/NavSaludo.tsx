"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { LayoutDashboard, UserRound, ChevronDown, LogOut, Crown, ArrowRight } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import AvatarUsuario from "@/components/AvatarUsuario";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";
import { bloquearScroll } from "@/lib/bloquearScroll";

export type PlanUsuario = "admin" | "premium" | "free";

const PLAN_TEXTO: Record<PlanUsuario, string> = {
  admin: "Admin",
  premium: "Premium",
  free: "Plan gratuito",
};

/**
 * La tarjeta de quien ha iniciado sesión, en la barra, y su menú.
 *
 * Rehecha el 04-11-2026. Hasta entonces llevaba encima del nombre un saludo
 * elegido al azar según la hora («Modo gráfico», «Vela verde»…): no decía
 * nada útil y a veces se leía raro. Ahora dice algo que el usuario quiere
 * saber de un vistazo: su plan. Premium y Admin llevan la corona en la moneda.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026): la tarjeta es una tecla blanca y
 * el desplegable, una hoja de papel. Premium va en naranja, el color de la
 * marca y de Premium (ESTILO.md): ya no hay dorados.
 *
 * El desplegable (rehecho el 17-11-2026, pedido por el admin) es una ficha
 * de alumno que se despliega desde la tarjeta: cabecera naranja suave con un
 * saludo a mano, filas con su icono de color (como el menú grande) y un pico
 * que apunta a la tarjeta. Al abrirse baja como una hoja; al cerrarse se
 * pliega hacia arriba, por eso sigue montado un instante (`montado`).
 *
 * Pulsarla abre su panel, su cuenta y, a quien no es Premium, el paso a
 * Premium. El plan lo resuelve la barra (`SiteNav`) desde el perfil, así que
 * es el mismo en todas las páginas.
 */
export default function NavSaludo({
  nombre,
  plan,
  avatar = null,
}: {
  nombre: string;
  plan: PlanUsuario;
  /** La foto de perfil elegida (`profiles.avatar`); sin ella, la inicial. */
  avatar?: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  // Sigue en pantalla mientras se pliega, después de cerrarlo.
  const [montado, setMontado] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Cerrar al pulsar fuera o con Escape. Sin esto el menú se queda abierto
  // mientras navegas y tapa la esquina de la página. Con Escape, el foco
  // vuelve a la tarjeta, que es de donde salió. Con `pointerdown` y no
  // `mousedown`: Safari en el iPhone no lanza eventos de ratón al tocar una
  // zona que no es un enlace, y el menú no se cerraba al tocar fuera.
  useEffect(() => {
    if (!abierto) return;
    // Con el desplegable abierto, la página no se desplaza (18-11-2026; el
    // bloqueo común, src/lib/bloquearScroll.ts).
    const soltar = bloquearScroll();
    const fuera = (e: PointerEvent) => {
      if (caja.current?.contains(e.target as Node)) return;
      sonar("cerrar");
      setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      sonar("cerrar");
      setAbierto(false);
      boton.current?.focus();
    };
    document.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", tecla);
    return () => {
      soltar();
      document.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  // Al cerrar se deja que se pliegue (site-nav.css, `nav-saludo-plegar`,
  // 0,22 s) y después se quita. Con «reducir movimiento», al momento.
  useEffect(() => {
    if (abierto || !montado) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const espera = window.setTimeout(() => setMontado(false), quieto ? 0 : 220);
    return () => window.clearTimeout(espera);
  }, [abierto, montado]);

  // Solo el nombre de pila en la barra: «Jorge Adelin Gombos» no cabe. En el
  // menú, el nombre entero.
  const pila = nombre.trim().split(/\s+/)[0] ?? nombre;
  const inicial = pila.charAt(0).toUpperCase();
  const premium = plan !== "free";

  return (
    <div className="nav-saludo-wrap" ref={caja}>
      <Tecla
        color="blanca"
        tamano="peq"
        className={`nav-saludo${abierto ? " is-abierto" : ""}${premium ? " is-premium" : ""}`}
        ref={boton}
        onClick={() => {
          sonar(abierto ? "cerrar" : "abrir");
          if (!abierto) setMontado(true);
          setAbierto(!abierto);
        }}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Menú de ${nombre}`}
        title={`Has iniciado sesión como ${nombre}`}
      >
        <span className="nav-saludo-avatar" aria-hidden="true">
          <AvatarUsuario avatar={avatar} inicial={inicial} className="nav-saludo-foto" />
          {premium && <span className="nav-saludo-corona"><Crown size={9} strokeWidth={2.6} /></span>}
        </span>
        <span className="nav-saludo-texto">
          <span className="nav-saludo-nombre">{pila}</span>
          <span className="nav-saludo-plan">{PLAN_TEXTO[plan]}</span>
        </span>
        <ChevronDown className="nav-saludo-flecha" size={14} strokeWidth={2.6} aria-hidden="true" />
      </Tecla>

      {(abierto || montado) && (
        <div
          className={`nav-saludo-menu${premium ? " is-premium" : ""}${abierto ? "" : " is-cerrando"}`}
          role="menu"
          aria-hidden={abierto ? undefined : true}
        >
          {/* Quién eres: un saludo a mano, la foto, el nombre entero y el plan. */}
          <div className="nav-saludo-cabecera">
            {/* En el móvil, dos garabatos de margen en las esquinas de abajo
                (site-nav.css): una moneda de bitcoin y una gráfica que sube. */}
            <svg className="nav-saludo-garabato nav-saludo-garabato--moneda" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
              <path d="M20 3.5c9.3-.2 16.4 7.2 16.5 16.3.1 9.4-7.3 16.7-16.6 16.7C10.6 36.6 3.4 29.3 3.5 20 3.6 10.9 10.8 3.7 20 3.5z" />
              <path d="M15.5 12.5v15M15.5 12.8h6.2c2.6 0 4.3 1.5 4.3 3.6s-1.7 3.5-4.3 3.6h-6.2M15.5 20h7c2.8 0 4.6 1.5 4.6 3.7 0 2.3-1.8 3.8-4.6 3.8h-7M18.5 9.5v3M22 9.5v3M18.5 27.5v3M22 27.5v3" />
            </svg>
            <svg className="nav-saludo-garabato nav-saludo-garabato--grafica" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
              <path d="M5 5.5c-.3 9.8-.2 19.6.2 29.5 9.9.3 19.8.3 29.8-.1" />
              <path d="M9.5 28.5l7-8.5 6 4.5 9.8-13" />
              <path d="M26.5 10.8l5.9-.4.3 5.9" />
            </svg>

            <span className="nav-saludo-avatar nav-saludo-avatar--grande" aria-hidden="true">
              <AvatarUsuario avatar={avatar} inicial={inicial} className="nav-saludo-foto" />
              {premium && <span className="nav-saludo-corona"><Crown size={11} strokeWidth={2.6} /></span>}
              {/* La foto, pegada con dos trocitos de cinta (solo en el móvil). */}
              <span className="nav-saludo-cinta nav-saludo-cinta--izq" />
              <span className="nav-saludo-cinta nav-saludo-cinta--der" />
            </span>
            <span className="nav-saludo-cabecera-texto">
              <span className="nav-saludo-hola" aria-hidden="true">¡hola de nuevo!</span>
              <span className="nav-saludo-nombre-caja">
                <span className="nav-saludo-cabecera-nombre">{nombre}</span>
                {/* El subrayado a mano que se dibuja al abrir (solo en el móvil). */}
                <svg className="nav-saludo-subrayado" viewBox="0 0 120 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <path pathLength={1} d="M2 6.5c14-3.2 26 2.6 40-.6s26-3.4 38-.4 26 1.6 38-1.8" />
                </svg>
              </span>
              <span className={`nav-saludo-chip${premium ? " is-premium" : ""}`}>
                {premium && <Crown size={11} strokeWidth={2.4} aria-hidden="true" />}
                {PLAN_TEXTO[plan]}
              </span>
            </span>
          </div>

          <div className="nav-saludo-lista">
            <Link
              href="/dashboard"
              className="nav-saludo-item nav-saludo-item--cielo"
              role="menuitem"
              style={{ "--i": 0 } as CSSProperties}
              onClick={() => setAbierto(false)}
            >
              <span className="nav-saludo-icono" aria-hidden="true"><LayoutDashboard size={16} strokeWidth={2.2} /></span>
              <span className="nav-saludo-largo">Mi dashboard</span>
              <span className="nav-saludo-corto">Dashboard</span>
              <ArrowRight className="nav-saludo-ir" size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/perfil"
              className="nav-saludo-item nav-saludo-item--menta"
              role="menuitem"
              style={{ "--i": 1 } as CSSProperties}
              onClick={() => setAbierto(false)}
            >
              <span className="nav-saludo-icono" aria-hidden="true"><UserRound size={16} strokeWidth={2.2} /></span>
              <span className="nav-saludo-largo">Mi perfil</span>
              <span className="nav-saludo-corto">Perfil</span>
              <ArrowRight className="nav-saludo-ir" size={15} strokeWidth={2.4} aria-hidden="true" />
            </Link>

            {!premium && (
              <Link
                href="/premium"
                className="nav-saludo-premium"
                role="menuitem"
                style={{ "--i": 2 } as CSSProperties}
                onClick={() => setAbierto(false)}
              >
                <Crown size={15} strokeWidth={2.2} aria-hidden="true" />
                Hazte Premium
                <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            )}

            {/* Cerrar sesión reutiliza LogoutButton, que es quien sabe limpiar
                la sesión de verdad. Solo cambia el traje. */}
            <span className="nav-saludo-salir-caja" style={{ "--i": premium ? 2 : 3 } as CSSProperties}>
              <LogoutButton className="nav-saludo-salir" onDone={() => setAbierto(false)}>
                <span className="nav-saludo-icono" aria-hidden="true"><LogOut size={16} strokeWidth={2.2} /></span>
                Cerrar sesión
              </LogoutButton>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
