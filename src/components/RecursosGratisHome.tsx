import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";
import Anotacion from "@/components/cuaderno/Anotacion";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
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
 * Rediseño del 18-11-2026 (pedido por el admin: «se ve plano y con exceso de
 * información»; la primera versión, sin cajas, quedó «suelta»): UNA HOJA DE
 * CUADERNO con las dos herramientas dentro. La calculadora, protagonista, en
 * la parte ancha (el tique de la comparación, impreso a su lado); el
 * diccionario, la herramienta pequeña, en la parte estrecha tras una línea
 * discontinua, como una hoja doblada. En cada zona, lo esencial (etiqueta,
 * título y una frase), su objeto y una sola tecla con una nota a mano; las dos
 * zonas comparten esas tres filas (subgrid). Fuera «Leer la ficha entera»,
 * «Ver también» y la fila de la A a la Z: viven en la página del diccionario.
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
// «Market cap» desde el 18-11-2026: la de staking no cabía al girarla. Esta es
// de las fichas detalladas con la definición más corta, y habla de lo mismo
// que la calculadora de al lado: la capitalización.
const FRENTE = { slug: "market-cap", pregunta: "¿Qué es el market cap?", origen: "del inglés market capitalization" };
const DETRAS = ["exchange", "fifo"];

const buscar = (slug: string): Termino | undefined => GLOSARIO_CON_PAGINA.find((t) => t.slug === slug);

const CATEGORIA: Record<Termino["category"], string> = {
  "básicos": "Básicos",
  trading: "Trading",
  defi: "DeFi",
  seguridad: "Seguridad",
};

/**
 * La respuesta con dos pesos (18-11-2026, pedido por el admin: «no entera en
 * negrita»): si empieza por «Palabra: …», la palabra en la letra de los
 * titulares y lo demás en letra de texto.
 */
function respuestaConEstilo(texto: string) {
  const dos = texto.indexOf(": ");
  if (dos === -1 || dos > 40) return texto;
  return (
    <>
      <strong className="rg-def-clave">{texto.slice(0, dos + 1)}</strong>{" "}
      <span className="rg-def-resto">{texto.slice(dos + 2)}</span>
    </>
  );
}

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
  const def = frente ? partir(frente.definition) : null;

  return (
    <section id="diccionario" className="rg" aria-labelledby="rg-titulo">
      <div className="rg-inner">
        <header className="rg-cabecera">
          <h2 id="rg-titulo" className="rg-titulo">
            <span className="rg-titulo-mano">Entiende</span> cada palabra. Haz tus{" "}
            <Anotacion tipo="underline" color="var(--amarillo)" grosor={4} retraso={300}>propios números</Anotacion>.
          </h2>
        </header>

        <div className="rg-hoja">
          {/* ══ La calculadora: la protagonista ════════════════════════ */}
          <div className="rg-zona rg-calc">
            <div className="rg-lado-texto">
              <span className="rg-etiqueta rg-etiqueta--naranja">Predicción de Precio</span>
              <h3 className="rg-lado-titulo">¿Puede tu moneda llegar a ese precio?</h3>
              <p className="rg-texto">Qué capitalización haría falta, comparada con Bitcoin, Ethereum y Solana.</p>
            </div>

            <div className="rg-objeto">
              {/* Garabatos de fondo: cuentas a mano que no significan nada, como
                  los apuntes de un margen (pedido por el admin el 18-11-2026). */}
              <div className="rg-formulas" aria-hidden="true">
                <span className="rg-formula rg-formula--1">∫₀^∞ (P·S) ÷ √x² dx</span>
                <span className="rg-formula rg-formula--2">x = −b ± √(b² − 4ac) / 2a</span>
                <span className="rg-formula rg-formula--3">Σ mc² ÷ π ≈ 3,1416</span>
                <span className="rg-formula rg-formula--4">∂V/∂t = λ·e^(−kt)</span>
              </div>
              <Suspense fallback={<Formula />}>
                <EjemploEnVivo />
              </Suspense>
            </div>

            {/* Sin tecla propia: la de la calculadora, «= Haz tu cálculo», ya
                lleva a la herramienta (pedido por el admin el 18-11-2026). */}
          </div>

          {/* ══ El diccionario: la herramienta pequeña ══════════════════ */}
          <div className="rg-zona rg-dic">
            <div className="rg-lado-texto">
              <span className="rg-etiqueta rg-etiqueta--amarillo">Diccionario cripto</span>
              <h3 className="rg-lado-titulo">
                <span className="rg-cifra">{total}</span> términos, en claro
              </h3>
              <p className="rg-texto">Cada palabra técnica, para quien empieza. Y las más buscadas, a fondo.</p>
            </div>

            {/* El fichero: dos fichas detrás y la de delante, que se gira. */}
            <div className="rg-objeto rg-fichero">
              {/* La invitación, encima de la ficha: una nota a mano con una
                  flecha que baja hacia ella (18-11-2026). */}
              <span className="rg-gira" aria-hidden="true">
                ¡dale la vuelta!
                <SimboloEstudio tipo="flecha" color="naranja" giro={58} tamano={40} semilla={6} retraso={500} className="rg-gira-flecha" />
              </span>
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
                  respuesta={respuestaConEstilo(def.respuesta)}
                  detalle={def.detalle}
                />
              )}
            </div>

            <div className="rg-pie">
              <Tecla href="/glosario" color="amarillo" className="rg-cta">
                Abrir el diccionario
                <ArrowRight size={18} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
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
