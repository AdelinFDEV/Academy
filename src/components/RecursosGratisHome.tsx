import { Suspense } from "react";
import Link from "next/link";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";
import { cgFetch } from "@/lib/coingecko";
import Tecla from "@/components/cuaderno/Tecla";
import TarjetaEstudio from "@/components/cuaderno/TarjetaEstudio";
import CalculadoraEscolar, { type Mercado } from "@/components/CalculadoraEscolar";

/**
 * Las dos puertas gratuitas de la portada que no son guías: el diccionario y
 * la calculadora de Predicción de Precio. Van justo debajo de las guías.
 *
 * Estilo «Cuaderno de estudio» (17-11-2026). Cada lado ENSEÑA su producto como
 * un objeto del cuaderno, en vez de describirlo:
 *  · El diccionario (amarillo), como fichas de vocabulario: la de delante se
 *    gira y enseña la definición real de un término sacada de `glosario.ts`;
 *    detrás asoman otras dos.
 *  · La calculadora, como una calculadora de colegio con teclas de verdad:
 *    eliges moneda y cuántas veces su precio, y rehace la cuenta con datos en
 *    vivo de CoinGecko. Es un ejemplo, no una previsión, y lo dice. Si
 *    CoinGecko no responde, enseña la fórmula.
 *
 * Nada de cifras escritas a mano: el número de términos sale del diccionario.
 * El tope de la calculadora está comprobado en `CALCULOS_GRATIS`
 * (`src/app/calculadora/CalculadoraClient.tsx`): solo limita a quien no tiene cuenta.
 */

type Termino = (typeof GLOSARIO_CON_PAGINA)[number];

/**
 * La ficha de delante y las dos de detrás. Fichas DETALLADAS (aún hay fichas
 * cortas), porque el texto promete que las más buscadas van a fondo.
 */
const FRENTE = { slug: "staking", pregunta: "¿Qué es el staking?", origen: "del inglés stake, «participación»" };
const DETRAS = ["exchange", "fifo"];

const buscar = (slug: string): Termino | undefined => GLOSARIO_CON_PAGINA.find((t) => t.slug === slug);

const CATEGORIA: Record<Termino["category"], string> = {
  "básicos": "Básicos",
  trading: "Trading",
  defi: "DeFi",
  seguridad: "Seguridad",
};

/** La definición, partida en su primera frase (la respuesta) y el resto (el matiz). */
function partir(def: string): { respuesta: string; detalle?: string } {
  const corte = def.indexOf(". ");
  if (corte === -1) return { respuesta: def };
  return { respuesta: def.slice(0, corte + 1), detalle: def.slice(corte + 2) };
}

export default function RecursosGratisHome() {
  const total = GLOSARIO_CON_PAGINA.length;
  const frente = buscar(FRENTE.slug);
  const detras = DETRAS.map(buscar).filter((t): t is Termino => !!t);
  const verTambien = (frente?.seeAlso ?? []).map(buscar).filter((t): t is Termino => !!t);
  const letras = new Set(GLOSARIO_CON_PAGINA.map((t) => t.term.charAt(0).toUpperCase()));
  const def = frente ? partir(frente.definition) : null;

  return (
    <section id="diccionario" className="rg" aria-labelledby="rg-titulo">
      <div className="rg-inner">
        <header className="rg-cabecera">
          <p className="rg-nota">También gratis, para siempre</p>
          <h2 id="rg-titulo" className="rg-titulo">
            Entiende cada palabra. <span className="fluor">Haz tus propios números.</span>
          </h2>
        </header>

        <div className="rg-rejilla">
          {/* ══ El diccionario ══════════════════════════════════════════ */}
          <div className="rg-lado rg-dic">
            <div className="rg-lado-texto">
              <span className="rg-etiqueta rg-etiqueta--amarillo">Diccionario cripto</span>
              <h3 className="rg-lado-titulo">
                <span className="rg-cifra">{total}</span> términos, explicados para quien empieza
              </h3>
              <p className="rg-texto">
                Cada palabra técnica, en claro. Y las más buscadas, a fondo: con un ejemplo con números, el error que
                más se comete y lo que dice Hacienda en España.
              </p>
            </div>

            {/* El fichero: dos fichas detrás y la de delante, que se gira. */}
            <div className="rg-fichero">
              {detras.map((t, i) => (
                <span key={t.slug} className={`rg-ficha rg-ficha--${i + 1}`} aria-hidden="true">
                  <span className="rg-ficha-cat">{CATEGORIA[t.category]}</span>
                  <span className="rg-ficha-palabra">{t.term}</span>
                </span>
              ))}
              {frente && def && (
                <TarjetaEstudio
                  className="rg-ficha-frente"
                  color="amarillo"
                  tema={`${CATEGORIA[frente.category]} · ${FRENTE.origen}`}
                  pregunta={FRENTE.pregunta}
                  respuesta={def.respuesta}
                  detalle={def.detalle}
                />
              )}
            </div>

            {frente && (
              <div className="rg-dic-pie">
                <Tecla href={`/glosario/${frente.slug}`} color="blanca" tamano="peq">
                  Leer la ficha entera
                </Tecla>
                {verTambien.length > 0 && (
                  <p className="rg-ver">
                    <span className="rg-ver-tit">Ver también:</span>{" "}
                    {verTambien.map((t, i) => (
                      <span key={t.slug}>
                        {i > 0 && " · "}
                        <Link href={`/glosario/${t.slug}`}>{t.term}</Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}

            <span className="rg-abc" aria-hidden="true">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                <i key={l} className={letras.has(l) ? "is-on" : undefined}>{l}</i>
              ))}
            </span>

            <Tecla href="/glosario" color="amarillo" className="rg-cta">
              Abrir el diccionario
            </Tecla>
          </div>

          {/* ══ La calculadora ══════════════════════════════════════════ */}
          <div className="rg-lado rg-calc">
            <div className="rg-lado-texto">
              <span className="rg-etiqueta rg-etiqueta--naranja">Predicción de Precio</span>
              <h3 className="rg-lado-titulo">¿Puede tu moneda llegar a ese precio?</h3>
              <p className="rg-texto">
                Te dice qué capitalización de mercado haría falta y la compara con la de Bitcoin, Ethereum y Solana.
              </p>
            </div>

            <Suspense fallback={<Formula />}>
              <EjemploEnVivo />
            </Suspense>

            <p className="rg-nota-mano">Sin cuenta, tres cálculos. Con una cuenta gratuita, los que quieras.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── La calculadora ─────────────────────────────────────────────────────── */

/** Lo que se ve si CoinGecko no responde (o mientras llega): la cuenta, sin cifras. */
function Formula() {
  return (
    <div className="rg-calc-objeto">
      <div className="rg-calculadora">
        <div className="rg-calc-marca" aria-hidden="true">
          <span>Adelin · calc</span>
          <span className="rg-calc-solar"><i /><i /><i /><i /></span>
        </div>
        <div className="rg-lcd rg-lcd--formula">
          <span className="rg-lcd-sub">Precio objetivo</span>
          <span className="rg-lcd-op" aria-hidden="true">×</span>
          <span className="rg-lcd-sub">Monedas en circulación</span>
          <span className="rg-lcd-op" aria-hidden="true">=</span>
          <span className="rg-lcd-linea"><b>Capitalización que haría falta</b></span>
        </div>
        <div className="rg-teclado">
          <Tecla href="/calculadora" ancho className="rg-igual">
            = Haz tu cálculo
          </Tecla>
        </div>
      </div>
    </div>
  );
}

/** Precios y capitalizaciones de BTC, ETH y SOL, con caché de 5 minutos. Null si falla. */
async function mercado(): Promise<Mercado | null> {
  try {
    const res = await cgFetch("/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_market_cap=true", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const d: unknown = await res.json();
    type Precio = Mercado["bitcoin"];
    const ok = (x: unknown): x is Precio =>
      typeof x === "object" && x !== null &&
      typeof (x as Precio).usd === "number" && (x as Precio).usd > 0 &&
      typeof (x as Precio).usd_market_cap === "number" && (x as Precio).usd_market_cap > 0;
    if (typeof d !== "object" || d === null) return null;
    const r = d as Record<string, unknown>;
    if (!ok(r.bitcoin) || !ok(r.ethereum) || !ok(r.solana)) return null;
    return { bitcoin: r.bitcoin, ethereum: r.ethereum, solana: r.solana };
  } catch {
    return null;
  }
}

async function EjemploEnVivo() {
  const m = await mercado();
  if (!m) return <Formula />;
  return <CalculadoraEscolar mercado={m} />;
}
