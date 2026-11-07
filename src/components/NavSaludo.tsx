"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, UserRound, ChevronDown, LogOut, Crown, ArrowRight } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";
import AvatarUsuario from "@/components/AvatarUsuario";

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
 * saber de un vistazo: su plan. Premium y Admin van en dorado, con la corona
 * en la moneda.
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

  // Cerrar al pulsar fuera o con Escape. Sin esto el menú se queda abierto
  // mientras navegas y tapa la esquina de la página.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  // Solo el nombre de pila en la barra: «Jorge Adelin Gombos» no cabe. En el
  // menú, el nombre entero.
  const pila = nombre.trim().split(/\s+/)[0] ?? nombre;
  const inicial = pila.charAt(0).toUpperCase();
  const dorado = plan !== "free";

  return (
    <div className="nav-saludo-wrap" ref={caja}>
      <button
        type="button"
        className={`nav-saludo${abierto ? " is-abierto" : ""}${dorado ? " is-dorado" : ""}`}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Menú de ${nombre}`}
        title={`Has iniciado sesión como ${nombre}`}
      >
        <span className="nav-saludo-avatar" aria-hidden="true">
          <AvatarUsuario avatar={avatar} inicial={inicial} className="nav-saludo-foto" />
          {dorado && <span className="nav-saludo-corona"><Crown size={9} strokeWidth={2.6} /></span>}
        </span>
        <span className="nav-saludo-texto">
          <span className="nav-saludo-nombre">{pila}</span>
          <span className="nav-saludo-plan">{PLAN_TEXTO[plan]}</span>
        </span>
        <ChevronDown className="nav-saludo-flecha" size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>

      {abierto && (
        <div className={`nav-saludo-menu${dorado ? " is-dorado" : ""}`} role="menu">
          {/* Quién eres, con el nombre entero y el plan. */}
          <div className="nav-saludo-cabecera">
            <span className="nav-saludo-avatar nav-saludo-avatar--grande" aria-hidden="true">
              <AvatarUsuario avatar={avatar} inicial={inicial} className="nav-saludo-foto" />
              {dorado && <span className="nav-saludo-corona"><Crown size={10} strokeWidth={2.6} /></span>}
            </span>
            <span className="nav-saludo-cabecera-texto">
              <span className="nav-saludo-cabecera-nombre">{nombre}</span>
              <span className={`nav-saludo-chip${dorado ? " is-dorado" : ""}`}>
                {dorado && <Crown size={11} strokeWidth={2.4} aria-hidden="true" />}
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

          {!dorado && (
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
