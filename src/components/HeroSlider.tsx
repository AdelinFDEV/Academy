"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { ArrowRight, Award, Check, ChevronLeft, ChevronRight, Crown, Lock } from "lucide-react";
import { herramienta, detalleDe, type Herramienta } from "@/lib/herramientas";

/** Cifras reales de la cartera, calculadas en el servidor. `null` si fallan. */
export type ResumenHero = {
  posiciones: number;
  rentabilidadPct: number;
  desdeAnio: number | null;
} | null;

interface Props {
  isPremium: boolean;
  portfolio: ResumenHero;
}

/**
 * Las tres piezas de la academia, en este orden. Desde el 31-10-2026 la web
 * vive de estas tres y de nada más, y el hero las enseña de una en una, a todo
 * el ancho, en un slider que avanza solo.
 *
 * El copy sale del catálogo (`@/lib/herramientas`, fuente única). `corto` es
 * el nombre de la pestaña; Cursos lleva además título propio, porque en el
 * catálogo es «Cursos» a secas y aquí el certificado es el argumento.
 */
const DIAPOSITIVAS: { id: string; corto: string; titulo?: string }[] = [
  { id: "portfolio", corto: "Portfolio" },
  { id: "diario", corto: "Diario" },
  { id: "cursos", corto: "Cursos", titulo: "Cursos con certificado" },
];

/** Lo que dura cada diapositiva. Lo cuenta la barra de la pestaña activa. */
const DURACION_MS = 9000;

/** Lo que hay que arrastrar para cambiar de diapositiva, en píxeles. */
const UMBRAL_PX = 50;

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;

/**
 * La rentabilidad, contando desde cero cada vez que su diapositiva entra.
 * Escribe en el DOM y no en el estado: son sesenta pasos por segundo que no
 * tienen por qué re-renderizar la tarjeta.
 */
function Contador({ valor, activo }: { valor: number; activo: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !activo || reduceMotion) return;
    const inicio = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const k = Math.min(1, (t - inicio) / 1200);
      el.textContent = pct(valor * (1 - Math.pow(1 - k, 3)));
      if (k < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(id);
      el.textContent = pct(valor);
    };
  }, [activo, valor, reduceMotion]);

  return <span ref={ref}>{pct(valor)}</span>;
}

/* ── Las tres ventanas ──────────────────────────────────────────────────────
   Cada diapositiva enseña su herramienta por dentro, en una ventana de
   aplicación. Lo que no es real lo dice: el Portfolio enseña sus cifras de
   verdad; el Diario y los Cursos, un ejemplo marcado como tal, porque las
   estadísticas y el progreso de cada alumno son privados. */

function VentanaPortfolio({ datos, activo }: { datos: ResumenHero; activo: boolean }) {
  if (!datos) {
    return (
      <div className="hs-vacio">
        Cada compra publicada con su precio de entrada y su rentabilidad, al día.
      </div>
    );
  }
  const positiva = datos.rentabilidadPct >= 0;
  return (
    <>
      <div className="hs-kpi">
        <span className="hs-kpi-key">Rentabilidad de la cartera</span>
        <span className={`hs-kpi-num ${positiva ? "es-verde" : "es-rojo"}`}>
          <Contador valor={datos.rentabilidadPct} activo={activo} />
        </span>
      </div>
      <div className="hs-fichas">
        <span className="hs-ficha">
          <b>{datos.posiciones}</b>
          <span>posiciones abiertas</span>
        </span>
        {datos.desdeAnio && (
          <span className="hs-ficha">
            <b>{datos.desdeAnio}</b>
            <span>inicio del ciclo</span>
          </span>
        )}
      </div>
      {/* Una marca por posición, sin cifras: enseña el tamaño de la cartera
          sin decir nada que no esté en la página del portfolio. */}
      <div className="hs-posiciones" aria-hidden="true">
        {Array.from({ length: Math.min(datos.posiciones, 16) }, (_, i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </>
  );
}

const CURVA =
  "M0 92 C18 88 26 80 40 82 C56 84 60 90 74 86 C92 81 96 64 112 60 " +
  "C128 56 134 68 150 64 C168 60 172 42 190 38 C206 35 214 46 230 42 " +
  "C250 37 254 22 272 18 C288 15 296 24 312 20 C328 16 334 8 352 6";

const OPERACIONES = [
  { par: "BTC/USDT", lado: "Long", r: "+2,4 R", ok: true },
  { par: "ETH/USDT", lado: "Short", r: "−1,0 R", ok: false },
  { par: "SOL/USDT", lado: "Long", r: "+1,6 R", ok: true },
];

function VentanaDiario() {
  return (
    <>
      <div className="hs-grafico" aria-hidden="true">
        <svg viewBox="0 0 352 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="hsCurvaRelleno" x1="0" y1="0" x2="0" y2="1">
              {/* var() no vale en un atributo de presentación de SVG: el
                  color de la pieza entra por style y por la clase. */}
              <stop offset="0" style={{ stopColor: "var(--tool-color)", stopOpacity: 0.38 }} />
              <stop offset="1" style={{ stopColor: "var(--tool-color)", stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <path d={`${CURVA} L352 100 L0 100 Z`} fill="url(#hsCurvaRelleno)" />
          <path
            className="hs-curva"
            d={CURVA}
            pathLength={1}
            fill="none"
            strokeWidth="2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <div className="hs-fichas hs-fichas--tres">
        <span className="hs-ficha"><b className="es-verde">58 %</b><span>win rate</span></span>
        <span className="hs-ficha"><b>1,9</b><span>profit factor</span></span>
        <span className="hs-ficha"><b>47</b><span>operaciones</span></span>
      </div>
      <ul className="hs-operaciones">
        {OPERACIONES.map((o) => (
          <li key={o.par}>
            <span className="hs-op-par">{o.par}</span>
            <span className="hs-op-lado">{o.lado}</span>
            <span className={`hs-op-r ${o.ok ? "es-verde" : "es-rojo"}`}>{o.r}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

const MODULOS = [
  { nombre: "Módulo 1", estado: "hecho" },
  { nombre: "Módulo 2", estado: "hecho" },
  { nombre: "Módulo 3", estado: "ahora" },
  { nombre: "Examen final", estado: "cerrado" },
] as const;

function VentanaCursos() {
  return (
    <>
      <ul className="hs-modulos">
        {MODULOS.map((m) => (
          <li key={m.nombre} className={`hs-modulo is-${m.estado}`}>
            <span className="hs-modulo-marca" aria-hidden="true">
              {m.estado === "hecho" && <Check size={12} strokeWidth={3.2} />}
              {m.estado === "cerrado" && <Lock size={11} strokeWidth={2.6} />}
            </span>
            <span className="hs-modulo-nombre">{m.nombre}</span>
            {m.estado === "hecho" && <span className="hs-modulo-nota">Aprobado</span>}
            {m.estado === "ahora" && (
              <span className="hs-modulo-barra" aria-hidden="true"><i /></span>
            )}
          </li>
        ))}
      </ul>
      <div className="hs-certificado">
        <Award size={22} strokeWidth={1.9} aria-hidden="true" />
        <span>
          <b>Certificado verificable</b>
          <span>Al aprobar el examen final</span>
        </span>
      </div>
    </>
  );
}

/** Qué ventana lleva cada pieza, su ruta y si sus datos son de ejemplo. */
function ventana(id: string, portfolio: ResumenHero, activo: boolean) {
  if (id === "portfolio") {
    return { ruta: "/portfolio", ejemplo: false, cuerpo: <VentanaPortfolio datos={portfolio} activo={activo} /> };
  }
  if (id === "diario") {
    return { ruta: "/dashboard/trading", ejemplo: true, cuerpo: <VentanaDiario /> };
  }
  return { ruta: "/aula", ejemplo: true, cuerpo: <VentanaCursos /> };
}

/**
 * El botón de cada diapositiva. Quien ya es Premium entra a la herramienta;
 * el resto va a su ficha. «Hazte Premium» NO va aquí: se repetía en las tres
 * diapositivas y sale una sola vez, junto a las pestañas.
 * Lo que aún no existe no se enlaza: va a su ficha pública, que sí existe.
 */
function accion(f: Herramienta, isPremium: boolean) {
  if (f.acceso === "proximamente") return { href: detalleDe(f), texto: "Ver los cursos" };
  if (isPremium && f.premiumHref) return { href: f.premiumHref, texto: "Entrar" };
  return { href: detalleDe(f), texto: "Ver detalles" };
}

export default function HeroSlider({ isPremium, portfolio }: Props) {
  const reduceMotion = useReducedMotion();
  const [actual, setActual] = useState(0);
  const [encima, setEncima] = useState(false);
  const [foco, setFoco] = useState(false);
  // Arrastre en curso: dónde empezó y cuánto lleva. Mientras dura, la pista
  // sigue al dedo sin transición y el temporizador se para.
  const [arrastre, setArrastre] = useState<{ x: number; dx: number } | null>(null);
  // Si el gesto fue un arrastre, el clic que llega al soltar no debe abrir
  // el enlace sobre el que se soltó.
  const huboArrastre = useRef(false);

  const total = DIAPOSITIVAS.length;
  const ir = (n: number) => setActual((n + total) % total);
  // Sin movimiento no hay avance automático: el visitante pasa a mano.
  const automatico = !reduceMotion;
  const pausado = encima || foco || arrastre !== null;

  // En los extremos el arrastre cuesta más, como en cualquier carrusel nativo.
  const dx = arrastre?.dx ?? 0;
  const enBorde = (actual === 0 && dx > 0) || (actual === total - 1 && dx < 0);
  const resistido = enBorde ? dx * 0.35 : dx;

  const soltar = () => {
    if (!arrastre) return;
    if (Math.abs(arrastre.dx) > UMBRAL_PX) ir(actual + (arrastre.dx < 0 ? 1 : -1));
    setArrastre(null);
  };

  return (
    <section
      className={`hs${pausado ? " is-pausado" : ""}${automatico ? "" : " is-quieto"}`}
      aria-roledescription="carrusel"
      aria-label="Lo que hay dentro de la academia"
      style={{ "--hs-duracion": `${DURACION_MS}ms` } as React.CSSProperties}
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setEncima(true); }}
      onPointerLeave={() => setEncima(false)}
      // Solo pausa el foco de teclado: un toque en el móvil también enfoca la
      // pestaña o el botón, y dejaría el slider parado sin motivo.
      onFocus={(e) => { if (e.target.matches(":focus-visible")) setFoco(true); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFoco(false); }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") ir(actual + 1);
        if (e.key === "ArrowLeft") ir(actual - 1);
      }}
    >
      {/* Solo el dedo arrastra: en PC se pasa con las flechas, las pestañas
          o el teclado, y un arrastre con el ratón seleccionaría texto. */}
      <div
        className={`hs-ventana${arrastre ? " is-arrastrando" : ""}`}
        aria-live={automatico && !pausado ? "off" : "polite"}
        onPointerDown={(e) => {
          if (e.pointerType !== "touch") return;
          huboArrastre.current = false;
          setArrastre({ x: e.clientX, dx: 0 });
        }}
        onPointerMove={(e) => {
          if (!arrastre || e.pointerType !== "touch") return;
          const dx = e.clientX - arrastre.x;
          if (Math.abs(dx) > 8) huboArrastre.current = true;
          setArrastre({ ...arrastre, dx });
        }}
        onPointerUp={soltar}
        // El navegador cancela el gesto si decide que es un scroll vertical:
        // la diapositiva vuelve a su sitio.
        onPointerCancel={() => setArrastre(null)}
        onClickCapture={(e) => {
          if (huboArrastre.current) {
            e.preventDefault();
            e.stopPropagation();
            huboArrastre.current = false;
          }
        }}
      >
        <div
          className="hs-pista"
          style={{ transform: `translateX(calc(-${actual * 100}% + ${resistido}px))` }}
        >
          {DIAPOSITIVAS.map((d, i) => {
            const f = herramienta(d.id);
            const titulo = d.titulo ?? f.label;
            const activo = i === actual;
            const a = accion(f, isPremium);
            const v = ventana(f.id, portfolio, activo);
            const Icono = f.icon;

            return (
              <div
                key={f.id}
                className={`hs-diapo${activo ? " is-activa" : ""}`}
                role="group"
                aria-roledescription="diapositiva"
                aria-label={`${i + 1} de ${total}: ${titulo}`}
                inert={!activo}
                // --rel: dónde está esta diapositiva respecto a la activa (-1, 0, 1…).
                // Con ella el CSS desplaza texto y ventana a distinta velocidad.
                style={{ "--tool-color": f.color, "--rel": i - actual } as React.CSSProperties}
              >
                <div className="hs-marco">
                  <span className="hs-indice" aria-hidden="true">0{i + 1}</span>

                  <div className="hs-texto">
                    {/* Sin etiqueta «Premium»: desde el 31-10-2026 todo es de pago
                        menos las guías, así que no distingue nada. Solo se dice
                        lo que sí informa: que algo aún no está disponible. */}
                    <span className="hs-sello hs-entra" style={{ "--d": 0 } as React.CSSProperties}>
                      <span className="hs-sello-icono" aria-hidden="true"><Icono size={18} strokeWidth={2} /></span>
                      {f.acceso === "proximamente" && <span className="hs-sello-texto">{f.tag}</span>}
                    </span>

                    <h2 className="hs-titulo hs-entra" style={{ "--d": 1 } as React.CSSProperties}>{titulo}</h2>
                    <p className="hs-claim hs-entra" style={{ "--d": 2 } as React.CSSProperties}>{f.desc}</p>

                    <ul className="hs-puntos-fuertes hs-entra" style={{ "--d": 3 } as React.CSSProperties}>
                      {f.chips.map((c) => {
                        const ChipIcono = c.icon;
                        return (
                          <li key={c.label}>
                            <ChipIcono size={14} strokeWidth={2.2} aria-hidden="true" />
                            {c.label}
                          </li>
                        );
                      })}
                    </ul>

                    <Link href={a.href} className="hs-accion hs-entra" style={{ "--d": 4 } as React.CSSProperties}>
                      {a.texto}
                      <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                  </div>

                  <div className="hs-app hs-entra" style={{ "--d": 2 } as React.CSSProperties}>
                    <div className="hs-app-barra">
                      <span className="hs-app-luces" aria-hidden="true"><i /><i /><i /></span>
                      <span className="hs-app-ruta">adelinacademy.com{v.ruta}</span>
                      {v.ejemplo
                        ? <span className="hs-app-etiqueta">Ejemplo</span>
                        : <span className="hs-app-etiqueta is-vivo"><i aria-hidden="true" />En vivo</span>}
                    </div>
                    <div className="hs-app-cuerpo">{v.cuerpo}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hs-nav">
        <div className="hs-pasos">
          <button type="button" className="hs-flecha" onClick={() => ir(actual - 1)} aria-label="Anterior">
            <ChevronLeft size={17} strokeWidth={2.4} aria-hidden="true" />
          </button>

          <div className="hs-pestanas">
            {DIAPOSITIVAS.map((d, i) => {
              const f = herramienta(d.id);
              const activo = i === actual;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={`hs-pestana${activo ? " is-activa" : ""}`}
                  aria-current={activo ? "true" : undefined}
                  onClick={() => ir(i)}
                  style={{ "--tool-color": f.color } as React.CSSProperties}
                >
                  <span className="hs-pestana-num">0{i + 1}</span>
                  <span className="hs-pestana-nombre">{d.corto}</span>
                  <span className="hs-pestana-pista" aria-hidden="true">
                    {/* La barra de la pestaña activa ES el temporizador: al
                        terminar su animación pasa a la siguiente. Pausarla con
                        el ratón encima pausa el slider sin ningún setInterval. */}
                    <span
                      key={activo ? "on" : "off"}
                      className="hs-pestana-barra"
                      onAnimationEnd={activo && automatico ? () => ir(actual + 1) : undefined}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <button type="button" className="hs-flecha" onClick={() => ir(actual + 1)} aria-label="Siguiente">
            <ChevronRight size={17} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </div>

        {/* La oferta, UNA vez para toda la sección: las tres piezas van en la
            misma suscripción. Quien ya la tiene no la ve. */}
        {!isPremium && (
          <div className="hs-premium">
            <Link href="/premium" className="hs-premium-cta">
              <Crown size={16} strokeWidth={2.2} aria-hidden="true" />
              Hazte Premium
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <span className="hs-premium-nota">Sin permanencia · Cancela cuando quieras</span>
          </div>
        )}
      </div>
    </section>
  );
}
