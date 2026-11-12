"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMotionValue, useReducedMotion } from "framer-motion";
import NovaHead from "@/components/trading/NovaHead";
import Certificado from "@/components/aula/Certificado";
import {
  ArrowRight, Award, Bitcoin, Check, ChevronLeft, ChevronRight, Crown, Lock, ShieldCheck,
} from "lucide-react";
import { herramienta, detalleDe, type Herramienta } from "@/lib/herramientas";
import { PORTFOLIOS } from "@/lib/portfolios";
import {
  IconoAnillo, IconoAprobado, IconoCandado, IconoCapas, IconoCursos, IconoDiario,
  IconoMedalla, IconoPortfolio, IconoPulso, IconoReloj, IconoTrofeo,
} from "@/components/IconosAnimados";

/**
 * Cifras reales de la cartera, calculadas en el servidor. `null` si fallan.
 *
 * Solo lo que se enseña: este componente es de cliente y todo lo que recibe
 * viaja en el HTML. La portada lo recorta con `resumenHero()` para que no
 * salgan los importes (ver `MOSTRAR_IMPORTES` en `portfolio-publico.ts`).
 */
export type ResumenHero = {
  posiciones: number;
  rentabilidadPct: number;
  desdeAnio: number | null;
  dca: { rentabilidadPct: number; compras: number } | null;
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
 * El nombre, el color y la descripción salen del catálogo (`@/lib/herramientas`,
 * fuente única). Lo de aquí es solo de esta portada: `corto` es el nombre de
 * la pestaña, `lema` la línea de encima del título y `remate` la de debajo.
 */
const DIAPOSITIVAS: { id: string; corto: string; titulo?: string; lema: string; remate: string }[] = [
  { id: "portfolio", corto: "Portfolio", lema: "Mi cartera real", remate: "Qué compro, y a qué precio." },
  { id: "diario", corto: "Diario", lema: "Tu registro privado", remate: "Con bot inteligente, hitos y registro completo." },
  { id: "cursos", corto: "Cursos", lema: "Formación por módulos", remate: "Y al final, tu certificado." },
];

/** El icono animado grande de cada pieza, el mismo de la barra. */
const ICONO_PIEZA: Record<string, (p: { size?: number }) => React.ReactNode> = {
  portfolio: IconoPortfolio,
  diario: IconoDiario,
  cursos: IconoCursos,
};

type Hecho = { icono: (p: { size?: number }) => React.ReactNode; valor: string; texto: string };

/**
 * Tres datos de cada pieza, con su icono animado. Todos ciertos y
 * comprobables en la herramienta: si cambia lo que hace, cambia esto.
 */
function hechos(id: string, portfolio: ResumenHero): Hecho[] {
  if (id === "portfolio") {
    return [
      { icono: IconoPulso, valor: "En vivo", texto: "precios de mercado" },
      { icono: IconoCapas, valor: "2", texto: "carteras: spot y DCA" },
      portfolio
        ? { icono: IconoPortfolio, valor: String(portfolio.posiciones), texto: "posiciones abiertas" }
        : { icono: IconoPortfolio, valor: "Todas", texto: "también las que pierden" },
    ];
  }
  if (id === "diario") {
    return [
      { icono: IconoAnillo, valor: "10", texto: "estadísticas automáticas" },
      { icono: IconoTrofeo, valor: "7 + 1", texto: "hitos y un súper hito" },
      { icono: IconoCandado, valor: "Privado", texto: "solo lo ves tú" },
    ];
  }
  return [
    { icono: IconoAprobado, valor: "Examen", texto: "en cada módulo" },
    { icono: IconoReloj, valor: "0 a 10", texto: "nota del examen final" },
    { icono: IconoMedalla, valor: "Certificado", texto: "verificable y tuyo" },
  ];
}

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
   aplicación. Rehechas el 04-11-2026 con el lenguaje de las fichas públicas
   (`/herramientas/portfolio` y `/herramientas/diario`).

   El Portfolio enseña sus cifras de verdad, solo agregadas: lo que se paga
   —qué monedas y a qué precio— va velado. El Diario y los Cursos son una
   maqueta decorativa: las estadísticas y el progreso de cada alumno son
   privados. Sin rótulo de «ejemplo» por decisión del admin (04-11-2026). */

/** Filas veladas de la tabla del portfolio: anchos de las barras, no datos. */
const FILAS_VELADAS = [
  [62, 70, 48],
  [48, 82, 64],
  [70, 58, 40],
  [54, 76, 56],
];

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
      <div className="hs-pf-tabs" aria-hidden="true">
        {PORTFOLIOS.map((p, i) => (
          <span
            key={p.id}
            className={i === 0 ? "is-activa" : undefined}
            style={{ "--hs-tab": p.color } as React.CSSProperties}
          >
            {p.label}
          </span>
        ))}
      </div>

      <div className="hs-pf-kpis">
        <div className={`hs-pf-principal ${positiva ? "es-positiva" : "es-negativa"}`}>
          <span className="hs-etiqueta">Rentabilidad spot</span>
          <span className={`hs-pf-num ${positiva ? "es-verde" : "es-rojo"}`}>
            <Contador valor={datos.rentabilidadPct} activo={activo} />
          </span>
          <span className="hs-pf-pie">
            {datos.posiciones} posiciones abiertas
            {datos.desdeAnio ? ` · desde ${datos.desdeAnio}` : ""}
          </span>
        </div>

        {datos.dca && (
          <div className="hs-pf-dca">
            <span className="hs-pf-dca-icono" aria-hidden="true"><Bitcoin size={16} strokeWidth={2.2} /></span>
            <span className="hs-etiqueta">DCA Bitcoin</span>
            <b className={datos.dca.rentabilidadPct >= 0 ? "es-verde" : "es-rojo"}>{pct(datos.dca.rentabilidadPct)}</b>
            <small>{datos.dca.compras} compras</small>
          </div>
        )}
      </div>

      {/* La tabla, velada: se ve que hay filas, no qué dicen. */}
      <div className="hs-pf-tabla" aria-hidden="true">
        <div className="hs-pf-cab">
          <span>Coin</span>
          <span>Entrada</span>
          <span>P&amp;L</span>
        </div>
        {FILAS_VELADAS.map((f, i) => (
          <div key={i} className="hs-pf-fila" style={{ "--i": i } as React.CSSProperties}>
            <span className="hs-pf-moneda"><i /><span className="hs-velo" style={{ width: `${f[0]}%` }} /></span>
            <span className="hs-velo" style={{ width: `${f[1]}%` }} />
            <span className="hs-velo hs-velo--pl" style={{ width: `${f[2]}%` }} />
          </div>
        ))}
        <div className="hs-pf-candado">
          <span className="hs-pf-candado-icono"><Lock size={14} strokeWidth={2.4} /></span>
          <span><b>{datos.posiciones} posiciones reales</b> con su precio de entrada</span>
        </div>
      </div>
    </>
  );
}

/** Cifras de la maqueta del Diario. Redondas y coherentes entre sí. */
const DJ = { pl: "+1.240 $", plPct: "+12,4 %", winRate: 58 };

/** Curva de la maqueta, en un SVG de 320 × 100. */
const DJ_CURVA: [number, number][] = [
  [0, 84], [27, 78], [53, 81], [80, 66], [107, 70], [133, 56], [160, 60],
  [187, 45], [213, 50], [240, 34], [267, 38], [293, 22], [320, 12],
];
const DJ_PUNTOS = DJ_CURVA.map(([x, y]) => `${x},${y}`).join(" ");
const [DJ_X, DJ_Y] = DJ_CURVA[DJ_CURVA.length - 1];

/** Circunferencia del anillo del win rate. */
const DJ_ANILLO = 2 * Math.PI * 15.9;

const DJ_OPS = [
  { par: "BTC", lado: "Long", res: "+184 $", ok: true },
  { par: "ETH", lado: "Short", res: "−62 $", ok: false },
  { par: "SOL", lado: "Long", res: "+97 $", ok: true },
];

/** La racha del súper hito en la maqueta: 9 meses válidos (uno en rojo) y 3 por llegar. */
const DJ_MESES = ["ok", "ok", "rojo", "ok", "ok", "ok", "ok", "ok", "ok", "vacio", "vacio", "vacio"] as const;

function VentanaDiario({ sigue }: { sigue: boolean }) {
  // Nova mira de frente: aquí no se gira, solo hace sus gestos y sigue al cursor.
  // Solo lo sigue mientras se la ve (12-11-2026): si no, escuchaba el ratón
  // en toda la página con su diapositiva escondida o el slider fuera de vista.
  const novaTheta = useMotionValue(0);
  return (
    <div className="hs-dj" aria-hidden="true">
      <div className="hs-dj-kpis">
        <div className="hs-dj-pl">
          <span className="hs-etiqueta">P&amp;L total</span>
          <b className="es-verde">{DJ.pl}</b>
          <small>{DJ.plPct} sobre tu capital</small>
        </div>
        <div className="hs-dj-win">
          <svg viewBox="0 0 36 36" className="hs-dj-anillo">
            <circle cx="18" cy="18" r="15.9" className="hs-dj-anillo-fondo" />
            <circle
              cx="18" cy="18" r="15.9"
              className="hs-dj-anillo-valor"
              strokeDasharray={`${(DJ_ANILLO * DJ.winRate) / 100} ${DJ_ANILLO}`}
            />
          </svg>
          <span>
            <b>{DJ.winRate} %</b>
            <small>Win rate</small>
          </span>
        </div>
      </div>

      <div className="hs-dj-curva">
        <div className="hs-dj-curva-cab">
          <span className="hs-etiqueta">Curva de capital</span>
          <span className="hs-dj-max">Máximo histórico</span>
        </div>
        <div className="hs-dj-grafica">
          <svg viewBox="0 0 320 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="hsDjRelleno" x1="0" y1="0" x2="0" y2="1">
                {/* var() no vale en un atributo de presentación de SVG: el
                    color de la pieza entra por style. */}
                <stop offset="0" style={{ stopColor: "var(--tool-color)", stopOpacity: 0.34 }} />
                <stop offset="1" style={{ stopColor: "var(--tool-color)", stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line key={y} x1="0" x2="320" y1={y} y2={y} className="hs-dj-guia" />
            ))}
            <polygon points={`${DJ_PUNTOS} 320,100 0,100`} fill="url(#hsDjRelleno)" />
            <polyline points={DJ_PUNTOS} pathLength={1} className="hs-dj-linea" />
          </svg>
          <span className="hs-dj-punto" style={{ left: `${(DJ_X / 320) * 100}%`, top: `${DJ_Y}%` }} />
        </div>
      </div>

      <div className="hs-dj-ops">
        {DJ_OPS.map((o) => (
          <div key={o.par} className="hs-dj-op">
            <span className="hs-dj-moneda">{o.par.slice(0, 1)}</span>
            <span className="hs-dj-par">{o.par}<small>/USDT</small></span>
            <span className={`hs-dj-lado ${o.ok ? "es-long" : "es-short"}`}>{o.lado}</span>
            <span className={`hs-dj-res ${o.ok ? "es-verde" : "es-rojo"}`}>{o.res}</span>
          </div>
        ))}
      </div>

      {/* Nova, la asistente del Diario, asomando por la esquina con su bocadillo:
          en la herramienta abre con «Así te veo ahora» y lo que tiene que contarte. */}
      <div className="hs-dj-nova">
        <span className="hs-dj-bocadillo">
          <b>¡Tengo novedades!</b>
          <span>Así va tu trading ahora mismo</span>
        </span>
        <span className="hs-dj-nova-cabeza">
          <NovaHead theta={novaTheta} face="happy" activity="none" flying={false} joy={false} talking={false} track={sigue} />
          <span className="hs-dj-nova-aviso" />
        </span>
      </div>

      {/* El SÚPER HITO, como su tarjeta en la pestaña de hitos: corona y la racha
          de los últimos 12 meses (verde, rojo o sin llegar a 10 operaciones).
          La regla, en `tjStats.ts` (VIVIR_*): si cambia, cambia el texto de aquí. */}
      <div className="hs-dj-hito">
        <span className="hs-dj-hito-icono"><Crown size={16} strokeWidth={2.2} /></span>
        <span className="hs-dj-hito-texto">
          <small>Súper hito</small>
          <b>Conseguiste vivir del trading</b>
          <span className="hs-dj-meses">
            {DJ_MESES.map((m, i) => (
              <i key={i} className={`is-${m}`} style={{ "--i": i } as React.CSSProperties} />
            ))}
            <em>{DJ_MESES.filter((m) => m !== "vacio").length} de 12 meses</em>
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * La escena de Cursos (rehecha el 08-11-2026): el CERTIFICADO es el
 * protagonista. Arriba, el camino que lleva a él —lecciones, examen por
 * módulo, examen final— y en grande, la muestra del certificado de verdad,
 * con tres datos flotando que son ciertos del producto: nota de 0 a 10,
 * código de verificación único y el logro en el perfil.
 * Fecha fija en la muestra: es un componente de cliente y una fecha «de hoy»
 * no cuadraría al hidratar.
 */
const RUTA_CURSO = ["Lecciones", "Examen por módulo", "Examen final", "Certificado"];

function EscenaCursos() {
  return (
    <div className="hs-cc">
      <ol className="hs-cc-ruta" aria-label="Cómo se llega al certificado">
        {RUTA_CURSO.map((paso, i) => (
          <li key={paso} className={i === RUTA_CURSO.length - 1 ? "is-meta" : undefined} style={{ "--i": i } as React.CSSProperties}>
            <span className="hs-cc-ruta-punto" aria-hidden="true">
              {i === RUTA_CURSO.length - 1 ? <Award size={13} strokeWidth={2.4} /> : <Check size={12} strokeWidth={3} />}
            </span>
            <span>{paso}</span>
          </li>
        ))}
      </ol>

      <div className="hs-cc-escena" aria-hidden="true">
        <span className="hs-cc-foco" />
        <div className="hs-cc-cert">
          <Certificado
            muestra
            nombre="Tu nombre aquí"
            curso="Tu curso, aprobado"
            logro="El logro del curso"
            notaFinal={8.75}
            notaModulos={8.4}
            notaExamen={9}
            fecha="2026-11-08T12:00:00Z"
            codigo="XXXXXXXXXX"
            color="#e6b455"
          />
          <span className="hs-cc-brillo" />
        </div>
        <span className="hs-cc-chip hs-cc-chip--nota"><b>8,75</b><span>Nota final<br />sobre 10</span></span>
        <span className="hs-cc-chip hs-cc-chip--codigo"><ShieldCheck size={15} /> Verificable con código único</span>
        <span className="hs-cc-chip hs-cc-chip--logro"><Award size={15} /> Y un logro en tu perfil</span>
      </div>
    </div>
  );
}

/** Qué ventana lleva cada pieza, su ruta y si sus cifras son en vivo. */
function ventana(id: string, portfolio: ResumenHero, activo: boolean) {
  if (id === "portfolio") {
    return { ruta: "/portfolio", vivo: !!portfolio, cuerpo: <VentanaPortfolio datos={portfolio} activo={activo} /> };
  }
  if (id === "diario") {
    return { ruta: "/dashboard/trading", vivo: false, cuerpo: <VentanaDiario sigue={activo} /> };
  }
  return { ruta: "/aula", vivo: false, cuerpo: null };
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
  // Arrastre en curso. Solo se guarda en el estado SI hay arrastre (para parar
  // el temporizador); dónde empezó y cuánto lleva van en una ref, y la pista
  // se mueve escribiendo en el DOM. Antes cada movimiento del dedo era un
  // setState que volvía a pintar las tres diapositivas, Nova y el certificado
  // incluidos: en móviles modestos se notaba a tirones (12-11-2026).
  const [arrastrando, setArrastrando] = useState(false);
  const arrastre = useRef<{ x: number; dx: number } | null>(null);
  // Si el gesto fue un arrastre, el clic que llega al soltar no debe abrir
  // el enlace sobre el que se soltó.
  const huboArrastre = useRef(false);
  // Fuera de pantalla se congela todo (ver .is-fuera en home.css). Empieza en
  // true para que el HTML del servidor y la primera pintura coincidan.
  const [enPantalla, setEnPantalla] = useState(true);
  const seccionRef = useRef<HTMLElement>(null);
  const ventanaRef = useRef<HTMLDivElement>(null);
  const pistaRef = useRef<HTMLDivElement>(null);

  const total = DIAPOSITIVAS.length;
  const ir = (n: number) => setActual((n + total) % total);
  // Sin movimiento no hay avance automático: el visitante pasa a mano.
  const automatico = !reduceMotion;
  const pausado = encima || foco || arrastrando;

  const posicion = (px: number) => `translateX(calc(-${actual * 100}% + ${px}px))`;

  /** Mueve la pista con el dedo, sin pasar por React. */
  const seguirDedo = (dx: number) => {
    const pista = pistaRef.current;
    if (!pista) return;
    // En los extremos el arrastre cuesta más, como en cualquier carrusel nativo.
    const enBorde = (actual === 0 && dx > 0) || (actual === total - 1 && dx < 0);
    pista.style.transition = "none";
    pista.style.transform = posicion(enBorde ? dx * 0.35 : dx);
  };

  /** Termina el gesto: devuelve la transición y, si no cambia, la pista a su sitio. */
  const soltar = (cancelado: boolean) => {
    const a = arrastre.current;
    if (!a) return;
    arrastre.current = null;
    setArrastrando(false);
    const pista = pistaRef.current;
    if (pista) {
      pista.style.transition = "";
      // Si cambia de diapositiva, React escribe la posición nueva al pintar;
      // si no, la pista vuelve sola, animada, a donde estaba.
      pista.style.transform = posicion(0);
    }
    if (!cancelado && Math.abs(a.dx) > UMBRAL_PX) ir(actual + (a.dx < 0 ? 1 : -1));
  };

  // Lo que no se ve no gasta: fuera de pantalla, el slider y las luces del
  // hero se congelan.
  useEffect(() => {
    const el = seccionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const hero = seccionRef.current?.closest(".hero");
    hero?.classList.toggle("is-hs-fuera", !enPantalla);
    return () => hero?.classList.remove("is-hs-fuera");
  }, [enPantalla]);

  // La diagonal de la diapositiva, para el cuadrado del borde que gira.
  useEffect(() => {
    const el = ventanaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      el.style.setProperty("--hs-diag", `${Math.ceil(Math.hypot(el.offsetWidth, el.offsetHeight))}px`);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section
      ref={seccionRef}
      className={`hs${pausado ? " is-pausado" : ""}${automatico ? "" : " is-quieto"}${enPantalla ? "" : " is-fuera"}`}
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
        ref={ventanaRef}
        className="hs-ventana"
        aria-live={automatico && !pausado ? "off" : "polite"}
        onPointerDown={(e) => {
          if (e.pointerType !== "touch") return;
          huboArrastre.current = false;
          arrastre.current = { x: e.clientX, dx: 0 };
          setArrastrando(true);
        }}
        onPointerMove={(e) => {
          const a = arrastre.current;
          if (!a || e.pointerType !== "touch") return;
          a.dx = e.clientX - a.x;
          if (Math.abs(a.dx) > 8) huboArrastre.current = true;
          seguirDedo(a.dx);
        }}
        onPointerUp={() => soltar(false)}
        // El navegador cancela el gesto si decide que es un scroll vertical:
        // la diapositiva vuelve a su sitio.
        onPointerCancel={() => soltar(true)}
        onClickCapture={(e) => {
          if (huboArrastre.current) {
            e.preventDefault();
            e.stopPropagation();
            huboArrastre.current = false;
          }
        }}
      >
        <div ref={pistaRef} className="hs-pista" style={{ transform: posicion(0) }}>
          {DIAPOSITIVAS.map((d, i) => {
            const f = herramienta(d.id);
            const titulo = d.titulo ?? f.label;
            const activo = i === actual;
            const a = accion(f, isPremium);
            const v = ventana(f.id, portfolio, activo && enPantalla);
            const IconoGrande = ICONO_PIEZA[f.id];

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
                    <div className="hs-cabeza hs-entra" style={{ "--d": 0 } as React.CSSProperties}>
                      <span className="hs-sello-icono" aria-hidden="true">
                        {IconoGrande && <IconoGrande size={24} />}
                      </span>
                      <span className="hs-lema">
                        <span className="hs-lema-num">0{i + 1} / 0{total}</span>
                        {d.lema}
                      </span>
                      {f.acceso === "proximamente" && <span className="hs-sello-texto">{f.tag}</span>}
                    </div>

                    <h2 className="hs-titulo hs-entra" style={{ "--d": 1 } as React.CSSProperties}>
                      {titulo}
                      <span className="hs-remate">{d.remate}</span>
                    </h2>
                    <p className="hs-claim hs-entra" style={{ "--d": 2 } as React.CSSProperties}>{f.desc}</p>

                    <ul className="hs-hechos hs-entra" style={{ "--d": 3 } as React.CSSProperties}>
                      {hechos(f.id, portfolio).map((h) => {
                        const IconoHecho = h.icono;
                        return (
                          <li key={h.texto} className="hs-hecho">
                            <span className="hs-hecho-icono"><IconoHecho size={18} /></span>
                            <span className="hs-hecho-texto">
                              <b>{h.valor}</b>
                              <span>{h.texto}</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <Link href={a.href} className="hs-accion hs-entra" style={{ "--d": 4 } as React.CSSProperties}>
                      {a.texto}
                      <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                  </div>

                  {f.id === "cursos" ? (
                    <div className="hs-app hs-app--cert hs-entra" style={{ "--d": 2 } as React.CSSProperties}>
                      <EscenaCursos />
                    </div>
                  ) : (
                  <div className="hs-app hs-entra" style={{ "--d": 2 } as React.CSSProperties}>
                    <div className="hs-app-barra">
                      <span className="hs-app-luces" aria-hidden="true"><i /><i /><i /></span>
                      <span className="hs-app-ruta">adelinacademy.com{v.ruta}</span>
                      {v.vivo && <span className="hs-app-etiqueta is-vivo"><i aria-hidden="true" />En vivo</span>}
                    </div>
                    <div className="hs-app-cuerpo">{v.cuerpo}</div>
                  </div>
                  )}
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
