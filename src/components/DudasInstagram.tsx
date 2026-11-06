"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Minus, X } from "lucide-react";
import { InstagramIcon } from "@/components/SocialLinks";
import { INSTAGRAM_DM_URL } from "@/lib/contacto";

/** Donde no pinta nada: el panel, el aula y las pantallas de acceso. */
const SIN_DUDAS = ["/admin", "/aula", "/auth", "/login", "/register", "/forgot-password", "/mfa-challenge"];

/**
 * Las preguntas que más se repiten, con la respuesta corta. Cada respuesta dice
 * lo mismo que la web en su sitio —la de cancelar y la del asesoramiento, lo
 * que dicen las FAQ de /premium—: si cambia allí, hay que cambiarla aquí.
 */
const PREGUNTAS = [
  {
    q: "¿Las guías son gratis?",
    a: "Sí. Se leen enteras sin registrarte. Solo el quiz final pide una cuenta gratuita, porque guarda tu resultado y te da su logro.",
  },
  {
    q: "¿Qué incluye Premium?",
    a: "El Diario de Trading, mi Portfolio con mis compras reales y los cursos cuando se publiquen. Todo lo nuevo entra sin pagar más.",
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí. Cancelas en 1 clic desde tu cuenta, sin permanencia. Mantienes el acceso hasta el final del periodo que ya has pagado.",
  },
  {
    q: "¿Esto es asesoramiento financiero?",
    a: "No. Es formación y herramientas para que tomes tus propias decisiones con criterio. Nadie puede garantizarte rentabilidad.",
  },
];

/**
 * Un botón abajo a la derecha para resolver dudas: primero las preguntas
 * frecuentes y, si no está la suya, Instagram para hablar conmigo de tú a tú.
 *
 * Rediseñado el 04-11-2026 con la paleta de la web (fondo oscuro, naranja y
 * oro) en vez del degradado de Instagram, que no entonaba con nada. Instagram
 * solo aparece donde importa: en su icono y en el botón para escribir.
 *
 * Poco invasivo a propósito: aparece a los pocos segundos, minimizado, y solo
 * se despliega si alguien lo pulsa. Nunca desaparece: cerrar el panel lo
 * vuelve a minimizar en el botón. El enlace es el de mensajes directos
 * (`ig.me`), que en el móvil abre la app de Instagram.
 */
/** Lo que dura la animación de cierre (ver `dudas-cerrar` en globals.css). */
const CIERRE_MS = 320;

type Fase = "cerrado" | "abierto" | "cerrando";

export default function DudasInstagram() {
  const pathname = usePathname();
  // Tres fases y no un booleano: al cerrar, el panel sigue montado mientras
  // dura su animación de salida, y solo entonces se desmonta. Con un booleano
  // desaparecía de golpe.
  const [fase, setFase] = useState<Fase>("cerrado");
  const caja = useRef<HTMLDivElement>(null);
  const abierto = fase === "abierto";
  const visible = fase !== "cerrado";

  const cerrar = useCallback(() => {
    setFase((f) => (f === "abierto" ? "cerrando" : f));
  }, []);

  // Al terminar la animación de salida, fuera. Con movimiento reducido no hay
  // animación: el CSS la quita y aquí se desmonta enseguida.
  useEffect(() => {
    if (fase !== "cerrando") return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => setFase("cerrado"), reducido ? 0 : CIERRE_MS);
    return () => window.clearTimeout(t);
  }, [fase]);

  // Abierto: se cierra con Escape o pulsando fuera del panel y del botón.
  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") cerrar(); };
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) cerrar();
    };
    window.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fuera);
    return () => {
      window.removeEventListener("keydown", tecla);
      document.removeEventListener("pointerdown", fuera);
    };
  }, [abierto, cerrar]);

  if (SIN_DUDAS.some((r) => pathname.startsWith(r))) return null;

  return (
    <>
    {/* En el móvil, un velo detrás del panel: oscurece la página y tocarlo
        cierra. En escritorio no se ve (globals.css). */}
    {visible && (
      <div
        className={`dudas-velo${fase === "cerrando" ? " is-cerrando" : ""}`}
        onClick={cerrar}
        aria-hidden="true"
      />
    )}
    <div className={`dudas${abierto ? " is-abierto" : ""}`} ref={caja}>
      {visible && (
        <div
          className={`dudas-tarjeta${fase === "cerrando" ? " is-cerrando" : ""}`}
          role="dialog"
          aria-label="Dudas frecuentes y contacto"
        >
          <div className="dudas-cabecera">
            <span className="dudas-cabecera-avatar" aria-hidden="true">
              A
              <span className="dudas-online" />
            </span>
            <div className="dudas-cabecera-texto">
              <p className="dudas-titulo">¿En qué te ayudo?</p>
              <p className="dudas-texto">Lo que más me preguntan. Si no está, escríbeme.</p>
            </div>
            <button type="button" className="dudas-cerrar" onClick={cerrar} aria-label="Minimizar">
              <Minus size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="dudas-faq">
            {PREGUNTAS.map((p, i) => (
              <details key={p.q} className="dudas-pregunta" style={{ "--i": i } as React.CSSProperties}>
                <summary>
                  {p.q}
                  <ChevronDown size={15} aria-hidden="true" />
                </summary>
                <p>{p.a}</p>
              </details>
            ))}
          </div>

          <div className="dudas-pie">
            <p className="dudas-pie-texto">¿Otra duda? Te contesto yo, de tú a tú.</p>
            <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" className="dudas-enlace">
              <InstagramIcon /> Escribirme por Instagram
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        className="dudas-boton"
        onClick={() => (abierto ? cerrar() : setFase("abierto"))}
        aria-expanded={abierto}
        aria-label={abierto ? "Minimizar dudas" : "¿Dudas? Pregúntame"}
      >
        {/* El avatar: una baldosa naranja con un anillo dorado que gira
            despacio, la burbuja de «escribiendo…» y el punto verde de
            disponible. Todo CSS: sin gif ni librerías que cargar. */}
        <span className="dudas-avatar" aria-hidden="true">
          <span className="dudas-anillo" />
          {/* Los dos iconos están siempre: el CSS cruza uno con otro, con
              un giro, en vez de cambiarlos de golpe. */}
          <span className="dudas-circulo">
            <span className="dudas-escribiendo"><i /><i /><i /></span>
            <span className="dudas-x"><X size={17} strokeWidth={2.4} /></span>
          </span>
          <span className="dudas-online" />
        </span>
        <span className="dudas-boton-texto">
          <strong>¿Dudas?</strong>
          <span>Pregúntame</span>
        </span>
      </button>
    </div>
    </>
  );
}
