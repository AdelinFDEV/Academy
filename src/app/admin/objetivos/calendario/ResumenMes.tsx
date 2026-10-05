"use client";

import {
  ANIMOS, ANIMO_EMOJI, CANALES, EMOCIONES, EMOCION_EMOJI, FUENTES, estadoPieza, periodosEnRango,
  type Balance, type Canal, type Emocion, type Fuente, type ObjetivoConProgreso, type Pieza,
} from "@/lib/objetivos";
import type { DineroMes } from "@/lib/objetivosServidor";
import { cifra, fechaCorta, finDeMes, nombreMes } from "../editor";
import type { Animo, Hecho } from "./SeccionCalendario";

/**
 * El resumen del mes, al final del calendario. Todo sale solo de lo que ya
 * hay: cierres de día, diario, plan de contenido y objetivos.
 *
 * El veredicto se calcula SOLO con lo que tiene datos: con un día escrito y
 * nada más, no puede decir «buen mes». Si hay poco, lo dice.
 */

type Props = {
  hoy: string;
  mes: string;
  objetivos: ObjetivoConProgreso[];
  piezas: Pieza[];
  hechos: Hecho[];
  animos: Animo[];
  balances: Record<string, Balance>;
  dineroMeses: DineroMes[];
};

const DIA = 86400000;

function media(v: number[]): number | null {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

function euros(n: number, decimales = 0): string {
  return n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: decimales, minimumFractionDigits: decimales });
}

function dias(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA);
}

function emojiAnimo(v: number): string {
  return ANIMO_EMOJI[Math.min(5, Math.max(1, Math.round(v))) - 1];
}

function textoAnimo(v: number): string {
  return ANIMOS[Math.min(5, Math.max(1, Math.round(v))) - 1];
}

/** «▲ 12 %» / «▼ 8 %» / null si no hay con qué comparar. */
function variacion(actual: number, anterior: number | null | undefined): { texto: string; sube: boolean } | null {
  if (anterior === null || anterior === undefined || anterior === 0) return null;
  const pct = Math.round(((actual - anterior) / Math.abs(anterior)) * 100);
  return { texto: `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)} %`, sube: pct >= 0 };
}

type EstadoObjetivo = "si" | "no" | "curso" | "futuro";

export default function ResumenMes({ hoy, mes, objetivos, piezas, hechos, animos, balances, dineroMeses }: Props) {
  const ini = `${mes}-01`;
  const fin = finDeMes(mes);
  const totalDias = dias(ini, fin) + 1;
  const esPasado = fin < hoy;
  const esFuturo = ini > hoy;
  const diasTranscurridos = esFuturo ? 0 : esPasado ? totalDias : dias(ini, hoy) + 1;
  const [a, m] = mes.split("-").map(Number);
  const mesAnt = new Date(Date.UTC(a, m - 2, 1)).toISOString().slice(0, 7);

  // ── Dinero
  const dineroEste = dineroMeses.find((d) => d.mes === mes);
  const totalMes = dineroEste?.total ?? 0;
  const totalAnt = dineroMeses.find((d) => d.mes === mesAnt)?.total ?? null;
  const record = dineroMeses.reduce<DineroMes | null>((r, d) => (!r || d.total > r.total ? d : r), null);
  const esRecord = !!record && record.mes === mes && totalMes > 0;
  const fuentes = (Object.keys(FUENTES) as Fuente[])
    .map((f) => ({ f, total: dineroEste?.porFuente[f] ?? 0 }))
    .filter((x) => x.total > 0)
    .sort((x, y) => y.total - x.total);

  // ── Productividad (cierres de día)
  const balancesMes = Object.values(balances).filter((b) => b.fecha >= ini && b.fecha <= fin);
  const balancesAnt = Object.values(balances).filter((b) => b.fecha.startsWith(mesAnt));
  const productivos = balancesMes.filter((b) => b.productividad === 2 || b.productividad === 3).length;
  const noProductivos = balancesMes.filter((b) => b.productividad === 1).length;
  const cerrados = productivos + noProductivos;
  const productivosAnt = balancesAnt.filter((b) => b.productividad === 2 || b.productividad === 3).length;
  const mejorDiaDinero = balancesMes.reduce<Balance | null>((r, b) => (b.total > 0 && (!r || b.total > r.total) ? b : r), null);

  // ── Ánimo (diario)
  const notasMes = animos.filter((n) => n.fecha >= ini && n.fecha <= fin);
  const conAnimo = notasMes.filter((n) => n.animo !== null) as (Animo & { animo: number })[];
  const animoMes = media(conAnimo.map((n) => n.animo));
  const animoAnt = media(animos.filter((n) => n.fecha.startsWith(mesAnt) && n.animo !== null).map((n) => n.animo as number));
  const reparto = ANIMOS.map((_, i) => conAnimo.filter((n) => n.animo === i + 1).length);
  const porDia = new Map<string, number[]>();
  for (const n of conAnimo) porDia.set(n.fecha, [...(porDia.get(n.fecha) ?? []), n.animo]);
  const diasAnimo = [...porDia.entries()].map(([fecha, v]) => ({ fecha, valor: media(v) as number }));
  const mejor = diasAnimo.length ? diasAnimo.reduce((x, y) => (y.valor > x.valor ? y : x)) : null;
  const peor = diasAnimo.length > 1 ? diasAnimo.reduce((x, y) => (y.valor < x.valor ? y : x)) : null;
  const emociones = new Map<Emocion, number>();
  for (const n of notasMes) if (n.emocion) emociones.set(n.emocion, (emociones.get(n.emocion) ?? 0) + 1);
  const emocionTop = [...emociones.entries()].sort((x, y) => y[1] - x[1])[0];
  const animoEn = (niveles: number[]) =>
    media(conAnimo.filter((n) => niveles.includes(balances[n.fecha]?.productividad ?? 0)).map((n) => n.animo));
  const animoProd = animoEn([2, 3]);
  const animoNoProd = animoEn([1]);

  // ── Contenido
  const publicadasPlan = piezas.filter((p) => p.estado === "publicado").length;
  const publicadas = publicadasPlan + hechos.length;
  const vencidas = piezas.filter((p) => estadoPieza(p, hoy) === "vencida").length;
  const planPct = piezas.length ? Math.round((publicadasPlan / piezas.length) * 100) : null;
  const porCanal = (Object.keys(CANALES) as Canal[]).map((c) => ({
    canal: c,
    total:
      piezas.filter((p) => p.canal === c && p.estado === "publicado").length +
      hechos.filter((h) => (c === "youtube" ? h.tipo === "video" : c === "web" ? h.tipo === "entrada" : false)).length,
  }));

  // ── Objetivos
  const resultados: { o: ObjetivoConProgreso; estado: EstadoObjetivo }[] = [];
  for (const o of objetivos.filter((x) => !x.archivado)) {
    for (const p of periodosEnRango(o, ini, fin)) {
      let estado: EstadoObjetivo;
      if (p.desde >= o.periodo.desde && p.desde <= o.periodo.hasta) {
        estado = o.ritmo === "cumplido" ? "si" : o.ritmo === "fallido" ? "no" : o.ritmo === "pendiente" ? "futuro" : "curso";
      } else {
        const h = o.historial.find((x) => p.desde >= x.desde && p.desde <= x.hasta);
        estado = h ? (h.cumplido ? "si" : "no") : p.desde > hoy ? "futuro" : "curso";
      }
      resultados.push({ o, estado });
    }
  }
  const cuenta = (e: EstadoObjetivo) => resultados.filter((r) => r.estado === e).length;
  const objCerrados = cuenta("si") + cuenta("no");

  // ── Veredicto: solo con lo que tiene datos
  const puntos: number[] = [];
  if (cerrados) puntos.push(productivos / cerrados);
  if (objCerrados) puntos.push(cuenta("si") / objCerrados);
  if (animoMes !== null) puntos.push((animoMes - 1) / 4);
  if (totalAnt && totalAnt > 0 && diasTranscurridos) {
    // Dinero frente al mes anterior, al mismo ritmo de días.
    const ritmoAnt = (totalAnt / (dias(`${mesAnt}-01`, finDeMes(mesAnt)) + 1)) * diasTranscurridos;
    puntos.push(Math.min(1, totalMes / ritmoAnt));
  }
  const nota = media(puntos);
  const diasConDatos = new Set([...balancesMes.map((b) => b.fecha), ...notasMes.map((n) => n.fecha)]).size;
  const pocosDatos = diasConDatos < 3;

  const veredicto = esFuturo
    ? { emoji: "🗓️", titulo: "Mes por llegar", tono: "off" }
    : nota === null
      ? { emoji: "🌱", titulo: "Mes por estrenar", tono: "off" }
      : nota >= 0.7
        ? { emoji: "🔥", titulo: "Gran mes", tono: "ok" }
        : nota >= 0.5
          ? { emoji: "👍", titulo: "Buen mes", tono: "ok" }
          : nota >= 0.35
            ? { emoji: "⚖️", titulo: "Mes irregular", tono: "warn" }
            : { emoji: "🫂", titulo: "Mes difícil", tono: "bad" };

  // Una frase que cuenta el mes con sus cifras
  const piezasFrase = [
    `${esPasado ? "En" : "En lo que va de"} ${nombreMes(mes, true)} ${totalMes > 0 ? `has ganado ${euros(totalMes)}` : "aún no has apuntado dinero"}`,
    cerrados ? `${productivos} de ${cerrados} días cerrados fueron productivos` : "",
    publicadas ? `has publicado ${publicadas} pieza${publicadas === 1 ? "" : "s"}` : "",
    animoMes !== null ? `tu ánimo medio es «${textoAnimo(animoMes).toLowerCase()}»` : "",
  ].filter(Boolean);
  const frase = esFuturo
    ? `${nombreMes(mes)} aún no ha empezado. Puedes ir planeando contenido y objetivos.`
    : piezasFrase.length > 1
      ? `${piezasFrase.slice(0, -1).join(", ")} y ${piezasFrase[piezasFrase.length - 1]}.`
      : `${piezasFrase[0]}.`;

  // ── Lo que dicen tus datos
  const ideas: { emoji: string; texto: string }[] = [];
  if (!esFuturo && !cerrados && diasTranscurridos > 0) {
    ideas.push({ emoji: "🌙", texto: "Aún no has cerrado ningún día. Marca ✅ o ❌ en cada día del calendario, o pulsa su número para apuntar también lo que ganaste." });
  }
  if (esRecord) ideas.push({ emoji: "🏆", texto: `Es tu mejor mes en dinero hasta ahora, con ${euros(totalMes)}.` });
  else if (record && record.total > 0 && totalMes > 0) {
    ideas.push({ emoji: "🏆", texto: `Llevas el ${Math.round((totalMes / record.total) * 100)} % de tu récord (${euros(record.total)} en ${nombreMes(record.mes)}).` });
  }
  if (fuentes.length > 1) {
    ideas.push({ emoji: FUENTES[fuentes[0].f].emoji, texto: `${FUENTES[fuentes[0].f].texto} es tu mayor fuente este mes: ${Math.round((fuentes[0].total / totalMes) * 100)} % de lo ganado.` });
  }
  if (animoProd !== null && animoNoProd !== null) {
    ideas.push({
      emoji: animoProd >= animoNoProd ? "💡" : "🤔",
      texto: `Los días productivos tu ánimo es ${emojiAnimo(animoProd)} ${cifra(animoProd)}/5; los no productivos, ${emojiAnimo(animoNoProd)} ${cifra(animoNoProd)}/5.`,
    });
  }
  if (animoMes !== null && animoAnt !== null && Math.abs(animoMes - animoAnt) >= 0.3) {
    ideas.push({ emoji: animoMes > animoAnt ? "📈" : "📉", texto: `Tu ánimo ${animoMes > animoAnt ? "ha mejorado" : "ha bajado"} frente a ${nombreMes(mesAnt, true)} (${cifra(animoAnt)} → ${cifra(animoMes)}).` });
  }
  if (vencidas) ideas.push({ emoji: "🔴", texto: `${vencidas} pieza${vencidas === 1 ? "" : "s"} del plan se ${vencidas === 1 ? "ha" : "han"} quedado sin publicar con la fecha pasada.` });
  if (cuenta("curso")) ideas.push({ emoji: "⏳", texto: `${cuenta("curso")} objetivo${cuenta("curso") === 1 ? " sigue" : "s siguen"} en curso: revisa su ritmo en la pestaña Objetivos.` });

  const vDinero = variacion(totalMes, totalAnt);
  const vProd = variacion(productivos, productivosAnt || null);
  const vAnimo = animoMes !== null && animoAnt !== null ? { texto: `${animoMes >= animoAnt ? "▲" : "▼"} ${cifra(Math.abs(animoMes - animoAnt))}`, sube: animoMes >= animoAnt } : null;
  const avanceMes = Math.round((diasTranscurridos / totalDias) * 100);
  const ESTADO_TEXTO: Record<EstadoObjetivo, string> = { si: "Cumplido", no: "Sin cumplir", curso: "En curso", futuro: "Por empezar" };

  return (
    <section className={`rm rm--${veredicto.tono}`} aria-label={`Resumen de ${nombreMes(mes)}`}>
      {/* ── Cabecera ── */}
      <header className="rm-cabeza">
        <span className="rm-emoji" aria-hidden="true">{veredicto.emoji}</span>
        <div className="rm-cabeza-textos">
          <span className="rm-ey">Resumen de {nombreMes(mes)}</span>
          <h2 className="rm-titulo">
            {veredicto.titulo}
            {pocosDatos && !esFuturo && nota !== null && <span className="rm-aviso">con pocos datos todavía</span>}
          </h2>
          <p className="rm-frase">{frase}</p>
        </div>
        {!esFuturo && (
          <div className="rm-avance" title={`${diasTranscurridos} de ${totalDias} días`}>
            <span>{esPasado ? "Mes cerrado" : `Día ${diasTranscurridos} de ${totalDias}`}</span>
            <div className="rm-avance-pista"><div style={{ width: `${avanceMes}%` }} /></div>
          </div>
        )}
      </header>

      {/* ── Las cuatro cifras ── */}
      <div className="rm-kpis">
        <Kpi etiqueta="Dinero ganado" valor={euros(totalMes, totalMes % 1 ? 2 : 0)} variacion={vDinero} pie={esRecord ? "🏆 Mes récord" : record && record.total > 0 ? `Récord: ${euros(record.total)}` : "Apúntalo al cerrar el día"} tono="dinero" />
        <Kpi etiqueta="Días productivos" valor={cerrados ? `${productivos}/${cerrados}` : "—"} variacion={vProd} pie={cerrados ? `${Math.round((productivos / cerrados) * 100)} % · ${noProductivos} no productivo${noProductivos === 1 ? "" : "s"}` : "Ningún día cerrado aún"} tono="ok" />
        <Kpi etiqueta="Publicado" valor={String(publicadas)} pie={piezas.length ? `${planPct} % del plan · ${piezas.length} planeadas` : "Sin plan este mes"} tono="contenido" />
        <Kpi etiqueta="Ánimo medio" valor={animoMes !== null ? `${emojiAnimo(animoMes)} ${textoAnimo(animoMes)}` : "—"} variacion={vAnimo} pie={animoMes !== null ? `${cifra(animoMes)}/5 · ${conAnimo.length} nota${conAnimo.length === 1 ? "" : "s"}` : "Escribe en el Diario"} tono="animo" />
      </div>

      {/* ── Detalle: cuatro bloques en dos columnas; vacíos, una sola línea ── */}
      <div className="rm-detalle">
        <article className="rm-bloque">
          <h3>Dinero</h3>
          {fuentes.length ? (
            <>
              {record && record.total > 0 && (
                <div className="rm-record">
                  <div className="rm-record-linea">
                    <span>{esRecord ? "🏆 Récord batido" : `Hacia el récord de ${nombreMes(record.mes, true)}`}</span>
                    <strong>{Math.min(100, Math.round((totalMes / record.total) * 100))} %</strong>
                  </div>
                  <div className="rm-record-pista"><div style={{ width: `${Math.min(100, (totalMes / record.total) * 100)}%` }} /></div>
                </div>
              )}
              <div className="rm-fuentes">
                {fuentes.map((x) => (
                  <div key={x.f} className="rm-fuente">
                    <span className="rm-fuente-nombre">{FUENTES[x.f].emoji} {FUENTES[x.f].texto}</span>
                    <div className="rm-fuente-pista"><div style={{ width: `${(x.total / fuentes[0].total) * 100}%` }} /></div>
                    <strong>{euros(x.total)}</strong>
                  </div>
                ))}
              </div>
              <ul className="rm-datos">
                <li><span>Media por día</span><strong>{euros(diasTranscurridos ? totalMes / diasTranscurridos : 0, 2)}</strong></li>
                {mejorDiaDinero && <li><span>Mejor día</span><strong>{fechaCorta(mejorDiaDinero.fecha)} · {euros(mejorDiaDinero.total)}</strong></li>}
              </ul>
            </>
          ) : (
            <p className="rm-nada">Sin dinero apuntado este mes. Ciérralo desde cada día con lo que ganaste.</p>
          )}
        </article>

        <article className="rm-bloque">
          <h3>Ánimo</h3>
          {conAnimo.length ? (
            <>
              {/* Una barra repartida por niveles: rojo · gris · verde */}
              <div className="rm-animo-barra" role="img" aria-label={reparto.map((n, i) => `${ANIMOS[i]}: ${n}`).join(", ")}>
                {reparto.map((n, i) =>
                  n ? <span key={i} className={`obj-nivel--${i + 1}`} style={{ flexGrow: n }} title={`${ANIMOS[i]}: ${n} nota${n === 1 ? "" : "s"}`} /> : null
                )}
              </div>
              <div className="rm-animo-leyenda">
                {reparto.map((n, i) => (n ? <span key={i}>{ANIMO_EMOJI[i]} {ANIMOS[i]} <strong>{n}</strong></span> : null))}
              </div>
              <ul className="rm-datos">
                {mejor && <li><span>Mejor día</span><strong>{fechaCorta(mejor.fecha)} {emojiAnimo(mejor.valor)}</strong></li>}
                {peor && peor.fecha !== mejor?.fecha && <li><span>Peor día</span><strong>{fechaCorta(peor.fecha)} {emojiAnimo(peor.valor)}</strong></li>}
                {emocionTop && <li><span>Emoción más repetida</span><strong>{EMOCION_EMOJI[emocionTop[0]]} {EMOCIONES[emocionTop[0]]} · {emocionTop[1]}</strong></li>}
                <li><span>Días escritos</span><strong>{porDia.size} de {diasTranscurridos || "—"}</strong></li>
              </ul>
            </>
          ) : (
            <p className="rm-nada">Sin notas con ánimo este mes. Escribe en el Diario y aquí verás cómo te has sentido.</p>
          )}
        </article>

        <article className="rm-bloque">
          <h3>Objetivos</h3>
          {resultados.length ? (
            <>
              <p className="rm-linea">
                <span><i className="rm-punto rm-punto--si" /> {cuenta("si")} cumplidos</span>
                <span><i className="rm-punto rm-punto--curso" /> {cuenta("curso")} en curso</span>
                <span><i className="rm-punto rm-punto--no" /> {cuenta("no")} sin cumplir</span>
              </p>
              <ul className="rm-lista">
                {resultados.slice(0, 6).map((r, i) => (
                  <li key={`${r.o.id}-${i}`} className={`rm-lista-item rm-lista-item--${r.estado}`}>
                    <i className={`rm-punto rm-punto--${r.estado}`} aria-hidden="true" />
                    <span className="rm-lista-texto">{r.o.titulo}</span>
                    <span className="rm-lista-estado">{ESTADO_TEXTO[r.estado]}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="rm-nada">Ningún objetivo cae en este mes. Créalos en la pestaña Objetivos.</p>
          )}
        </article>

        <article className="rm-bloque">
          <h3>Contenido</h3>
          <p className="rm-linea rm-linea--canales">
            {porCanal.map((c) => (
              <span key={c.canal}><i className={`rm-punto rm-punto--${c.canal}`} /> {CANALES[c.canal]} <strong>{c.total}</strong></span>
            ))}
          </p>
          {planPct !== null ? (
            <div className="rm-record">
              <div className="rm-record-linea">
                <span>Plan cumplido</span>
                <strong>{planPct} %</strong>
              </div>
              <div className="rm-record-pista rm-record-pista--contenido"><div style={{ width: `${planPct}%` }} /></div>
            </div>
          ) : (
            <p className="rm-nada">Sin piezas planeadas este mes: planéalas con el ＋ de cada día.</p>
          )}
          {vencidas > 0 && <p className="rm-nada rm-nada--mal">{vencidas} pieza{vencidas === 1 ? "" : "s"} con la fecha pasada sin publicar.</p>}
        </article>
      </div>

      {/* ── Lo que dicen tus datos ── */}
      {ideas.length > 0 && (
        <div className="rm-ideas">
          <h3>Lo que dicen tus datos</h3>
          <ul>
            {ideas.slice(0, 5).map((i, n) => (
              <li key={n}>
                <span className="rm-ideas-emoji" aria-hidden="true">{i.emoji}</span>
                <span>{i.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Kpi({ etiqueta, valor, pie, variacion, tono }: {
  etiqueta: string;
  valor: string;
  pie: string;
  variacion?: { texto: string; sube: boolean } | null;
  tono: "dinero" | "ok" | "contenido" | "animo";
}) {
  return (
    <div className={`rm-kpi rm-kpi--${tono}`}>
      <div className="rm-kpi-cabeza">
        <span className="rm-kpi-etiqueta">{etiqueta}</span>
        {variacion && (
          <span className={`rm-var ${variacion.sube ? "rm-var--sube" : "rm-var--baja"}`} title="Frente al mes anterior">
            {variacion.texto}
          </span>
        )}
      </div>
      <strong className="rm-kpi-valor">{valor}</strong>
      <span className="rm-kpi-pie">{pie}</span>
    </div>
  );
}
