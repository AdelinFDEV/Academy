"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, UserRound, ChevronDown, LogOut, Crown, ArrowRight } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import AvatarUsuario from "@/components/AvatarUsuario";
import Tecla from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

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
  const caja = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  // Cerrar al pulsar fuera o con Escape. Sin esto el menú se queda abierto
  // mientras navegas y tapa la esquina de la página. Con Escape, el foco
  // vuelve a la tarjeta, que es de donde salió. Con `pointerdown` y no
  // `mousedown`: Safari en el iPhone no lanza eventos de ratón al tocar una
  // zona que no es un enlace, y el menú no se cerraba al tocar fuera.
  useEffect(() => {
    if (!abierto) return;
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
      document.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

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

      {abierto && (
        <div className={`nav-saludo-menu${premium ? " is-premium" : ""}`} role="menu">
          {/* Quién eres, con el nombre entero y el plan. */}
          <div className="nav-saludo-cabecera">
            <span className="nav-saludo-avatar nav-saludo-avatar--grande" aria-hidden="true">
              <AvatarUsuario avatar={avatar} inicial={inicial} className="nav-saludo-foto" />
              {premium && <span className="nav-saludo-corona"><Crown size={10} strokeWidth={2.6} /></span>}
            </span>
            <span className="nav-saludo-cabecera-texto">
              <span className="nav-saludo-cabecera-nombre">{nombre}</span>
              <span className={`nav-saludo-chip${premium ? " is-premium" : ""}`}>
                {premium && <Crown size={11} strokeWidth={2.4} aria-hidden="true" />}
                {PLAN_TEXTO[plan]}
              </span>
            </span>
          </div>

          <Link
            href="/dashboard"
            className="nav-saludo-item"
            role="menuitem"
            onClick={() => setAbierto(false)}
          >
            <LayoutDashboard size={15} strokeWidth={2.1} aria-hidden="true" />
            Mi dashboard
          </Link>
          <Link
            href="/dashboard/perfil"
            className="nav-saludo-item"
            role="menuitem"
            onClick={() => setAbierto(false)}
          >
            <UserRound size={15} strokeWidth={2.1} aria-hidden="true" />
            Mi perfil
          </Link>

          {!premium && (
            <Link
              href="/premium"
              className="nav-saludo-premium"
              role="menuitem"
              onClick={() => setAbierto(false)}
            >
              <Crown size={15} strokeWidth={2.2} aria-hidden="true" />
              Hazte Premium
              <ArrowRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          )}

          {/* Cerrar sesión reutiliza LogoutButton, que es quien sabe limpiar
              la sesión de verdad. Solo cambia el traje. */}
          <LogoutButton className="nav-saludo-salir" onDone={() => setAbierto(false)}>
            <LogOut size={15} strokeWidth={2.1} aria-hidden="true" />
            Cerrar sesión
          </LogoutButton>
        </div>
      )}
    </div>
  );
}
