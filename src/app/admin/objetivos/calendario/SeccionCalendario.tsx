"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ANIMOS, ANIMO_EMOJI, CANALES, EMOCIONES, EMOCION_EMOJI, ESTADOS, ESTADO_EMOJI, ETIQUETAS, FUENTES, METRICAS, PRODUCTIVIDAD, TIPOS, TIPO_EMOJI,
  estadoPieza, periodosEnRango, porcentajeAvance,
  type Balance, type Emocion, type Etiqueta, type Fuente, type ObjetivoConProgreso, type Pieza,
} from "@/lib/objetivos";
import ResumenMes from "./ResumenMes";
import { useCierreDia } from "../CierreDia";
import { MarcarDia } from "./MarcarDia";
import type { DineroMes } from "@/lib/objetivosServidor";
import { RITMO, cifra, datosPieza, enviar, fechaCorta, finDeMes, mesVecino, nombreMes, siguienteEstado, sumarDias, useEditor } from "../editor";
import "./calendario.css";

/**
 * El calendario: vista de mes (de un vistazo), de semana (el detalle) y el
 * panel de cada día (todo, entero). Estilo propio en calendario.css, plano y
 * con el color solo donde significa algo: el canal, el estado y el día.
 */

/** Algo que de verdad salió, aunque no estuviera planeado: entradas y vídeos. */
export type Hecho = { fecha: string; tipo: "entrada" | "video" | "short"; titulo: string; enlace: string };

/** Lo que el calendario necesita de cada nota del diario: nunca el texto. El id, para llevar a ella. */
export type Animo = { id: string; fecha: string; animo: number | null; emocion: Emocion | null; etiqueta: Etiqueta | null };

/** La nota del diario de un día (la primera, si hay varias: las demás quedan al lado). */
function urlNota(animo: { notas: Animo[] }): string {
  return `/admin/objetivos/diario?nota=${animo.notas[0].id}`;
}

type Vista = "mes" | "semana";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** En el mes, cuántas piezas caben en el cuadrado antes del «+N más». */
const PIEZAS_EN_CELDA = 2;

/** Dónde recuerda el navegador la última vista usada. */
const CLAVE_VISTA = "adelinbtc:calendario-vista";

const EMOJI_PROD = { 3: "🔥", 2: "✅", 1: "❌" } as const;

/** Las celdas del mes, empezando en lunes. `null` = hueco antes del día 1. */
function celdasMes(mes: string): (string | null)[] {
  const [a, m] = mes.split("-").map(Number);
  const hueco = (new Date(Date.UTC(a, m - 1, 1)).getUTCDay() + 6) % 7;
  const total = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const celdas: (string | null)[] = Array(hueco).fill(null);
  for (let d = 1; d <= total; d++) celdas.push(`${mes}-${String(d).padStart(2, "0")}`);
  while (celdas.length % 7) celdas.push(null);
  return celdas;
}

function lunesDe(fecha: string): string {
  return sumarDias(fecha, -((new Date(`${fecha}T00:00:00Z`).getUTCDay() + 6) % 7));
}

function fechaLarga(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}

/** «6 – 12 de octubre de 2026» o «29 sept – 5 oct 2026». */
function tituloSemana(lunes: string): string {
  const domingo = sumarDias(lunes, 6);
  const d = (iso: string, opciones: Intl.DateTimeFormatOptions) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("es-ES", { ...opciones, timeZone: "UTC" });
  if (lunes.slice(0, 7) === domingo.slice(0, 7)) return `${Number(lunes.slice(8))} – ${d(domingo, { day: "numeric", month: "long", year: "numeric" })}`;
  return `${d(lunes, { day: "numeric", month: "short" })} – ${d(domingo, { day: "numeric", month: "short", year: "numeric" })}`;
}

const TONO_RITMO: Record<string, string> = {
  cumplido: "ok", adelantado: "ok", "en-ritmo": "neutro", retrasado: "warn", fallido: "bad", pendiente: "off",
};

/** Un objetivo dibujado como franja dentro de una semana del calendario. */
type Franja = {
  o: ObjetivoConProgreso;
  /** Columna de inicio y de fin dentro de la semana (0 = lunes). */
  ini: number;
  fin: number;
  carril: number;
  tono: string;
  /** Si el periodo viene de la semana anterior o sigue en la siguiente: entonces no se redondea ese lado. */
  sigueIzq: boolean;
  sigueDcha: boolean;
  esActual: boolean;
};

/**
 * Cómo pintar un periodo de un objetivo:
 * - el que se mide ahora, según su ritmo;
 * - uno pasado, verde si se cumplió y rojo si no (sale del historial);
 * - uno futuro, en gris.
 */
function tonoDePeriodo(o: ObjetivoConProgreso, desde: string, hoy: string): { tono: string; esActual: boolean } {
  if (desde >= o.periodo.desde && desde <= o.periodo.hasta) return { tono: TONO_RITMO[o.ritmo], esActual: true };
  const pasado = o.historial.find((h) => desde >= h.desde && desde <= h.hasta);
  if (pasado) return { tono: pasado.cumplido ? "ok" : "bad", esActual: false };
  return { tono: desde > hoy ? "futuro" : "off", esActual: false };
}

/** Las franjas de una semana, repartidas en carriles para que no se pisen. */
function franjasDeSemana(semana: (string | null)[], objetivos: ObjetivoConProgreso[], hoy: string): Franja[] {
  const dias = semana.filter((d): d is string => !!d);
  if (!dias.length) return [];
  const primero = dias[0];
  const ultimo = dias[dias.length - 1];

  const franjas: Omit<Franja, "carril">[] = [];
  for (const o of objetivos) {
    if (o.archivado) continue;
    for (const p of periodosEnRango(o, primero, ultimo)) {
      const finObjetivo = o.hasta ?? "9999-12-31";
      // ¿El periodo real empieza antes de esta semana o acaba después?
      const empiezaPeriodo =
        o.repeticion === "no" ? o.desde : o.repeticion === "mensual" ? `${p.desde.slice(0, 8)}01` : p.desde;
      const acabaPeriodo =
        o.repeticion === "no" ? finObjetivo : o.repeticion === "mensual" ? finDeMes(p.hasta.slice(0, 7)) : p.hasta;
      franjas.push({
        o,
        ini: semana.indexOf(p.desde),
        fin: semana.indexOf(p.hasta),
        sigueIzq: p.desde === primero && p.desde > empiezaPeriodo && p.desde > o.desde,
        sigueDcha: p.hasta === ultimo && p.hasta < acabaPeriodo && p.hasta < finObjetivo,
        ...tonoDePeriodo(o, p.desde, hoy),
      });
    }
  }

  // Carriles: cada franja va al primer hueco libre, las largas primero.
  franjas.sort((a, b) => a.ini - b.ini || b.fin - b.ini - (a.fin - a.ini));
  const finCarril: number[] = [];
  return franjas.map((f) => {
    let carril = finCarril.findIndex((fin) => fin < f.ini);
    if (carril === -1) carril = finCarril.length;
    finCarril[carril] = f.fin;
    return { ...f, carril };
  });
}

type Props = {
  hoy: string;
  vista: Vista;
  /** La vista venía en la URL. Si no, se usa la que recuerde el navegador. */
  vistaExplicita: boolean;
  mes: string;
  /** El lunes de la semana que se enseña (o la de hoy, en la vista de mes). */
  lunes: string;
  objetivos: ObjetivoConProgreso[];
  piezas: Pieza[];
  hechos: Hecho[];
  animos: Animo[];
  /** Cierre de cada día (productividad, nota y dinero). */
  balances: Record<string, Balance>;
  premiumEstimado: Record<string, number>;
  dineroMeses: DineroMes[];
};

/** Lo que se sabe de un día: todo lo que pintan las celdas, las columnas y el panel. */
type InfoDia = {
  dia: string;
  piezas: Pieza[];
  salidos: Hecho[];
  balance?: Balance;
  animo: { valor: number | null; notas: Animo[] } | null;
};

export default function SeccionCalendario(props: Props) {
  const { hoy, vista, vistaExplicita, mes, lunes, objetivos, piezas, hechos, animos, balances, premiumEstimado, dineroMeses } = props;
  const editor = useEditor(objetivos);
  const cierre = useCierreDia();
  const router = useRouter();
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [diaAbierto, setDiaAbierto] = useState<string | null>(null);

  // Sin vista en la URL: la última que usaste o, en el móvil, la semana.
  useEffect(() => {
    if (vistaExplicita) return;
    let preferida: string | null = null;
    try {
      preferida = window.localStorage.getItem(CLAVE_VISTA);
    } catch {
      // Almacenamiento bloqueado: se usa la de por defecto.
    }
    const quiere = preferida === "semana" || preferida === "mes" ? preferida : window.matchMedia("(max-width: 760px)").matches ? "semana" : "mes";
    if (quiere !== vista) router.replace(`/admin/objetivos/calendario?vista=${quiere}`);
  }, [vistaExplicita, vista, router]);

  function recordarVista(v: Vista) {
    try {
      window.localStorage.setItem(CLAVE_VISTA, v);
    } catch {
      // Sin almacenamiento: la próxima vez se abrirá la de por defecto.
    }
  }

  /** Guarda un cambio rápido (estado o fecha) sin abrir el formulario. */
  async function cambiarPieza(p: Pieza, cambios: Record<string, string>) {
    setOcupado(true);
    const fallo = await enviar("pieza", p.id, { ...datosPieza(p), ...cambios });
    setOcupado(false);
    if (fallo) alert(fallo);
    else router.refresh();
  }

  // Las notas del diario de cada día y su ánimo: la media de las que lo tienen,
  // o null si ninguna lo marcó (la nota sale igual: se escribió ese día).
  const animoDelDia = new Map<string, { valor: number | null; notas: Animo[] }>();
  for (const n of animos) {
    const notas = [...(animoDelDia.get(n.fecha)?.notas ?? []), n];
    const valores = notas.map((x) => x.animo).filter((v): v is number => v !== null);
    animoDelDia.set(n.fecha, { valor: valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null, notas });
  }
  const info = (dia: string): InfoDia => ({
    dia,
    piezas: piezas.filter((p) => p.fecha === dia),
    salidos: hechos.filter((h) => h.fecha === dia),
    balance: balances[dia],
    animo: animoDelDia.get(dia) ?? null,
  });

  // Lo que comparten las tres vistas para arrastrar piezas entre días.
  const arrastre = {
    arrastrando,
    ocupado,
    empezar: (id: string) => setArrastrando(id),
    acabar: () => {
      setArrastrando(null);
      setSobre(null);
    },
  };
  const zonaSoltar = (dia: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!arrastrando) return;
      e.preventDefault();
      if (sobre !== dia) setSobre(dia);
    },
    onDragLeave: () => setSobre((s) => (s === dia ? null : s)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setSobre(null);
      const pieza = piezas.find((p) => p.id === e.dataTransfer.getData("text/plain"));
      if (pieza && pieza.fecha !== dia) cambiarPieza(pieza, { fecha: dia });
    },
  });
  const tarjeta = (p: Pieza, completa = false) => (
    <TarjetaPieza key={p.id} p={p} hoy={hoy} completa={completa} arrastre={arrastre} onEditar={() => editor.editarPieza(p)} onAvanzar={(s) => cambiarPieza(p, { estado: s })} />
  );

  // ── Cabecera ──
  const esEsteMes = mes === hoy.slice(0, 7);
  const lunesHoy = lunesDe(hoy);
  const enEstaSemana = lunes === lunesHoy;
  const url = (v: Vista, valor: string) => `/admin/objetivos/calendario?vista=${v}&${v === "mes" ? "mes" : "semana"}=${valor}`;
  const anterior = vista === "mes" ? url("mes", mesVecino(mes, -1)) : url("semana", sumarDias(lunes, -7));
  const siguiente = vista === "mes" ? url("mes", mesVecino(mes, 1)) : url("semana", sumarDias(lunes, 7));
  const hoyUrl = vista === "mes" ? url("mes", hoy.slice(0, 7)) : url("semana", lunesHoy);
  const enHoy = vista === "mes" ? esEsteMes : enEstaSemana;

  // Lo del rango visible, en una línea.
  const publicadas = piezas.filter((p) => p.estado === "publicado").length + hechos.length;
  const enMarcha = piezas.filter((p) => ["en-curso", "en-riesgo"].includes(estadoPieza(p, hoy))).length;
  const vencidas = piezas.filter((p) => estadoPieza(p, hoy) === "vencida").length;
  const [anio, mesNombre] = [mes.slice(0, 4), nombreMes(mes).replace(/ de \d{4}$/, "")];

  return (
    <div className="cal">
      <header className="cal-cabeza">
        <div className="cal-titulo">
          {vista === "mes" ? (
            <h2><span>{mesNombre}</span> <small>{anio}</small></h2>
          ) : (
            <h2><span>{tituloSemana(lunes)}</span></h2>
          )}
          <p className="cal-resumen">
            <span><i className="cal-punto cal-punto--ok" /> {publicadas} publicado{publicadas === 1 ? "" : "s"}</span>
            <span><i className="cal-punto cal-punto--curso" /> {enMarcha} en marcha</span>
            {vencidas > 0 && <span className="cal-resumen-mal"><i className="cal-punto cal-punto--mal" /> {vencidas} con la fecha pasada</span>}
          </p>
        </div>

        <div className="cal-controles">
          <div className="cal-nav">
            <Link href={anterior} className="cal-nav-flecha" aria-label={vista === "mes" ? "Mes anterior" : "Semana anterior"}>‹</Link>
            <Link href={hoyUrl} className={`cal-nav-hoy${enHoy ? " cal-nav-hoy--aqui" : ""}`}>Hoy</Link>
            <Link href={siguiente} className="cal-nav-flecha" aria-label={vista === "mes" ? "Mes siguiente" : "Semana siguiente"}>›</Link>
          </div>
          <div className="cal-vistas" role="radiogroup" aria-label="Vista del calendario">
            <Link
              href={url("mes", vista === "semana" ? lunes.slice(0, 7) : mes)}
              role="radio"
              aria-checked={vista === "mes"}
              className={`cal-vista${vista === "mes" ? " cal-vista--activa" : ""}`}
              onClick={() => recordarVista("mes")}
            >
              Mes
            </Link>
            <Link
              href={url("semana", vista === "mes" ? (esEsteMes ? lunesHoy : lunesDe(`${mes}-01`)) : lunes)}
              role="radio"
              aria-checked={vista === "semana"}
              className={`cal-vista${vista === "semana" ? " cal-vista--activa" : ""}`}
              onClick={() => recordarVista("semana")}
            >
              Semana
            </Link>
          </div>
        </div>
      </header>

      {vista === "mes" ? (
        <VistaMes
          hoy={hoy}
          mes={mes}
          objetivos={objetivos}
          info={info}
          sobre={sobre}
          zonaSoltar={zonaSoltar}
          tarjeta={tarjeta}
          onAbrirDia={setDiaAbierto}
          onNuevaPieza={editor.nuevaPieza}
          onEditarObjetivo={editor.editarObjetivo}
        />
      ) : (
        <VistaSemana
          hoy={hoy}
          lunes={lunes}
          objetivos={objetivos}
          info={info}
          sobre={sobre}
          zonaSoltar={zonaSoltar}
          tarjeta={tarjeta}
          onAbrirDia={setDiaAbierto}
          onNuevaPieza={editor.nuevaPieza}
          onEditarObjetivo={editor.editarObjetivo}
          onCerrarDia={(dia) => cierre.abrir(dia, balances[dia], premiumEstimado[dia] ?? 0)}
        />
      )}

      <p className="cal-leyenda">
        <span><i className="cal-canal cal-canal--youtube" /> {CANALES.youtube}</span>
        <span><i className="cal-canal cal-canal--web" /> {CANALES.web}</span>
        <span><i className="cal-canal cal-canal--telegram" /> {CANALES.telegram}</span>
        <span className="cal-leyenda-sep" />
        <span>✅ productivo · ❌ no · 🔥 muy productivo</span>
        <span className="cal-leyenda-sep" />
        <span>Pulsa un día para verlo entero · arrastra una pieza para moverla</span>
      </p>

      {vista === "mes" && (
        <ResumenMes hoy={hoy} mes={mes} objetivos={objetivos} piezas={piezas} hechos={hechos} animos={animos} balances={balances} dineroMeses={dineroMeses} />
      )}

      {diaAbierto && (
        <PanelDia
          d={info(diaAbierto)}
          hoy={hoy}
          objetivos={objetivos}
          tarjeta={tarjeta}
          onCerrar={() => setDiaAbierto(null)}
          onCerrarDia={() => cierre.abrir(diaAbierto, balances[diaAbierto], premiumEstimado[diaAbierto] ?? 0)}
          onNuevaPieza={() => editor.nuevaPieza(diaAbierto)}
          onEditarObjetivo={editor.editarObjetivo}
          zonaSoltar={zonaSoltar(diaAbierto)}
        />
      )}

      {editor.modal}
      {cierre.modal}
    </div>
  );
}

// ── Piezas ───────────────────────────────────────────────────────────────────

type Arrastre = { arrastrando: string | null; ocupado: boolean; empezar: (id: string) => void; acabar: () => void };
type ZonaSoltar = (dia: string) => {
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
};

/**
 * Una pieza del plan: punto del color del canal, título y su estado.
 * `completa`: con el título entero y el tipo debajo (semana y panel).
 */
function TarjetaPieza({ p, hoy, completa, arrastre, onEditar, onAvanzar }: {
  p: Pieza;
  hoy: string;
  completa: boolean;
  arrastre: Arrastre;
  onEditar: () => void;
  onAvanzar: (siguiente: Pieza["estado"]) => void;
}) {
  const siguiente = siguienteEstado(p.estado);
  return (
    <div
      className={`cal-pieza cal-pieza--${estadoPieza(p, hoy)} cal-pieza--${p.canal}${completa ? " cal-pieza--completa" : ""}${arrastre.arrastrando === p.id ? " cal-pieza--arrastrando" : ""}`}
      draggable={!arrastre.ocupado}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", p.id);
        e.dataTransfer.effectAllowed = "move";
        arrastre.empezar(p.id);
      }}
      onDragEnd={arrastre.acabar}
    >
      <button
        className="cal-pieza-abrir"
        onClick={onEditar}
        title={`${p.titulo} · ${CANALES[p.canal]} · ${TIPOS[p.tipo]} · ${ESTADO_EMOJI[p.estado]} ${ESTADOS[p.estado]}. Arrástrala a otro día para moverla.`}
      >
        <i className="cal-pieza-punto" aria-hidden="true" />
        <span className="cal-pieza-titulo">{p.titulo}</span>
        {completa ? (
          <span className="cal-pieza-meta">{TIPO_EMOJI[p.tipo]} {TIPOS[p.tipo]} · {ESTADO_EMOJI[p.estado]} {ESTADOS[p.estado]}</span>
        ) : (
          <span className="cal-pieza-estado" aria-hidden="true">{ESTADO_EMOJI[p.estado]}</span>
        )}
      </button>
      {siguiente && (
        <button
          className="cal-pieza-avanzar"
          onClick={() => onAvanzar(siguiente)}
          disabled={arrastre.ocupado}
          title={`${ESTADOS[p.estado]} → ${ESTADO_EMOJI[siguiente]} ${ESTADOS[siguiente]}`}
          aria-label={`Pasar «${p.titulo}» a ${ESTADOS[siguiente]}`}
        >
          ›
        </button>
      )}
    </div>
  );
}

/** Algo publicado sin planear: se ve, pero va al enlace en vez de al editor. */
function Salido({ h, completa = false }: { h: Hecho; completa?: boolean }) {
  return (
    <a
      href={h.enlace}
      target="_blank"
      rel="noopener noreferrer"
      className={`cal-pieza cal-pieza--salido cal-pieza--${h.tipo === "entrada" ? "web" : "youtube"}${completa ? " cal-pieza--completa" : ""}`}
      title={`Publicado: ${TIPOS[h.tipo]} · ${h.titulo}`}
    >
      <span className="cal-pieza-abrir">
        <i className="cal-pieza-punto" aria-hidden="true" />
        <span className="cal-pieza-titulo">{h.tipo === "entrada" ? "" : `${TIPO_EMOJI[h.tipo]} `}{h.titulo}</span>
        <span className="cal-pieza-estado" aria-hidden="true">✓</span>
      </span>
    </a>
  );
}

function BolaAnimo({ animo }: { animo: InfoDia["animo"] }) {
  if (!animo) return null;
  const nivel = animo.valor === null ? null : Math.min(5, Math.max(1, Math.round(animo.valor)));
  const detalle = animo.notas
    .map((n) => [n.etiqueta ? ETIQUETAS[n.etiqueta].emoji : "", n.emocion ? `${EMOCION_EMOJI[n.emocion]} ${EMOCIONES[n.emocion]}` : ""].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" · ");
  const varias = animo.notas.length > 1;
  return (
    <Link
      href={urlNota(animo)}
      className="cal-animo"
      title={`${nivel !== null && animo.valor !== null ? `Ánimo del día: ${ANIMOS[nivel - 1]} (${animo.valor.toFixed(1)}/5) · ` : "Sin ánimo marcado · "}${animo.notas.length} nota${varias ? "s" : ""}${detalle ? ` · ${detalle}` : ""}. Pulsa para leer ${varias ? "las notas" : "la nota"} del diario.`}
      aria-label={`Leer ${varias ? "las notas" : "la nota"} del diario de este día`}
    >
      {nivel !== null ? ANIMO_EMOJI[nivel - 1] : "📓"}
    </Link>
  );
}

/** Las clases de un día según cuándo es y cómo se cerró. */
function clasesDia(d: InfoDia, hoy: string): string {
  const p = d.balance?.productividad;
  return [
    d.dia < hoy ? "cal-dia--pasado" : "",
    d.dia === hoy ? "cal-dia--hoy" : "",
    p === 1 ? "cal-dia--noprod" : p === 2 ? "cal-dia--prod" : p === 3 ? "cal-dia--prod cal-dia--prodmax" : "",
  ].filter(Boolean).join(" ");
}

type PropsVista = {
  hoy: string;
  objetivos: ObjetivoConProgreso[];
  info: (dia: string) => InfoDia;
  sobre: string | null;
  zonaSoltar: ZonaSoltar;
  tarjeta: (p: Pieza, completa?: boolean) => React.ReactNode;
  onAbrirDia: (dia: string) => void;
  onNuevaPieza: (dia: string) => void;
  onEditarObjetivo: (o: ObjetivoConProgreso) => void;
};

function Franjas({ franjas, onEditar }: { franjas: Franja[]; onEditar: (o: ObjetivoConProgreso) => void }) {
  return (
    <>
      {franjas.map((f) => (
        <button
          key={`${f.o.id}-${f.ini}`}
          className={[
            "cal-franja",
            `cal-franja--${f.tono}`,
            f.sigueIzq ? "cal-franja--sigue-izq" : "",
            f.sigueDcha ? "cal-franja--sigue-dcha" : "",
          ].filter(Boolean).join(" ")}
          style={{ gridColumn: `${f.ini + 1} / ${f.fin + 2}`, gridRow: f.carril + 1 }}
          onClick={() => onEditar(f.o)}
          title={`${f.o.titulo}${f.esActual ? ` · ${cifra(f.o.actual)} de ${cifra(f.o.meta)} · ${RITMO[f.o.ritmo].texto}` : ""}. Pulsa para editarlo.`}
        >
          <span aria-hidden="true">{METRICAS[f.o.metrica].emoji}</span>
          <span className="cal-franja-titulo">{f.o.titulo}</span>
          {f.esActual && <span className="cal-franja-cifra">{cifra(f.o.actual)}/{cifra(f.o.meta)}</span>}
        </button>
      ))}
    </>
  );
}

// ── Vista de mes: de un vistazo ──────────────────────────────────────────────

function VistaMes({ hoy, mes, objetivos, info, sobre, zonaSoltar, tarjeta, onAbrirDia, onNuevaPieza, onEditarObjetivo }: PropsVista & { mes: string }) {
  const celdas = celdasMes(mes);
  const semanas = Array.from({ length: celdas.length / 7 }, (_, w) => celdas.slice(w * 7, w * 7 + 7));

  return (
    <div className="cal-mes">
      <div className="cal-mes-cabeceras">
        {DIAS_SEMANA.map((d) => <span key={d}>{d}</span>)}
      </div>

      {semanas.map((semana, w) => {
        const franjas = franjasDeSemana(semana, objetivos, hoy);
        return (
          <div key={w} className="cal-mes-semana">
            {franjas.length > 0 && (
              <div className="cal-franjas">
                <Franjas franjas={franjas} onEditar={onEditarObjetivo} />
              </div>
            )}
            <div className="cal-mes-dias">
              {semana.map((dia, d) => {
                if (!dia) return <div key={`h${w}-${d}`} className="cal-celda cal-celda--fuera" />;
                const x = info(dia);
                const items = x.piezas.length + x.salidos.length;
                const ocultas = Math.max(0, items - PIEZAS_EN_CELDA);
                const clases = [
                  "cal-celda",
                  clasesDia(x, hoy),
                  sobre === dia ? "cal-celda--sobre" : "",
                  // En el móvil se ocultan solo los días por llegar sin nada.
                  !items && !x.balance && dia > hoy ? "cal-celda--vacia" : "",
                ].filter(Boolean).join(" ");
                return (
                  <div key={dia} className={clases} {...zonaSoltar(dia)}>
                    <div className="cal-celda-cabeza">
                      <button type="button" className="cal-num" onClick={() => onAbrirDia(dia)} title="Ver el día entero">
                        {Number(dia.slice(8))}
                      </button>
                      <BolaAnimo animo={x.animo} />
                      <span className="cal-celda-hueco" />
                      {dia <= hoy && <MarcarDia key={`${dia}-${x.balance?.productividad ?? 0}-${x.balance?.nota ?? ""}`} dia={dia} balance={x.balance} aLaIzquierda={d >= 4} />}
                    </div>

                    <div className="cal-celda-cuerpo">
                      {x.piezas.slice(0, PIEZAS_EN_CELDA).map((p) => tarjeta(p))}
                      {x.salidos.slice(0, Math.max(0, PIEZAS_EN_CELDA - x.piezas.length)).map((h, j) => <Salido key={`${h.enlace}-${j}`} h={h} />)}
                      {ocultas > 0 && (
                        <button type="button" className="cal-mas" onClick={() => onAbrirDia(dia)}>+{ocultas} más</button>
                      )}
                    </div>

                    <div className="cal-celda-pie">
                      {x.balance && x.balance.total > 0 && (
                        <button type="button" className="cal-dinero" onClick={() => onAbrirDia(dia)} title={`Ganado este día: ${cifra(x.balance.total)} €`}>
                          +{cifra(x.balance.total)} €
                        </button>
                      )}
                      <button className="cal-anadir" onClick={() => onNuevaPieza(dia)} aria-label={`Planear algo el ${fechaCorta(dia)}`} title="Planear contenido este día">＋</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Vista de semana: el detalle ──────────────────────────────────────────────

function VistaSemana({ hoy, lunes, objetivos, info, sobre, zonaSoltar, tarjeta, onAbrirDia, onNuevaPieza, onEditarObjetivo, onCerrarDia }: PropsVista & {
  lunes: string;
  onCerrarDia: (dia: string) => void;
}) {
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const franjas = franjasDeSemana(dias, objetivos, hoy);

  return (
    <div className="cal-sem">
      <div className="cal-sem-cabeceras">
        {dias.map((dia, i) => (
          <button key={dia} type="button" className={`cal-sem-fecha${dia === hoy ? " cal-sem-fecha--hoy" : ""}`} onClick={() => onAbrirDia(dia)} title="Ver el día entero">
            <span>{DIAS_SEMANA[i]}</span>
            <strong>{Number(dia.slice(8))}</strong>
          </button>
        ))}
      </div>

      {franjas.length > 0 && (
        <div className="cal-franjas cal-franjas--semana">
          <Franjas franjas={franjas} onEditar={onEditarObjetivo} />
        </div>
      )}

      <div className="cal-sem-dias">
        {dias.map((dia, i) => {
          const x = info(dia);
          const b = x.balance;
          return (
            <section
              key={dia}
              className={["cal-sem-dia", clasesDia(x, hoy), sobre === dia ? "cal-celda--sobre" : ""].filter(Boolean).join(" ")}
              aria-label={fechaLarga(dia)}
              {...zonaSoltar(dia)}
            >
              {/* Solo en el móvil, donde no hay fila de cabeceras */}
              <button type="button" className="cal-sem-fecha-movil" onClick={() => onAbrirDia(dia)}>
                {DIAS_SEMANA[i]} <strong>{Number(dia.slice(8))}</strong>
                {dia === hoy && <em>hoy</em>}
              </button>

              {(b?.productividad || x.animo || (b && b.total > 0)) && (
                <div className="cal-sem-estado">
                  {b?.productividad && <span className={`cal-chip cal-chip--prod${b.productividad}`}>{EMOJI_PROD[b.productividad]} {PRODUCTIVIDAD[b.productividad].texto}</span>}
                  {x.animo && <BolaAnimo animo={x.animo} />}
                  {b && b.total > 0 && <span className="cal-chip cal-chip--dinero">+{cifra(b.total)} €</span>}
                </div>
              )}

              {b?.nota && <p className="cal-nota">{b.nota}</p>}

              <div className="cal-sem-piezas">
                {x.piezas.map((p) => tarjeta(p, true))}
                {x.salidos.map((h, j) => <Salido key={`${h.enlace}-${j}`} h={h} completa />)}
              </div>

              <div className="cal-sem-pie">
                <button type="button" className="cal-texto-boton" onClick={() => onNuevaPieza(dia)}>＋ Planear</button>
                {dia <= hoy && (
                  <button type="button" className="cal-texto-boton" onClick={() => onCerrarDia(dia)}>{b ? "Editar cierre" : "Cerrar día"}</button>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// ── Panel del día: todo lo de un día, entero ─────────────────────────────────

function PanelDia({ d, hoy, objetivos, tarjeta, onCerrar, onCerrarDia, onNuevaPieza, onEditarObjetivo, zonaSoltar }: {
  d: InfoDia;
  hoy: string;
  objetivos: ObjetivoConProgreso[];
  tarjeta: (p: Pieza, completa?: boolean) => React.ReactNode;
  onCerrar: () => void;
  onCerrarDia: () => void;
  onNuevaPieza: () => void;
  onEditarObjetivo: (o: ObjetivoConProgreso) => void;
  zonaSoltar: ReturnType<ZonaSoltar>;
}) {
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  const b = d.balance;
  // Los objetivos que cubren este día, con cómo van.
  const activos = objetivos.filter((o) => !o.archivado && periodosEnRango(o, d.dia, d.dia).length > 0);
  const fuentes = b ? (Object.keys(FUENTES) as Fuente[]).filter((f) => (b.ingresos[f] ?? 0) > 0) : [];
  const nivel = d.animo?.valor != null ? Math.min(5, Math.max(1, Math.round(d.animo.valor))) : null;
  const emociones = d.animo ? [...new Set(d.animo.notas.map((n) => n.emocion).filter((e): e is Emocion => !!e))] : [];

  return (
    <div className="cal-panel-fondo" onClick={onCerrar}>
      <aside className="cal-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Día ${fechaLarga(d.dia)}`} {...zonaSoltar}>
        <header className="cal-panel-cabeza">
          <div>
            <span className="cal-panel-ey">{d.dia === hoy ? "Hoy" : d.dia < hoy ? "Día pasado" : "Día por llegar"}</span>
            <h3 className="cal-panel-titulo">{fechaLarga(d.dia)}</h3>
          </div>
          <button type="button" className="cal-panel-cerrar" onClick={onCerrar} aria-label="Cerrar">✕</button>
        </header>

        <div className="cal-panel-cuerpo">
          {d.dia <= hoy && (
            <section className="cal-panel-bloque">
              <h4>Cómo fue el día</h4>
              <div className="cal-panel-fila">
                {b?.productividad ? (
                  <span className={`cal-chip cal-chip--prod${b.productividad}`}>{EMOJI_PROD[b.productividad]} {PRODUCTIVIDAD[b.productividad].texto}</span>
                ) : (
                  <span className="cal-panel-nada">Sin cerrar</span>
                )}
                {d.animo && (
                  <Link href={urlNota(d.animo)} className="cal-panel-animo" title="Leer en el diario">
                    {nivel ? `${ANIMO_EMOJI[nivel - 1]} ${ANIMOS[nivel - 1]}` : "📓 Escrito en el diario"}
                    <small>{d.animo.notas.length === 1 ? "Leer la nota del diario ›" : `Leer las ${d.animo.notas.length} notas del diario ›`}</small>
                  </Link>
                )}
              </div>
              {emociones.length > 0 && <p className="cal-panel-texto">{emociones.map((e) => `${EMOCION_EMOJI[e]} ${EMOCIONES[e]}`).join(" · ")}</p>}
              {b?.nota && <p className="cal-nota">{b.nota}</p>}
              <button type="button" className="cal-texto-boton" onClick={onCerrarDia}>{b ? "Cambiar el cierre del día ›" : "Cerrar el día ›"}</button>
            </section>
          )}

          {b && b.total > 0 && (
            <section className="cal-panel-bloque">
              <h4>Dinero <strong className="cal-panel-total">{cifra(b.total)} €</strong></h4>
              <ul className="cal-panel-lista">
                {fuentes.map((f) => (
                  <li key={f}>
                    <span><span aria-hidden="true">{FUENTES[f].emoji}</span> {FUENTES[f].texto}</span>
                    <strong>{cifra(b.ingresos[f] ?? 0)} €</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="cal-panel-bloque">
            <h4>Contenido</h4>
            {d.piezas.length || d.salidos.length ? (
              <div className="cal-sem-piezas">
                {d.piezas.map((p) => tarjeta(p, true))}
                {d.salidos.map((h, j) => <Salido key={`${h.enlace}-${j}`} h={h} completa />)}
              </div>
            ) : (
              <span className="cal-panel-nada">Nada planeado ni publicado.</span>
            )}
            <button type="button" className="cal-texto-boton" onClick={onNuevaPieza}>＋ Planear contenido este día</button>
          </section>

          {activos.length > 0 && (
            <section className="cal-panel-bloque">
              <h4>Objetivos en curso</h4>
              <ul className="cal-panel-objetivos">
                {activos.map((o) => (
                  <li key={o.id}>
                    <button type="button" onClick={() => onEditarObjetivo(o)} title="Editar el objetivo">
                      <span className="cal-panel-obj-linea">
                        <span><span aria-hidden="true">{METRICAS[o.metrica].emoji}</span> {o.titulo}</span>
                        <small>{cifra(o.actual)} / {cifra(o.meta)}</small>
                      </span>
                      <span className="cal-panel-barra">
                        <span className={`cal-panel-barra-relleno cal-panel-barra-relleno--${TONO_RITMO[o.ritmo]}`} style={{ width: `${porcentajeAvance(o)}%` }} />
                      </span>
                      <span className="cal-panel-ritmo">{RITMO[o.ritmo].emoji} {RITMO[o.ritmo].texto}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
