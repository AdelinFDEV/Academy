"use client";

import { useEffect, useState } from "react";
import { ANIMO_EMOJI, FACTORES_MOTIVOS, FACTORES_NEGATIVOS, PRODUCTIVIDAD, type Nota, type Productividad } from "@/lib/objetivos";
import { cifra, sumarDias } from "../editor";

/**
 * Dos lecturas de «Cómo me siento» que no se quedan en contar:
 *
 * - EstadoInterior: una frase con tu situación de ahora (los últimos 30 días)
 *   frente a todo lo anterior, y lo que ha cambiado: lo que ya no te
 *   preocupa, lo que te preocupa de nuevo, lo que más pesa y lo que más empuja.
 * - MedidorFactores: una aguja entre lo que te frena y lo que te impulsa, y
 *   cuánto MUEVE tu ánimo cada cosa — la media de los días en que aparece
 *   frente a la de los días en que no. Que algo salga mucho no quiere decir
 *   que sea lo que más te hunde.
 *
 * Todo sale de lo que marcas en el diario: no hay texto inventado, solo
 * frases elegidas según tus cifras.
 */

const DIAS_AHORA = 30;

type Catalogo = Record<string, { texto: string; emoji: string }>;
type De = (n: Nota) => readonly string[] | null | undefined;

const deNegativos: De = (n) => n.negativos;
const deMotivos: De = (n) => n.motivos;

function media(valores: number[]): number | null {
  return valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null;
}

function animoDe(notas: Nota[]): number | null {
  return media(notas.filter((n) => n.animo !== null).map((n) => n.animo as number));
}

function emojiAnimo(v: number): string {
  return ANIMO_EMOJI[Math.min(5, Math.max(1, Math.round(v))) - 1];
}

function pct(v: number): string {
  return `${Math.round(v * 100)} %`;
}

/** Qué parte de las notas menciona cada cosa del catálogo (0-1). */
function partes(notas: Nota[], catalogo: Catalogo, de: De): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const clave of Object.keys(catalogo)) {
    mapa.set(clave, notas.length ? notas.filter((n) => (de(n) ?? []).includes(clave)).length / notas.length : 0);
  }
  return mapa;
}

// ── Tu estado interior ───────────────────────────────────────────────────────

type Idea = { emoji: string; texto: string; tono: "bien" | "mal" | "neutro" };

function titular(ahora: number | null, antes: number | null): string {
  if (ahora === null) return "Estas semanas no has marcado cómo te sientes";
  const bueno = ahora >= 3.5;
  const base =
    ahora >= 4.2 ? "Estás en un muy buen momento"
    : ahora >= 3.5 ? "Te sientes bien estas semanas"
    : ahora >= 2.7 ? "Estás en un punto intermedio, ni bien ni mal"
    : ahora >= 2 ? "Llevas unas semanas cuesta arriba"
    : "Lo estás pasando mal estas semanas";
  const d = antes === null ? 0 : ahora - antes;
  if (d >= 0.4) return `${base}${bueno ? ", y vas a más" : ", aunque estás mejor que antes"}`;
  if (d <= -0.4) return `${base}${bueno ? ", aunque algo por debajo de antes" : ", y más bajo que antes"}`;
  return base;
}

function leer(notas: Nota[], hoy: string) {
  const corte = sumarDias(hoy, -(DIAS_AHORA - 1));
  const ahora = notas.filter((n) => n.fecha >= corte && n.fecha <= hoy);
  const antes = notas.filter((n) => n.fecha < corte);
  const animoAhora = animoDe(ahora);
  // Solo se compara con «antes» si antes hay algo con que comparar.
  const conAnimoAntes = antes.filter((n) => n.animo !== null).length;
  const animoAntes = conAnimoAntes >= 3 ? animoDe(antes) : null;
  const comparable = antes.length >= 5 && ahora.length >= 3;

  const ideas: Idea[] = [];
  // Lo ya dicho, por clave: «Familia» o «Apariencia» están en las dos listas con el mismo nombre.
  const dichos = new Set<string>();
  const negAhora = partes(ahora, FACTORES_NEGATIVOS, deNegativos);
  const negAntes = partes(antes, FACTORES_NEGATIVOS, deNegativos);
  const motAhora = partes(ahora, FACTORES_MOTIVOS, deMotivos);
  const motAntes = partes(antes, FACTORES_MOTIVOS, deMotivos);

  if (comparable) {
    // Lo que ya no te preocupa: antes salía a menudo y ahora casi nunca.
    const superado = Object.keys(FACTORES_NEGATIVOS)
      .map((k) => ({ k, antes: negAntes.get(k) ?? 0, ahora: negAhora.get(k) ?? 0 }))
      .filter((f) => f.antes >= 0.25 && f.ahora <= f.antes / 2)
      .sort((x, y) => y.antes - y.ahora - (x.antes - x.ahora))[0];
    if (superado) {
      const f = FACTORES_NEGATIVOS[superado.k as keyof typeof FACTORES_NEGATIVOS];
      ideas.push(
        superado.ahora <= 0.05
          ? {
              emoji: "🕊️",
              tono: "bien",
              texto: `Ya no te preocupa como antes ${f.emoji} «${f.texto}»: salía en el ${pct(superado.antes)} de tus notas y en el último mes ${superado.ahora === 0 ? "no ha aparecido ni una vez" : "casi no aparece"}.`,
            }
          : { emoji: "🌤️", tono: "bien", texto: `${f.emoji} «${f.texto}» te pesa bastante menos: del ${pct(superado.antes)} de tus notas al ${pct(superado.ahora)}.` }
      );
    }

    // Lo que te preocupa de nuevo: antes casi no salía y ahora sí.
    const nuevo = Object.keys(FACTORES_NEGATIVOS)
      .map((k) => ({ k, antes: negAntes.get(k) ?? 0, ahora: negAhora.get(k) ?? 0 }))
      .filter((f) => f.ahora >= 0.3 && f.antes <= 0.1)
      .sort((x, y) => y.ahora - x.ahora)[0];
    if (nuevo) {
      const f = FACTORES_NEGATIVOS[nuevo.k as keyof typeof FACTORES_NEGATIVOS];
      dichos.add(`n:${nuevo.k}`);
      ideas.push({ emoji: "⚠️", tono: "mal", texto: `${f.emoji} «${f.texto}» es nuevo: antes casi no salía y en el último mes está en el ${pct(nuevo.ahora)} de tus notas.` });
    }

    // Algo que ha empezado a moverte.
    const motor = Object.keys(FACTORES_MOTIVOS)
      .map((k) => ({ k, antes: motAntes.get(k) ?? 0, ahora: motAhora.get(k) ?? 0 }))
      .filter((f) => f.ahora >= 0.3 && f.antes <= 0.1)
      .sort((x, y) => y.ahora - x.ahora)[0];
    if (motor) {
      const f = FACTORES_MOTIVOS[motor.k as keyof typeof FACTORES_MOTIVOS];
      dichos.add(`m:${motor.k}`);
      ideas.push({ emoji: "🌱", tono: "bien", texto: `Has encontrado algo que te mueve: ${f.emoji} «${f.texto}», que antes casi no salía, está ya en el ${pct(motor.ahora)} de tus notas.` });
    }
  }

  // Lo que más pesa y lo que más empuja AHORA, con el ánimo de esos días.
  const mayor = (m: Map<string, number>) => [...m].filter(([, v]) => v > 0).sort((x, y) => y[1] - x[1])[0];
  const peso = mayor(negAhora);
  // Si lo que más pesa es justo lo nuevo, ya está dicho arriba.
  if (peso && !dichos.has(`n:${peso[0]}`)) {
    const f = FACTORES_NEGATIVOS[peso[0] as keyof typeof FACTORES_NEGATIVOS];
    const esosDias = animoDe(ahora.filter((n) => (deNegativos(n) ?? []).includes(peso[0])));
    const cae = esosDias !== null && animoAhora !== null && animoAhora - esosDias >= 0.3;
    ideas.push({
      emoji: "🪨",
      tono: "mal",
      texto: `Lo que más te pesa ahora es ${f.emoji} «${f.texto}»: sale en el ${pct(peso[1])} de tus notas${cae ? `, y esos días tu ánimo baja a ${emojiAnimo(esosDias as number)} ${cifra(esosDias as number)}` : ""}.`,
    });
  }
  const empuje = mayor(motAhora);
  if (empuje && !dichos.has(`m:${empuje[0]}`)) {
    const f = FACTORES_MOTIVOS[empuje[0] as keyof typeof FACTORES_MOTIVOS];
    ideas.push({ emoji: "⚡", tono: "bien", texto: `Lo que más te empuja es ${f.emoji} «${f.texto}», en el ${pct(empuje[1])} de tus notas.` });
  }

  return { ahora, animoAhora, animoAntes, titular: titular(animoAhora, animoAntes), ideas: ideas.slice(0, 4) };
}

export function EstadoInterior({ notas, hoy }: { notas: Nota[]; hoy: string }) {
  const l = leer(notas, hoy);
  const nivel = l.animoAhora === null ? null : Math.min(5, Math.max(1, Math.round(l.animoAhora)));
  const d = l.animoAhora !== null && l.animoAntes !== null ? l.animoAhora - l.animoAntes : null;

  if (l.ahora.length < 3) {
    return (
      <section className="ei ei--vacio">
        <span className="ei-orbe" aria-hidden="true">🔮</span>
        <div className="ei-textos">
          <span className="ei-ey">Tu estado interior · últimos {DIAS_AHORA} días</span>
          <p className="ei-titular">Escribe unos días más y aquí leerás cómo estás por dentro.</p>
          <p className="ei-pie">Hacen falta al menos 3 notas en el último mes. Marca el ánimo y lo que te afecta o te motiva: de eso sale todo.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`ei${nivel ? ` ei--${nivel}` : ""}`}>
      <span className="ei-orbe" aria-hidden="true">{nivel ? ANIMO_EMOJI[nivel - 1] : "🔮"}</span>
      <div className="ei-textos">
        <span className="ei-ey">🔮 Tu estado interior · últimos {DIAS_AHORA} días</span>
        <p className="ei-titular">{l.titular}.</p>
        <p className="ei-pie">
          {l.ahora.length} notas
          {l.animoAhora !== null && ` · ánimo ${cifra(l.animoAhora)}/5`}
          {d !== null && Math.abs(d) >= 0.1 && ` · ${d > 0 ? "+" : ""}${cifra(d)} frente a antes`}
        </p>
        {l.ideas.length > 0 && (
          <ul className="ei-ideas">
            {l.ideas.map((i) => (
              <li key={i.texto} className={`ei-idea ei-idea--${i.tono}`}>
                <span className="ei-idea-emoji" aria-hidden="true">{i.emoji}</span>
                <span>{i.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ── El medidor ───────────────────────────────────────────────────────────────

type Impacto = { clave: string; texto: string; emoji: string; con: number; sin: number; impacto: number; veces: number };

/** Cuánto cambia el ánimo los días en que aparece cada cosa frente a los días en que no. */
function impactos(notas: Nota[], catalogo: Catalogo, de: De): Impacto[] {
  const conAnimo = notas.filter((n) => n.animo !== null);
  return Object.keys(catalogo).flatMap((clave) => {
    const con = conAnimo.filter((n) => (de(n) ?? []).includes(clave));
    const sin = conAnimo.filter((n) => !(de(n) ?? []).includes(clave));
    // Con una sola nota no se mide nada: sería el ánimo de un día.
    if (con.length < 2 || !sin.length) return [];
    const mCon = animoDe(con) as number;
    const mSin = animoDe(sin) as number;
    return [{ clave, ...catalogo[clave], con: mCon, sin: mSin, impacto: mCon - mSin, veces: con.length }];
  });
}

const RADIO = 92;
const CX = 120;
const CY = 112;

function Aguja({ equilibrio }: { equilibrio: number }) {
  // Entra desde el centro: la aguja se mueve hasta su sitio al abrir la vista.
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisto(true));
    return () => cancelAnimationFrame(t);
  }, []);
  const grados = (visto ? equilibrio : 0) * 90;
  const arco = `M ${CX - RADIO} ${CY} A ${RADIO} ${RADIO} 0 0 1 ${CX + RADIO} ${CY}`;
  return (
    <svg className="med-svg" viewBox="0 0 240 132" role="img" aria-label={`Aguja en ${Math.round(equilibrio * 100)} sobre 100`}>
      <defs>
        <linearGradient id="med-degradado" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="35%" stopColor="#fb923c" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="70%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <path d={arco} className="med-pista" />
      <path d={arco} className="med-arco" stroke="url(#med-degradado)" />
      {[-1, -0.5, 0, 0.5, 1].map((m) => {
        const a = Math.PI * (1 - (m + 1) / 2);
        return (
          <line
            key={m}
            className="med-marca"
            x1={CX + Math.cos(a) * (RADIO - 16)}
            y1={CY - Math.sin(a) * (RADIO - 16)}
            x2={CX + Math.cos(a) * (RADIO - 22)}
            y2={CY - Math.sin(a) * (RADIO - 22)}
          />
        );
      })}
      <g className="med-aguja" style={{ transform: `rotate(${grados}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
        <path d={`M ${CX - 4} ${CY} L ${CX} ${CY - RADIO + 26} L ${CX + 4} ${CY} Z`} />
      </g>
      <circle cx={CX} cy={CY} r="8" className="med-eje" />
    </svg>
  );
}

function veredicto(e: number): { texto: string; emoji: string } {
  if (e >= 0.35) return { emoji: "🚀", texto: "Te impulsa mucho más de lo que te frena" };
  if (e >= 0.1) return { emoji: "📈", texto: "Pesa más lo que te impulsa" };
  if (e > -0.1) return { emoji: "⚖️", texto: "En equilibrio: te impulsa tanto como te frena" };
  if (e > -0.35) return { emoji: "🌧️", texto: "Pesa más lo que te frena" };
  return { emoji: "⛈️", texto: "Ahora mismo te frena mucho más de lo que te impulsa" };
}

/** Lo que más mueve tu ánimo, hacia abajo o hacia arriba, en puntos sobre 5. */
function ListaImpacto({ titulo, lista, tono }: { titulo: string; lista: Impacto[]; tono: "mal" | "bien" }) {
  const max = Math.max(1, ...lista.map((f) => Math.abs(f.impacto)));
  return (
    <div className={`med-lista med-lista--${tono}`}>
      <h4 className="med-lista-titulo">{titulo}</h4>
      {lista.length ? (
        <ol>
          {lista.map((f, i) => (
            <li key={f.clave} className="med-fila">
              <span className="med-puesto" aria-hidden="true">{i + 1}</span>
              <span className="med-fila-cuerpo">
                <span className="med-fila-linea">
                  <span className="med-fila-nombre"><span aria-hidden="true">{f.emoji}</span> {f.texto}</span>
                  <strong className="med-fila-valor">{f.impacto > 0 ? "+" : "−"}{cifra(Math.abs(f.impacto))}</strong>
                </span>
                <span className="med-fila-pista">
                  <span style={{ width: `${Math.max(6, (Math.abs(f.impacto) / max) * 100)}%` }} />
                </span>
                <small>
                  Esos días {emojiAnimo(f.con)} {cifra(f.con)} · el resto {emojiAnimo(f.sin)} {cifra(f.sin)} · {f.veces} notas
                </small>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="med-nada">{tono === "mal" ? "Nada te baja el ánimo de forma clara en este periodo." : "Aún nada te sube el ánimo de forma clara en este periodo."}</p>
      )}
    </div>
  );
}

export function MedidorFactores({ notas, periodo }: { notas: Nota[]; periodo: string }) {
  const frenos = notas.reduce((s, n) => s + (n.negativos?.length ?? 0), 0);
  const impulsos = notas.reduce((s, n) => s + (n.motivos?.length ?? 0), 0);
  if (!frenos && !impulsos) return null;

  const equilibrio = (impulsos - frenos) / (impulsos + frenos);
  const v = veredicto(equilibrio);
  const hunden = impactos(notas, FACTORES_NEGATIVOS, deNegativos).filter((f) => f.impacto <= -0.15).sort((a, b) => a.impacto - b.impacto).slice(0, 3);
  const levantan = impactos(notas, FACTORES_MOTIVOS, deMotivos).filter((f) => f.impacto >= 0.15).sort((a, b) => b.impacto - a.impacto).slice(0, 3);
  const conAnimo = notas.some((n) => n.animo !== null);

  return (
    <section className="med">
      <div className="med-cabeza">
        <h3 className="dia-sens-titulo">🧭 El medidor · {periodo}</h3>
        <span className="med-cabeza-nota">Lo que te frena frente a lo que te impulsa, y cuánto mueve cada cosa tu ánimo</span>
      </div>

      <div className="med-cuerpo">
        <div className="med-reloj">
          <Aguja equilibrio={equilibrio} />
          <div className="med-extremos" aria-hidden="true">
            <span>😣 Te frena</span>
            <span>Te impulsa 🚀</span>
          </div>
          <p className="med-veredicto"><span aria-hidden="true">{v.emoji}</span> {v.texto}</p>
          <p className="med-cuentas">
            <span className="med-cuenta med-cuenta--mal">{frenos} veces algo te frenó</span>
            <span className="med-cuenta med-cuenta--bien">{impulsos} veces algo te impulsó</span>
          </p>
        </div>

        {conAnimo ? (
          <div className="med-listas">
            <ListaImpacto titulo="⬇️ Lo que más te baja el ánimo" lista={hunden} tono="mal" />
            <ListaImpacto titulo="⬆️ Lo que más te sube el ánimo" lista={levantan} tono="bien" />
          </div>
        ) : (
          <p className="med-nada">Marca también cómo te sientes en cada nota y aquí verás cuánto te sube o te baja el ánimo cada cosa.</p>
        )}
      </div>
    </section>
  );
}

// ── Ánimo y productividad ────────────────────────────────────────────────────

const NIVELES: { nivel: Productividad; emoji: string; texto: string; tono: string }[] = [
  { nivel: 3, emoji: "🚀", texto: PRODUCTIVIDAD[3].texto, tono: "max" },
  { nivel: 2, emoji: "✅", texto: PRODUCTIVIDAD[2].texto, tono: "prod" },
  { nivel: 1, emoji: "😴", texto: PRODUCTIVIDAD[1].texto, tono: "no" },
];

/**
 * Cruza el diario con el cierre del día: con qué ánimo escribes los días que
 * fueron productivos y los que no. El calendario lo enseña mes a mes; aquí va
 * sobre el periodo elegido, que es donde se ve si es un patrón o una racha.
 * Un nivel con menos de dos notas no se compara: sería el ánimo de un día.
 */
export function AnimoYProductividad({ notas, productividad, periodo }: { notas: Nota[]; productividad: Record<string, Productividad>; periodo: string }) {
  const filas = NIVELES.map((n) => {
    const deEste = notas.filter((x) => x.animo !== null && productividad[x.fecha] === n.nivel);
    return { ...n, notas: deEste.length, animo: animoDe(deEste) };
  });
  const validas = filas.filter((f) => f.notas >= 2 && f.animo !== null) as ((typeof filas)[number] & { animo: number })[];
  if (validas.length < 2) return null;

  const prod = animoDe(notas.filter((x) => x.animo !== null && (productividad[x.fecha] ?? 0) >= 2));
  const noProd = filas[2].notas >= 2 ? filas[2].animo : null;
  const d = prod !== null && noProd !== null ? prod - noProd : null;

  return (
    <section className="ayp">
      <h3 className="dia-sens-titulo">⚡ Tu ánimo según cómo fue el día · {periodo}</h3>
      {d !== null && (
        <p className="ayp-frase">
          {Math.abs(d) < 0.3
            ? `Tu ánimo apenas cambia con la productividad: ${cifra(prod as number)} los días productivos y ${cifra(noProd as number)} los que no.`
            : d > 0
              ? `Los días productivos escribes con ánimo ${cifra(prod as number)}; los no productivos, ${cifra(noProd as number)}. Cumplir te sube ${cifra(d)} puntos.`
              : `Curioso: los días no productivos tu ánimo es más alto (${cifra(noProd as number)} frente a ${cifra(prod as number)}). Quizá descansar también te hace falta.`}
        </p>
      )}
      <div className="ayp-filas">
        {filas.map((f) => (
          <div key={f.nivel} className={`ayp-fila ayp-fila--${f.tono}${f.notas < 2 ? " ayp-fila--poca" : ""}`}>
            <span className="ayp-nombre"><span aria-hidden="true">{f.emoji}</span> {f.texto}</span>
            <span className="ayp-pista">
              {f.animo !== null && f.notas >= 2 && <span style={{ width: `${(f.animo / 5) * 100}%` }} />}
            </span>
            <strong className="ayp-valor">
              {f.animo !== null && f.notas >= 2 ? `${emojiAnimo(f.animo)} ${cifra(f.animo)}` : "—"}
            </strong>
            <small>{f.notas} nota{f.notas === 1 ? "" : "s"}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
