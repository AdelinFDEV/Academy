"use client";

import { useState } from "react";
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
 * Poco invasivo a propósito: aparece a los pocos segundos, minimizado, y solo
 * se despliega si alguien lo pulsa. Nunca desaparece: cerrar el panel lo
 * vuelve a minimizar en el botón. El enlace es el de mensajes directos
 * (`ig.me`), que en el móvil abre la app de Instagram.
 */
export default function DudasInstagram() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  if (SIN_DUDAS.some((r) => pathname.startsWith(r))) return null;

  return (
    <div className={`dudas${abierto ? " is-abierto" : ""}`}>
      {abierto && (
        <div className="dudas-tarjeta" role="dialog" aria-label="Dudas frecuentes y contacto">
          <div className="dudas-cabecera">
            <div>
              <p className="dudas-titulo">¿En qué te ayudo?</p>
              <p className="dudas-texto">Lo que más me preguntan. Si no está, escríbeme.</p>
            </div>
            <button type="button" className="dudas-cerrar" onClick={() => setAbierto(false)} aria-label="Minimizar">
              <Minus size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="dudas-faq">
            {PREGUNTAS.map((p) => (
              <details key={p.q} className="dudas-pregunta">
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
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        aria-label={abierto ? "Minimizar dudas" : "¿Dudas? Pregúntame"}
      >
        {/* El avatar: degradado de Instagram con un anillo que gira, una
            burbuja con los tres puntos de «escribiendo…» y el punto verde de
            disponible. Todo CSS: sin gif ni librerías que cargar. */}
        <span className="dudas-avatar" aria-hidden="true">
          <span className="dudas-anillo" />
          <span className="dudas-circulo">
            {abierto ? (
              <X size={17} strokeWidth={2.4} />
            ) : (
              <span className="dudas-escribiendo"><i /><i /><i /></span>
            )}
          </span>
          {!abierto && <span className="dudas-online" />}
        </span>
        {!abierto && (
          <span className="dudas-boton-texto">
            <strong>¿Dudas?</strong>
            <span>Pregúntame</span>
          </span>
        )}
      </button>
    </div>
  );
}
