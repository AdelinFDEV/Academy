"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useMotionValue } from "framer-motion";
import NovaHead from "./NovaHead";
import { BOT_NAME, NOVA_FIRMA } from "./tjNova";
import { NovaVuelo, cajaDe, salirDelDiario, sinAnimaciones, tomarSalida, type CajaNova } from "./novaVuelo";

/** La ruta del Diario de Trading: dentro de ella Nova está en su habitación, no aquí. */
const DIARIO = "/dashboard/trading";

/*
 * ¿Tiene Nova novedades? Sí si su último análisis (se rehace con cada dato que
 * apuntas) aún no se ha abierto: la huella que guarda el Diario no es la última
 * que el usuario vio en el bocadillo («tj-bot-visto»). Quien nunca ha abierto el
 * Diario también las tiene: Nova le espera. En el servidor, no: así el punto no
 * parpadea al hidratar.
 */
function suscribirNovedades(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("tj-bot-visto", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("tj-bot-visto", cb);
  };
}

function hayNovedades(): boolean {
  try {
    const firma = localStorage.getItem(NOVA_FIRMA);
    return !firma || firma !== localStorage.getItem("tj-bot-visto");
  } catch {
    return false;
  }
}

/** Una vez por análisis y pestaña, el bocadillo de novedades sale solo unos segundos. */
const AVISADO = "nova-nav-avisado";

/**
 * Nova en la barra de arriba: su muelle al final de la cápsula, sobrio: sin
 * luces alrededor (se quitaron el 07-11-2026). En toda la web menos en el Diario, y
 * solo para quien lo tiene (lo decide NavPrincipal).
 *
 * Mira al cursor; al pasarle el ratón salta de alegría y saca un bocadillo.
 * Si su último análisis está sin leer, enseña el punto rojo y, la primera vez,
 * avisa sola con «¡Tengo novedades!». Pulsarla lleva al Diario, como el enlace
 * de al lado (por eso no entra en el orden del teclado: el enlace ya lo está).
 *
 * Al salir del Diario llega volando desde donde estaba (ver novaVuelo.tsx).
 *
 * BLOQUEADA (08-11-2026, pedido por el admin): quien no tiene el Diario
 * —sin cuenta o sin Premium— también ve a Nova en la barra, pero no puede
 * usarla: lleva un candado, no avisa de novedades (no tiene análisis) y al
 * pasarle el ratón dice «Nos vemos en tu Diario de Trading». Pulsarla lleva a
 * donde lleva el enlace de al lado para quien no tiene acceso: la ficha
 * pública del Diario, que explica qué es y cómo conseguirlo.
 */
export default function NovaNav({ href, bloqueada = false }: { href: string; bloqueada?: boolean }) {
  const pathname = usePathname();
  const enDiario = pathname === DIARIO || pathname.startsWith(DIARIO + "/");
  const theta = useMotionValue(0);
  const [hover, setHover] = useState(false);
  const [aviso, setAviso] = useState(false);
  const [vuelo, setVuelo] = useState<{ desde: CajaNova; hasta: CajaNova } | null>(null);
  const conNovedades = useSyncExternalStore(suscribirNovedades, hayNovedades, () => false);
  // Bloqueada no hay análisis que leer: ni punto rojo ni aviso.
  const novedades = !bloqueada && conNovedades;
  const ref = useRef<HTMLAnchorElement>(null);

  // Fuera del Diario: si Nova acaba de salir de él, vuela hasta aquí.
  useEffect(() => {
    if (enDiario || bloqueada) return;
    salirDelDiario();
    const desde = tomarSalida();
    const hasta = cajaDe(ref.current?.querySelector(".nh"));
    if (desde && hasta && !sinAnimaciones()) setVuelo({ desde, hasta });
  }, [enDiario, bloqueada]);

  // Con novedades, avisa sola una vez por análisis: aparece el bocadillo y se va.
  useEffect(() => {
    if (enDiario || !novedades) return;
    let clave = "nuevo";
    try {
      clave = localStorage.getItem(NOVA_FIRMA) ?? "nuevo";
    } catch {
      // Sin almacenamiento: avisa igual.
    }
    try {
      if (sessionStorage.getItem(AVISADO) === clave) return;
      sessionStorage.setItem(AVISADO, clave);
    } catch {
      // Sin almacenamiento: avisa igual, sin más.
    }
    const abre = window.setTimeout(() => setAviso(true), 1600);
    const cierra = window.setTimeout(() => setAviso(false), 7600);
    return () => {
      window.clearTimeout(abre);
      window.clearTimeout(cierra);
    };
  }, [enDiario, novedades]);

  const bocadillo = !enDiario && !vuelo && (hover || aviso);

  return (
    <span
      className={`nova-dock${enDiario ? " is-fuera" : ""}${hover ? " is-encima" : ""}${novedades ? " con-novedades" : ""}${bloqueada ? " is-bloqueada" : ""}`}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <span className="nova-dock-sep" aria-hidden="true" />
      <Link
        ref={ref}
        href={href}
        className={`nova-nav${vuelo ? " is-llegando" : ""}`}
        data-nova-nav=""
        tabIndex={-1}
        aria-hidden="true"
        title={bloqueada ? `${BOT_NAME}, la asistente del Diario de Trading (Premium)` : `${BOT_NAME}, tu asistente del Diario de Trading`}
      >
        <span className="nova-nav-halo" />
        {!enDiario && (
          <NovaHead
            theta={theta}
            face={hover ? "joy" : novedades ? "happy" : "calm"}
            activity="none"
            flying={false}
            joy={hover}
            talking={aviso && !hover}
            track={!vuelo}
          />
        )}
        {novedades && !enDiario && <span className="nova-nav-ping" />}
        {bloqueada && !enDiario && (
          <span className="nova-nav-candado">
            <svg viewBox="0 0 24 24" width="9" height="9" fill="none">
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              <rect x="5" y="11" width="14" height="10" rx="2.6" fill="currentColor" />
            </svg>
          </span>
        )}
      </Link>

      <AnimatePresence>
        {bocadillo && (
          <motion.span
            key="bocadillo"
            className="nova-nav-bocadillo"
            aria-hidden="true"
            initial={{ opacity: 0, y: -6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 460, damping: 26 } }}
            exit={{ opacity: 0, y: -4, scale: 0.92, transition: { duration: 0.15 } }}
          >
            {bloqueada ? (
              <>
                <b>¡Hola! Soy {BOT_NAME} 👋</b>
                <span>Nos vemos en tu Diario de Trading</span>
                <span className="nova-nav-bocadillo-premium">Incluida en Premium</span>
              </>
            ) : novedades ? (
              <>
                <b>¡Tengo novedades! 👀</b>
                <span>Tengo un análisis nuevo de tu diario</span>
              </>
            ) : (
              <>
                <b>¡Hola! Soy {BOT_NAME} 👋</b>
                <span>Te espero en tu Diario</span>
              </>
            )}
          </motion.span>
        )}
      </AnimatePresence>

      {vuelo && <NovaVuelo desde={vuelo.desde} hasta={vuelo.hasta} onFin={() => setVuelo(null)} />}
    </span>
  );
}
