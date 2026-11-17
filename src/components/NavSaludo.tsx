"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
            <span className="nav-saludo-avatar nav-saludo-avatar--grande" aria-hidden="true">
              <AvatarUsuario avatar={avatar} inicial={inicial} className="nav-saludo-foto" />
              {premium && <span className="nav-saludo-corona"><Crown size={11} strokeWidth={2.6} /></span>}
            </span>
            <span className="nav-saludo-cabecera-texto">
              <span className="nav-saludo-hola" aria-hidden="true">¡hola de nuevo!</span>
              <span className="nav-saludo-cabecera-nombre">{nombre}</span>
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
              Mi dashboard
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
              Mi perfil
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
