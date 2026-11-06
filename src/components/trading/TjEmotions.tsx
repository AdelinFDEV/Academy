"use client";

import { useMemo, useState } from "react";
import { Search, Flame } from "lucide-react";
import { MONTHS, WEEKDAYS, WEEKDAY_NAMES, pnlStr, toneOf } from "./tjFormat";
import type { Trade } from "./tjStats";
import {
  ANIMOS, animoDeMedia, animoInfo, fechaDate, fechaKey, pnlPorDia, rachaDias,
  type Animo, type DiasMap,
} from "./tjDias";

/** Por debajo de esto, comparar ánimos es casualidad: no se saca conclusión. */
const MIN_DIAS = 3;
const NOTAS_PAGINA = 8;
const ULTIMOS = 30;

const dateLabel = (f: string) => {
  const d = fechaDate(f);
  return `${WEEKDAY_NAMES[(d.getDay() + 6) % 7]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

/**
 * La pestaña de cómo se siente el usuario: cuánto apunta, cómo se reparte su
 * ánimo, qué pasa con su dinero según cómo se siente y todas sus notas.
 */
export default function TjEmotions({ trades, dias, now, onOpenToday }: {
  trades: Trade[];
  dias: DiasMap;
  now: Date;
  /** Lleva al Resumen y abre la operación nueva de hoy, donde se apuntan las sensaciones. */
  onOpenToday: () => void;
}) {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(NOTAS_PAGINA);

  const data = useMemo(() => {
    const lista = Object.values(dias).sort((a, b) => b.fecha.localeCompare(a.fecha));
    const conAnimo = lista.filter(d => d.animo != null);
    const porDia = pnlPorDia(trades);

    const reparto = ANIMOS.map(a => ({ ...a, n: conAnimo.filter(d => d.animo === a.value).length }));

    // Ánimo frente a resultado: solo días con ánimo Y operaciones.
    const resultado = ANIMOS.map(a => {
      const dd = conAnimo.filter(d => d.animo === a.value && porDia.has(d.fecha)).map(d => porDia.get(d.fecha)!);
      const pnl = dd.reduce((s, v) => s + v.pnl, 0);
      const ops = dd.reduce((s, v) => s + v.count, 0);
      const wins = dd.reduce((s, v) => s + v.wins, 0);
      return { ...a, dias: dd.length, pnl, media: dd.length ? pnl / dd.length : 0, acierto: ops ? (wins / ops) * 100 : 0 };
    });

    // Ánimo medio por día de la semana (lunes = 0).
    const semana = WEEKDAYS.map((w, i) => {
      const v = conAnimo.filter(d => (fechaDate(d.fecha).getDay() + 6) % 7 === i).map(d => d.animo!);
      return { w, name: WEEKDAY_NAMES[i], n: v.length, media: v.length ? v.reduce((s, x) => s + x, 0) / v.length : null };
    });

    // Los últimos 30 días, del más antiguo al de hoy.
    const ultimos = Array.from({ length: ULTIMOS }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (ULTIMOS - 1 - i), 12);
      const k = fechaKey(d);
      return { k, d, dia: dias[k], pnl: porDia.get(k)?.pnl ?? null };
    });

    const mes = ultimos.filter(u => u.dia?.animo);
    const mediaMes = mes.length ? mes.reduce((s, u) => s + u.dia!.animo!, 0) / mes.length : null;

    return {
      lista, conAnimo, porDia, reparto, resultado, semana, ultimos, mediaMes,
      notas: lista.filter(d => d.nota),
      racha: rachaDias(dias, now),
      anotados30: ultimos.filter(u => u.dia).length,
    };
  }, [trades, dias, now]);

  const lectura = useMemo(() => {
    const validos = data.resultado.filter(r => r.dias >= MIN_DIAS);
    if (validos.length < 2) return null;
    const mejor = validos.reduce((a, b) => (b.media > a.media ? b : a));
    const peor = validos.reduce((a, b) => (b.media < a.media ? b : a));
    if (mejor.value === peor.value) return null;
    return `Los días que te sientes «${mejor.label.toLowerCase()}» haces de media ${pnlStr(mejor.media)}; los días «${peor.label.toLowerCase()}», ${pnlStr(peor.media)}.`;
  }, [data.resultado]);

  const q = query.trim().toLowerCase();
  const notas = q ? data.notas.filter(n => n.nota!.toLowerCase().includes(q)) : data.notas;
  const totalAnimo = data.conAnimo.length;
  const hoy = dias[fechaKey(now)];

  if (!data.lista.length) {
    return (
      <section className="tj-card tjm2-empty">
        <span className="tjm2-empty-emojis" aria-hidden="true">{ANIMOS.map(a => a.emoji).join(" ")}</span>
        <h3>Tu diario emocional empieza hoy</h3>
        <p>
          Al apuntar una operación puedes decir cómo te sientes ese día y escribir unas líneas. Con unos días
          apuntados, aquí verás cómo se reparte tu ánimo y qué pasa con tus resultados según cómo te sientes.
        </p>
        <button type="button" className="tj-btn is-primary" onClick={onOpenToday}>Apuntar cómo me siento hoy</button>
      </section>
    );
  }

  const media = data.mediaMes != null ? animoInfo(animoDeMedia(data.mediaMes)) : null;
  const maxReparto = Math.max(...data.reparto.map(r => r.n), 1);
  const maxMedia = Math.max(...data.resultado.map(r => Math.abs(r.media)), 1e-9);

  return (
    <>
      <dl className="tjn-head tjm2-head">
        <div className="tjn-kpi">
          <dt>Racha apuntando</dt>
          <dd className="tjn-kpi-value tjm2-racha">
            {data.racha > 0 && <Flame size={22} aria-hidden="true" />}
            {data.racha} {data.racha === 1 ? "día" : "días"}
          </dd>
          <dd className="tjn-kpi-sub">{hoy ? "Hoy ya está apuntado" : "Apunta hoy para no romperla"}</dd>
        </div>
        <div className="tjn-kpi">
          <dt>Últimos 30 días</dt>
          <dd className="tjn-kpi-value">{data.anotados30}<small>/30</small></dd>
          <dd className="tjn-kpi-sub">días con algo apuntado</dd>
        </div>
        <div className="tjn-kpi">
          <dt>Tu ánimo del mes</dt>
          <dd className="tjn-kpi-value">{media ? <><span aria-hidden="true">{media.emoji}</span> {media.label}</> : "—"}</dd>
          <dd className="tjn-kpi-sub">la media de los últimos 30 días</dd>
        </div>
        <div className="tjn-kpi">
          <dt>Notas escritas</dt>
          <dd className="tjn-kpi-value">{data.notas.length}</dd>
          <dd className="tjn-kpi-sub">en {data.lista.length} {data.lista.length === 1 ? "día apuntado" : "días apuntados"}</dd>
        </div>
      </dl>

      <section className="tj-card">
        <header className="tjr-head">
          <div>
            <h3>Tus últimos 30 días</h3>
            <span className="tj-count">Cada casilla es un día: su ánimo y, debajo, cómo te fue operando</span>
          </div>
          {!hoy && <button type="button" className="tj-btn is-primary" onClick={onOpenToday}>Apuntar hoy</button>}
        </header>
        <ol className="tjm2-strip">
          {data.ultimos.map(u => {
            const a = u.dia?.animo ? animoInfo(u.dia.animo) : null;
            return (
              <li
                key={u.k}
                className={`${a ? `mood-${a.value}` : "is-blank"}${u.k === fechaKey(now) ? " is-today" : ""}`}
                title={`${dateLabel(u.k)}${a ? ` · ${a.label}` : ""}${u.pnl != null ? ` · ${pnlStr(u.pnl)}` : ""}`}
              >
                <span className="tjm2-strip-emoji" aria-hidden="true">{a ? a.emoji : ""}</span>
                <span className="tjm2-strip-day">{u.d.getDate()}</span>
                <i className={u.pnl != null ? `tone-${toneOf(u.pnl)}` : "is-none"} aria-hidden="true" />
              </li>
            );
          })}
        </ol>
      </section>

      <div className="tjn-pair">
        <section className="tj-card">
          <header className="tjr-head">
            <div>
              <h3>Cómo te sientes</h3>
              <span className="tj-count">{totalAnimo} {totalAnimo === 1 ? "día" : "días"} con ánimo apuntado</span>
            </div>
          </header>
          <ul className="tjm2-dist">
            {data.reparto.map(r => (
              <li key={r.value} className={`mood-${r.value}`}>
                <span className="tjm2-emoji" aria-hidden="true">{r.emoji}</span>
                <span className="tjm2-dist-label">{r.label}</span>
                <span className="tjm2-dist-bar" aria-hidden="true"><i style={{ width: `${(r.n / maxReparto) * 100}%` }} /></span>
                <strong>{totalAnimo ? Math.round((r.n / totalAnimo) * 100) : 0} %</strong>
                <span className="tjm2-dist-n">{r.n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="tj-card">
          <header className="tjr-head">
            <div>
              <h3>Tu ánimo durante la semana</h3>
              <span className="tj-count">Cómo te sientes de media cada día</span>
            </div>
          </header>
          <div className="tjm2-week">
            {data.semana.map(d => {
              const a = d.media != null ? animoInfo(animoDeMedia(d.media)) : null;
              return (
                <div key={d.w} className={a ? `mood-${a.value}` : "is-blank"} title={a ? `${d.name}: ${a.label} (${d.n} días)` : `${d.name}: sin datos`}>
                  <span className="tjm2-emoji" aria-hidden="true">{a?.emoji ?? "·"}</span>
                  <span className="tjm2-week-bar" aria-hidden="true"><i style={{ height: `${d.media != null ? (d.media / 4) * 100 : 0}%` }} /></span>
                  <span className="tjm2-week-day">{d.w}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="tj-card">
        <header className="tjr-head">
          <div>
            <h3>Tu ánimo y tus resultados</h3>
            <span className="tj-count">
              {lectura ?? `Cuando tengas al menos ${MIN_DIAS} días operados con cada ánimo, aquí verás si cómo te sientes cambia tus resultados`}
            </span>
          </div>
        </header>
        <div className="tjm2-results">
          {data.resultado.map(r => (
            <article key={r.value} className={`tjm2-result mood-${r.value}${r.dias ? "" : " is-blank"}`}>
              <header>
                <span className="tjm2-emoji" aria-hidden="true">{r.emoji}</span>
                <span>{r.label}</span>
              </header>
              {r.dias ? (
                <>
                  <strong className={`tone-${toneOf(r.media)}`}>{pnlStr(r.media)}</strong>
                  <span className="tjm2-result-sub">de media por día</span>
                  <span className="tjm2-result-bar" aria-hidden="true">
                    <i className={r.media < 0 ? "is-neg" : undefined} style={{ width: `${(Math.abs(r.media) / maxMedia) * 50}%` }} />
                  </span>
                  <dl>
                    <div><dt>Días</dt><dd>{r.dias}</dd></div>
                    <div><dt>Acierto</dt><dd>{Math.round(r.acierto)} %</dd></div>
                    <div><dt>Total</dt><dd className={`tone-${toneOf(r.pnl)}`}>{pnlStr(r.pnl)}</dd></div>
                  </dl>
                </>
              ) : (
                <span className="tjm2-result-sub">Aún sin días operados</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="tj-card">
        <header className="tjr-head">
          <div>
            <h3>Tus notas</h3>
            <span className="tj-count">{data.notas.length} {data.notas.length === 1 ? "nota" : "notas"}, de la más reciente a la más antigua</span>
          </div>
          {data.notas.length > 3 && (
            <label className="tj-search">
              <Search size={14} aria-hidden="true" />
              <input type="search" placeholder="Buscar en tus notas" value={query} onChange={e => { setQuery(e.target.value); setLimit(NOTAS_PAGINA); }} />
            </label>
          )}
        </header>
        {notas.length ? (
          <ol className="tjm2-notes">
            {notas.slice(0, limit).map(n => {
              const a = n.animo ? animoInfo(n.animo as Animo) : null;
              const pnl = data.porDia.get(n.fecha)?.pnl;
              return (
                <li key={n.fecha} className={a ? `mood-${a.value}` : undefined}>
                  <span className="tjm2-note-emoji" aria-hidden="true">{a?.emoji ?? "·"}</span>
                  <div>
                    <header>
                      <span className="tjm2-note-date">{dateLabel(n.fecha)}</span>
                      {a && <span className="tjm2-note-mood">{a.label}</span>}
                      {pnl != null && <strong className={`tone-${toneOf(pnl)}`}>{pnlStr(pnl)}</strong>}
                    </header>
                    <p>{n.nota}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="tj-note">{q ? "Ninguna nota contiene ese texto." : "Aún no has escrito ninguna nota. Hazlo al apuntar una operación, o con el «+» de cualquier día del calendario."}</p>
        )}
        {notas.length > limit && (
          <button type="button" className="tj-btn tj-more" onClick={() => setLimit(l => l + NOTAS_PAGINA)}>Ver más notas</button>
        )}
      </section>
    </>
  );
}
