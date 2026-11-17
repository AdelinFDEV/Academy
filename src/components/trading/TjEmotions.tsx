"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Tecla from "@/components/cuaderno/Tecla";
import { Search, Flame } from "lucide-react";
import { MONTHS, WEEKDAYS, WEEKDAY_NAMES, pnlStr, toneOf } from "./tjFormat";
import type { Trade } from "./tjStats";
import {
  ANIMOS, animoDeMedia, animoInfo, fechaDate, fechaKey, pnlPorDia, rachaDias,
  type Animo, type DiasMap,
} from "./tjDias";
import { Cara } from "./TjDayJournal";

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
      <section className="dj-hoja dj-vacio dje-vacio">
        <span className="dje-vacio-caras" aria-hidden="true">
          {ANIMOS.map(a => <span key={a.value} className={`mood-${a.value}`}><Cara valor={a.value} peq /></span>)}
        </span>
        <h3>Tu diario emocional empieza hoy</h3>
        <p>
          Al apuntar una operación puedes decir cómo te sientes ese día y escribir unas líneas. Con unos días
          apuntados, aquí verás cómo se reparte tu ánimo y qué pasa con tus resultados según cómo te sientes.
        </p>
        <Tecla color="azul" onClick={onOpenToday}>Apuntar cómo me siento hoy</Tecla>
      </section>
    );
  }

  const media = data.mediaMes != null ? animoInfo(animoDeMedia(data.mediaMes)) : null;
  const maxReparto = Math.max(...data.reparto.map(r => r.n), 1);
  const maxMedia = Math.max(...data.resultado.map(r => Math.abs(r.media)), 1e-9);
  const hoyKey = fechaKey(now);
  const color = (c: string): CSSProperties => ({ "--c": c } as CSSProperties);

  return (
    <>
      <dl className="dja-cuatro">
        <div className="dj-hoja dja-kpi">
          <dt className="dj-etq">Racha apuntando</dt>
          <dd className="dj-cifra dja-kpi-cifra dje-racha">
            {data.racha > 0 && <Flame size={26} strokeWidth={2.4} aria-hidden="true" />}
            {data.racha} {data.racha === 1 ? "día" : "días"}
          </dd>
          <dd className="dja-kpi-pie">{hoy ? "Hoy ya está apuntado" : "Apunta hoy para no romperla"}</dd>
        </div>
        <div className="dj-hoja dja-kpi">
          <dt className="dj-etq">Últimos 30 días</dt>
          <dd className="dj-cifra dja-kpi-cifra">{data.anotados30}<small>/30</small></dd>
          <dd className="dja-kpi-pie">días con algo apuntado</dd>
        </div>
        <div className={`dj-hoja dja-kpi${media ? ` mood-${media.value} dje-kpi-animo` : ""}`}>
          <dt className="dj-etq">Tu ánimo del mes</dt>
          <dd className="dj-cifra dja-kpi-cifra">{media ? <><Cara valor={media.value} peq /> {media.label}</> : "—"}</dd>
          <dd className="dja-kpi-pie">la media de los últimos 30 días</dd>
        </div>
        <div className="dj-hoja dja-kpi">
          <dt className="dj-etq">Notas escritas</dt>
          <dd className="dj-cifra dja-kpi-cifra">{data.notas.length}</dd>
          <dd className="dja-kpi-pie">en {data.lista.length} {data.lista.length === 1 ? "día apuntado" : "días apuntados"}</dd>
        </div>
      </dl>

      <section className="dj-hoja">
        <header className="dj-cabeza">
          <div>
            <h3>Tus últimos 30 días</h3>
            <p>Cada casilla es un día: su ánimo y, abajo, un punto con cómo te fue operando</p>
          </div>
          {!hoy && <Tecla color="azul" tamano="peq" onClick={onOpenToday}>Apuntar hoy</Tecla>}
        </header>
        <ol className="dje-tira">
          {data.ultimos.map((u, i) => {
            const a = u.dia?.animo ? animoInfo(u.dia.animo) : null;
            const texto = `${dateLabel(u.k)}${a ? ` · ${a.label}` : u.dia ? " · apuntado" : " · sin apuntar"}${u.pnl != null ? ` · ${pnlStr(u.pnl)}` : ""}`;
            return (
              <li
                key={u.k}
                className={`${a ? `mood-${a.value} is-animo` : u.dia ? "is-apuntado" : "is-vacia"}${u.k === hoyKey ? " is-hoy" : ""}`}
                style={{ animationDelay: `${i * 18}ms` }}
                title={texto}
              >
                <span className="sr-only">{texto}</span>
                <span className="dje-casilla-cara" aria-hidden="true">{a && <Cara valor={a.value} peq />}</span>
                <span className="dje-casilla-dia" aria-hidden="true">{u.d.getDate()}</span>
                {u.pnl != null && <i className={`dje-casilla-res tone-${toneOf(u.pnl)}`} aria-hidden="true" />}
              </li>
            );
          })}
        </ol>
        <p className="dja-leyenda" aria-hidden="true">
          <span><i className="dja-punto tone-win" /> día en verde</span>
          <span><i className="dja-punto tone-loss" /> día en rojo</span>
          <span><i className="dja-punto tone-be" /> ni gana ni pierde</span>
        </p>
      </section>

      <div className="dja-par">
        <section className="dj-hoja">
          <header className="dj-cabeza">
            <div>
              <h3>Cómo te sientes</h3>
              <p>{totalAnimo} {totalAnimo === 1 ? "día" : "días"} con ánimo apuntado</p>
            </div>
          </header>
          <ul className="dje-reparto">
            {data.reparto.map(r => (
              <li key={r.value} className={`mood-${r.value}`}>
                <span className="dje-cara" aria-hidden="true"><Cara valor={r.value} peq /></span>
                <span className="dje-reparto-nombre">{r.label}</span>
                <span className="dj-barra" style={color("var(--mood)")} aria-hidden="true">
                  <i style={{ width: `${(r.n / maxReparto) * 100}%` }} />
                </span>
                <strong className="dj-cifra">{totalAnimo ? Math.round((r.n / totalAnimo) * 100) : 0} %</strong>
                <span className="dje-reparto-n">{r.n} {r.n === 1 ? "día" : "días"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dj-hoja">
          <header className="dj-cabeza">
            <div>
              <h3>Tu ánimo durante la semana</h3>
              <p>Cómo te sientes de media cada día</p>
            </div>
          </header>
          <div className="dje-semana">
            {data.semana.map((d, i) => {
              const a = d.media != null ? animoInfo(animoDeMedia(d.media)) : null;
              const texto = a ? `${d.name}: ${a.label} (${d.n} ${d.n === 1 ? "día" : "días"})` : `${d.name}: sin datos`;
              return (
                <div key={d.w} className={a ? `mood-${a.value}` : "is-vacia"} title={texto}>
                  <span className="sr-only">{texto}</span>
                  <span className="dje-cara" aria-hidden="true">{a ? <Cara valor={a.value} peq /> : "·"}</span>
                  <span className="dje-semana-pista" aria-hidden="true">
                    <i style={{ height: `${d.media != null ? (d.media / 4) * 100 : 0}%`, animationDelay: `${80 + i * 50}ms` }} />
                  </span>
                  <span className="dje-semana-dia" aria-hidden="true">{d.w}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="dj-hoja">
        <header className="dj-cabeza">
          <div>
            <h3>Tu ánimo y tus resultados</h3>
            <p>Qué pasa con tu dinero según cómo te sientes</p>
          </div>
        </header>
        <p className={`dja-lectura${lectura ? "" : " is-pendiente"}`}>
          {lectura ?? `Cuando tengas al menos ${MIN_DIAS} días operados con cada ánimo, aquí verás si cómo te sientes cambia tus resultados.`}
        </p>
        <div className="dje-fichas">
          {data.resultado.map(r => (
            <article key={r.value} className={`dje-ficha mood-${r.value}${r.dias ? "" : " is-vacia"}`}>
              <header>
                <span className="dje-cara" aria-hidden="true"><Cara valor={r.value} peq /></span>
                <span>{r.label}</span>
              </header>
              {r.dias ? (
                <>
                  <strong className={`dj-cifra dje-ficha-cifra tone-${toneOf(r.media)}`}>{pnlStr(r.media)}</strong>
                  <span className="dje-ficha-pie">de media por día</span>
                  <span className={`dja-div-pista tone-${toneOf(r.media)}`} aria-hidden="true">
                    <i className={r.media < 0 ? "is-neg" : undefined} style={{ width: `${(Math.abs(r.media) / maxMedia) * 50}%` }} />
                  </span>
                  <dl>
                    <div><dt>Días</dt><dd>{r.dias}</dd></div>
                    <div><dt>Acierto</dt><dd>{Math.round(r.acierto)} %</dd></div>
                    <div><dt>Total</dt><dd className={`tone-${toneOf(r.pnl)}`}>{pnlStr(r.pnl)}</dd></div>
                  </dl>
                </>
              ) : (
                <span className="dje-ficha-pie">Aún sin días operados</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="dj-hoja dj-hoja--rayada">
        <header className="dj-cabeza">
          <div>
            <h3>Tus notas</h3>
            <p>{data.notas.length} {data.notas.length === 1 ? "nota" : "notas"}, de la más reciente a la más antigua</p>
          </div>
          {data.notas.length > 3 && (
            <label className="dj-buscar dje-buscar">
              <Search size={16} strokeWidth={2.6} aria-hidden="true" />
              <input
                type="search" placeholder="Buscar en tus notas" aria-label="Buscar en tus notas"
                value={query} onChange={e => { setQuery(e.target.value); setLimit(NOTAS_PAGINA); }}
              />
            </label>
          )}
        </header>
        {notas.length ? (
          <ol className="dje-entradas">
            {notas.slice(0, limit).map(n => {
              const a = n.animo ? animoInfo(n.animo as Animo) : null;
              const pnl = data.porDia.get(n.fecha)?.pnl;
              return (
                <li key={n.fecha} className={a ? `mood-${a.value}` : "is-sin-animo"}>
                  <span className="dje-entrada-cara" aria-hidden="true">{a ? <Cara valor={a.value} peq /> : "·"}</span>
                  <div>
                    <header>
                      <span className="dje-entrada-fecha">{dateLabel(n.fecha)}</span>
                      {a && <span className="dje-entrada-animo">{a.label}</span>}
                      {pnl != null && <span className={`dj-chip tone-${toneOf(pnl)}`}>{pnlStr(pnl)}</span>}
                    </header>
                    <p>{n.nota}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="dje-sin-notas">{q ? "Ninguna nota contiene ese texto." : "Aún no has escrito ninguna nota. Hazlo al apuntar una operación, o con el «+» de cualquier día del calendario."}</p>
        )}
        {notas.length > limit && (
          <div className="dje-mas">
            <Tecla color="blanca" tamano="peq" onClick={() => setLimit(l => l + NOTAS_PAGINA)}>Ver más notas</Tecla>
          </div>
        )}
      </section>
    </>
  );
}
