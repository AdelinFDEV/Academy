"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import { RadarBtcCard, RadarFngCard } from "@/components/RadarWidgets";
import {
  Radar, TrendingUp, TrendingDown, Landmark, Clock,
  Unlock, ScanEye, ChevronRight, RefreshCw, Zap, Info, Star, ExternalLink,
} from "lucide-react";
import { MACRO_EVENTS, SERIES_INFO, type MacroEvent, type MacroSeries } from "./macroEvents";

interface Mover { id: string; symbol: string; name: string; price: number; change24h: number; image: string; }
interface RadarData {
  btc: { price: number; change24h: number; high24h: number; low24h: number; marketCap: number; volume24h: number } | null;
  global: { btcDominance: number | null; totalMarketCap: number | null; marketCapChange24h: number | null } | null;
  movers: { gainers: Mover[]; losers: Mover[] };
  fng: { value: number; classification: string } | null;
  updatedAt: number;
}

const usd = (n: number, max = 0) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: max });

function fmtPrice(n: number): string {
  if (n >= 1000) return usd(n);
  if (n >= 1) return usd(n, 2);
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 });
}

function abbrev(n: number): string {
  if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
  return usd(n);
}

const pct = (n: number) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

function daysUntil(dateStr: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(dateStr + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

function countdownLabel(days: number): string {
  if (days <= 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days < 7) return `En ${days} días`;
  if (days < 14) return "La próxima semana";
  return `En ${days} días`;
}

/**
 * Qué hora "de pared" marca `timeZone` en ese instante, devuelta como si esa
 * hora fuera UTC. Sirve para despejar el offset de la zona restándole el
 * instante original.
 *
 * Va con formatToParts y NO con `new Date(fecha.toLocaleString(...))`: esa
 * segunda forma escribe la hora como texto y deja que `new Date` la vuelva a
 * leer, y al leerla la interpreta en la zona de QUIEN MIRA LA PÁGINA. Como
 * esto es un componente de cliente, el resultado salía desplazado tantas horas
 * como el offset del visitante: en Rumanía (UTC+3) el PCE de las 08:30 ET
 * aparecía a las 17:30 en vez de a las 14:30. Solo cuadraba en UTC, que es
 * justo donde corre el servidor — por eso no se veía venir.
 */
function horaDePared(instante: number, timeZone: string): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(instante);
  const v = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  // en-US con hour12:false devuelve 24 a medianoche, no 0.
  return Date.UTC(v("year"), v("month") - 1, v("day"), v("hour") % 24, v("minute"), v("second"));
}

// Convierte la hora oficial en horario del Este de EE. UU. ("14:00 ET") a la
// hora de España (Europe/Madrid) para la fecha del evento. Usa Intl, así que
// respeta el cambio de hora de ambas zonas — sin tablas fijas ni librerías.
function etTimeToMadrid(dateStr: string, timeET: string): string {
  const t = timeET.match(/(\d{1,2}):(\d{2})/);
  const [yy, mo, dd] = dateStr.split("-").map(Number);
  if (!t || !yy) return timeET.replace(" ET", "");

  // La hora de pared en Nueva York, tomada de momento como si fuera UTC.
  const pared = Date.UTC(yy, mo - 1, dd, Number(t[1]), Number(t[2]));
  // Restarle el offset de Nueva York da el instante real. Se repite una
  // segunda vez con el instante ya corregido porque el offset se mide EN un
  // instante: en un fin de semana de cambio de hora, el de la aproximación
  // puede no ser el mismo que el del instante bueno.
  let instante = pared - (horaDePared(pared, "America/New_York") - pared);
  instante = pared - (horaDePared(instante, "America/New_York") - instante);

  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(instante);
}

// Índice de Miedo y Codicia → etiqueta en español + color
export default function RadarClient() {
  const [data, setData] = useState<RadarData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = () => {
    setRefreshing(true);
    fetch("/api/radar")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: RadarData) => { setData(d); setFailed(false); })
      .catch(() => setFailed(true))
      .finally(() => { setLoaded(true); setRefreshing(false); });
  };

  useEffect(() => { load(); }, []);

  const upcoming = useMemo(() => {
    return MACRO_EVENTS
      .filter((e) => daysUntil(e.date) >= 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, []);

  // Paginación de los eventos macro (5 por página) para no alargar la lista.
  const MACRO_PAGE_SIZE = 5;
  const [macroPage, setMacroPage] = useState(1);
  const macroRef = useRef<HTMLDivElement>(null);
  const macroTotalPages = Math.max(1, Math.ceil(upcoming.length / MACRO_PAGE_SIZE));
  const macroCurrent = Math.min(macroPage, macroTotalPages);
  const macroPageEvents = upcoming.slice((macroCurrent - 1) * MACRO_PAGE_SIZE, macroCurrent * MACRO_PAGE_SIZE);
  function goMacroPage(n: number) {
    setMacroPage(Math.min(Math.max(1, n), macroTotalPages));
    macroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const btc = data?.btc ?? null;

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="rd-wrap">
      {/* ── Hero ── */}
      <div className="rd-hero">
        <div className="rd-hero-badge"><Zap size={12} /> Herramienta Premium</div>
        <h1 className="rd-hero-title">Radar Diario</h1>
        <p className="rd-hero-sub">
          Tu resumen del mercado de un vistazo: el precio de Bitcoin en las últimas 24&nbsp;horas, el sentimiento,
          los eventos macro de EE.&nbsp;UU. que mueven el mercado (inflación y tipos de interés) y quién sube y baja hoy.
        </p>
        <div className="rd-hero-meta">
          <span className="rd-hero-date">{today}</span>
          <button className="rd-refresh" onClick={load} disabled={refreshing}>
            <RefreshCw size={13} className={refreshing ? "rd-spin" : ""} /> Actualizar
          </button>
        </div>
      </div>

      {failed && (
        <div className="rd-error">No se pudieron cargar los datos de mercado. Prueba a actualizar en unos segundos.</div>
      )}

      <div className="rd-grid">
        {/* Los dos primeros widgets viven en @/components/RadarWidgets:
            la portada pinta exactamente estos mismos. */}
        <RadarBtcCard btc={btc} loaded={loaded} />
        <RadarFngCard fng={data?.fng ?? null} loaded={loaded} />

        {/* ── Snapshot de mercado ── */}
        <section className="rd-card rd-card--market">
          <div className="rd-card-head">
            <span className="rd-card-title">Mercado global</span>
          </div>
          {data?.global ? (
            <div className="rd-market">
              <div className="rd-market-item">
                <span className="rd-market-lbl">Dominancia BTC</span>
                <span className="rd-market-val">{data.global.btcDominance != null ? data.global.btcDominance.toFixed(1) + "%" : "—"}</span>
              </div>
              <div className="rd-market-item">
                <span className="rd-market-lbl">Cap. total mercado</span>
                <span className="rd-market-val">{data.global.totalMarketCap != null ? abbrev(data.global.totalMarketCap) : "—"}</span>
              </div>
              <div className="rd-market-item">
                <span className="rd-market-lbl">Cambio 24h</span>
                <span className={`rd-market-val ${(data.global.marketCapChange24h ?? 0) >= 0 ? "up" : "down"}`}>
                  {data.global.marketCapChange24h != null ? pct(data.global.marketCapChange24h) : "—"}
                </span>
              </div>
            </div>
          ) : (
            <div className="rd-skel">{loaded ? "Sin datos" : "Cargando…"}</div>
          )}
        </section>
      </div>

      {/* ── Eventos macro EE. UU. ── */}
      <section className="rd-card rd-card--macro" ref={macroRef}>
        <div className="rd-card-head">
          <span className="rd-card-title"><Landmark size={15} /> Próximos eventos macro · EE. UU.</span>
          <span className="rd-macro-hint">Inflación y tipos de interés</span>
        </div>
        <div className="rd-macro-list">
          {macroPageEvents.map((e: MacroEvent) => {
            const days = daysUntil(e.date);
            const isKey = e.series === "pce";
            const dateLbl = new Date(e.date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long" });
            return (
              <div key={`${e.date}-${e.series}`} className={`rd-macro-row ${e.kind}${isKey ? " key" : ""}${days <= 2 ? " soon" : ""}`}>
                <div className={`rd-macro-icon ${isKey ? "pce" : e.kind}`}>
                  {isKey ? <Star size={16} /> : e.kind === "rates" ? <Landmark size={16} /> : <TrendingUp size={16} />}
                </div>
                <div className="rd-macro-body">
                  <span className="rd-macro-title">
                    {e.title}
                    {isKey && <span className="rd-macro-key-tag"><Star size={9} /> Preferido de la Fed</span>}
                  </span>
                  <span className="rd-macro-detail">{e.detail}</span>
                </div>
                <div className="rd-macro-when">
                  <span className="rd-macro-countdown">{countdownLabel(days)}</span>
                  <span className="rd-macro-date"><Clock size={11} /> {dateLbl} · {etTimeToMadrid(e.date, e.timeET)} h</span>
                </div>
              </div>
            );
          })}
        </div>

        {macroTotalPages > 1 && (
          <div className="rd-pag">
            <button className="rd-pag-btn" onClick={() => goMacroPage(macroCurrent - 1)} disabled={macroCurrent === 1} aria-label="Anterior">‹</button>
            <div className="rd-pag-nums">
              {Array.from({ length: macroTotalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} className={`rd-pag-num${n === macroCurrent ? " active" : ""}`} onClick={() => goMacroPage(n)}>{n}</button>
              ))}
            </div>
            <button className="rd-pag-btn" onClick={() => goMacroPage(macroCurrent + 1)} disabled={macroCurrent === macroTotalPages} aria-label="Siguiente">›</button>
          </div>
        )}

        <p className="rd-macro-foot">Solo se listan los eventos de EE.&nbsp;UU. de mayor impacto para cripto: la inflación (IPC, PCE —el indicador preferido de la Fed— e IPP) y las decisiones de tipos de la Reserva Federal (FOMC). Las horas están en <strong>hora de España</strong> (peninsular).</p>
        <a
          href="https://www.investing.com/economic-calendar/"
          target="_blank"
          rel="noopener noreferrer"
          className="rd-macro-link"
        >
          Ver el calendario económico completo en Investing.com <ExternalLink size={13} />
        </a>
      </section>

      {/* ── Qué significa cada dato ── */}
      <section className="rd-card rd-explainer">
        <div className="rd-card-head">
          <span className="rd-card-title"><Info size={15} /> Qué significa cada dato</span>
        </div>
        <div className="rd-explainer-grid">
          {(["fomc", "cpi", "pce", "ppi"] as MacroSeries[]).map((s) => {
            const info = SERIES_INFO[s];
            return (
              <div key={s} className={`rd-explainer-item${info.highlight ? " key" : ""}`}>
                <div className="rd-explainer-head">
                  <span className="rd-explainer-short">{info.short}</span>
                  <span className="rd-explainer-name">{info.name}</span>
                  {info.highlight && <span className="rd-explainer-badge"><Star size={9} /> Preferido de la Fed</span>}
                </div>
                <p className="rd-explainer-what">{info.what}</p>
                <p className="rd-explainer-why"><strong>Por qué importa:</strong> {info.why}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Top movers ── */}
      <div className="rd-movers">
        <section className="rd-card">
          <div className="rd-card-head">
            <span className="rd-card-title"><TrendingUp size={15} className="up" /> Top subidas 24h</span>
          </div>
          <MoverList movers={data?.movers.gainers ?? []} loaded={loaded} />
        </section>
        <section className="rd-card">
          <div className="rd-card-head">
            <span className="rd-card-title"><TrendingDown size={15} className="down" /> Top bajadas 24h</span>
          </div>
          <MoverList movers={data?.movers.losers ?? []} loaded={loaded} />
        </section>
      </div>

      {/* ── Enlaces a otras herramientas ── */}
      <div className="rd-links">
        <Link href="/herramientas/liberaciones" className="rd-link">
          <Unlock size={17} />
          <div><strong>Liberaciones de Tokens</strong><span>Vesting que puede presionar el precio</span></div>
          <ChevronRight size={16} />
        </Link>
        <Link href="/dashboard/watchlist" className="rd-link">
          <ScanEye size={17} />
          <div><strong>Tu Watchlist</strong><span>El precio de las coins que sigues</span></div>
          <ChevronRight size={16} />
        </Link>
      </div>

      <p className="rd-disclaimer">
        <Radar size={13} /> Datos de mercado orientativos (CoinGecko, alternative.me), con unos minutos de retardo.
      </p>

      {/* Ver comentario equivalente en MiPortfolioClient. */}
      <DisclaimerRiesgo variante="general" />
    </div>
  );
}

function MoverList({ movers, loaded }: { movers: Mover[]; loaded: boolean }) {
  if (movers.length === 0) {
    return <div className="rd-skel">{loaded ? "Sin datos" : "Cargando…"}</div>;
  }
  return (
    <div className="rd-mover-list">
      {movers.map((m) => (
        <div key={m.id} className="rd-mover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.image} alt="" className="rd-mover-img" width={22} height={22} loading="lazy" />
          <span className="rd-mover-sym">{m.symbol}</span>
          <span className="rd-mover-price">{fmtPrice(m.price)}</span>
          <span className={`rd-mover-chg ${m.change24h >= 0 ? "up" : "down"}`}>{pct(m.change24h)}</span>
        </div>
      ))}
    </div>
  );
}
