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
 */
export default function NovaNav({ href }: { href: string }) {
  const pathname = usePathname();
  const enDiario = pathname === DIARIO || pathname.startsWith(DIARIO + "/");
  const theta = useMotionValue(0);
  const [hover, setHover] = useState(false);
  const [aviso, setAviso] = useState(false);
  const [vuelo, setVuelo] = useState<{ desde: CajaNova; hasta: CajaNova } | null>(null);
  const novedades = useSyncExternalStore(suscribirNovedades, hayNovedades, () => false);
  const ref = useRef<HTMLAnchorElement>(null);

  // Fuera del Diario: si Nova acaba de salir de él, vuela hasta aquí.
  useEffect(() => {
    if (enDiario) return;
    salirDelDiario();
    const desde = tomarSalida();
    const hasta = cajaDe(ref.current?.querySelector(".nh"));
    if (desde && hasta && !sinAnimaciones()) setVuelo({ desde, hasta });
  }, [enDiario]);

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
      className={`nova-dock${enDiario ? " is-fuera" : ""}${hover ? " is-encima" : ""}${novedades ? " con-novedades" : ""}`}
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
        title={`${BOT_NAME}, tu asistente del Diario de Trading`}
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
            {novedades ? (
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
