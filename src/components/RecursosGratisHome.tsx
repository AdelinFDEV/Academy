import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpenText, Calculator } from "lucide-react";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";
import { cgFetch } from "@/lib/coingecko";

/**
 * Las dos puertas gratuitas de la portada que no son guías: el diccionario y
 * la calculadora de precio objetivo. Van justo debajo de las guías.
 *
 * Rehecho el 16-11-2026 a petición del admin: la primera versión eran dos
 * tarjetas planas «sin personalidad». Ahora cada lado ENSEÑA su producto en
 * vez de describirlo:
 *  · El diccionario, como una ficha de papel de verdad, con la definición real
 *    de un término sacada de `glosario.ts`, apilada sobre otras dos.
 *  · La calculadora, como un aparato con su pantalla, haciendo una cuenta de
 *    ejemplo con datos en vivo de CoinGecko. Es un ejemplo, no una previsión,
 *    y lo dice. Si CoinGecko no responde, enseña la fórmula.
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
const FRENTE = { slug: "staking", origen: "del inglés stake, «participación»" };
const DETRAS = ["exchange", "fifo"];

const buscar = (slug: string): Termino | undefined => GLOSARIO_CON_PAGINA.find((t) => t.slug === slug);

const CATEGORIA: Record<Termino["category"], string> = {
  "básicos": "Básicos",
  trading: "Trading",
  defi: "DeFi",
  seguridad: "Seguridad",
};

export default function RecursosGratisHome() {
  const total = GLOSARIO_CON_PAGINA.length;
  const frente = buscar(FRENTE.slug);
  const detras = DETRAS.map(buscar).filter((t): t is Termino => !!t);
  const verTambien = (frente?.seeAlso ?? []).map(buscar).filter((t): t is Termino => !!t);
  const letras = new Set(GLOSARIO_CON_PAGINA.map((t) => t.term.charAt(0).toUpperCase()));

  return (
    <section className="rg" aria-labelledby="rg-titulo">
      <div className="rg-fondo" aria-hidden="true">
        <span className="rg-luz rg-luz--oro" />
        <span className="rg-luz rg-luz--cian" />
      </div>

      <div className="rg-inner">
        <header className="rg-cabecera">
          <span className="rg-eyebrow">
            <span className="rg-eyebrow-punto" aria-hidden="true" />
            También gratis, para siempre
          </span>
          <h2 id="rg-titulo" className="rg-titulo">
            Entiende cada palabra. <em>Haz tus propios números.</em>
          </h2>
        </header>

        <div className="rg-rejilla">
          {/* ══ El diccionario ══════════════════════════════════════════ */}
          <div className="rg-dic">
            <span className="rg-dic-marca" aria-hidden="true">A–Z</span>

            <div className="rg-dic-texto">
              <p className="rg-kicker"><BookOpenText size={15} aria-hidden="true" /> Diccionario cripto</p>
              <h3 className="rg-dic-titulo">
                <span className="rg-dic-cifra">{total}</span> términos, explicados para quien empieza
              </h3>
              <p className="rg-texto">
                Cada palabra técnica, en claro. Y las más buscadas, a fondo: con un ejemplo con números, el error que
                más se comete y lo que dice Hacienda en España.
              </p>
              <Link href="/glosario" className="rg-boton rg-boton--oro">
                Abrir el diccionario
                <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
              </Link>
            </div>

            {/* El fichero: dos fichas detrás y la de delante, de verdad. */}
            <div className="rg-fichero">
              {detras.map((t, i) => (
                <span key={t.slug} className={`rg-ficha rg-ficha--detras rg-ficha--${i + 1}`} aria-hidden="true">
                  <span className="rg-ficha-cat">{CATEGORIA[t.category]}</span>
                  <span className="rg-ficha-palabra">{t.term}</span>
                </span>
              ))}

              {frente && (
                <article className="rg-ficha rg-ficha--frente">
                  <span className="rg-ficha-cab">
                    <span className="rg-ficha-cat">{CATEGORIA[frente.category]}</span>
                    <span className="rg-ficha-num">Una de {total}</span>
                  </span>
                  <Link href={`/glosario/${frente.slug}`} className="rg-ficha-palabra rg-ficha-palabra--grande">
                    {frente.term}
                  </Link>
                  <span className="rg-ficha-origen">{FRENTE.origen}</span>
                  <p className="rg-ficha-def">{frente.definition}</p>
                  {verTambien.length > 0 && (
                    <span className="rg-ficha-ver">
                      <span className="rg-ficha-ver-tit">Ver también</span>
                      {verTambien.map((t) => (
                        <Link key={t.slug} href={`/glosario/${t.slug}`}>{t.term}</Link>
                      ))}
                    </span>
                  )}
                  <Link href={`/glosario/${frente.slug}`} className="rg-ficha-leer">
                    Leer la ficha entera <ArrowUpRight size={15} strokeWidth={2.4} aria-hidden="true" />
                  </Link>
                </article>
              )}

              <span className="rg-abc" aria-hidden="true">
                {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((l) => (
                  <i key={l} className={letras.has(l) ? "is-on" : undefined}>{l}</i>
                ))}
              </span>
            </div>
          </div>

          {/* ══ La calculadora ══════════════════════════════════════════ */}
          <div className="rg-calc">
            <div className="rg-calc-texto">
              <p className="rg-kicker rg-kicker--cian"><Calculator size={15} aria-hidden="true" /> Calculadora de precio objetivo</p>
              <h3 className="rg-calc-titulo">¿Puede tu moneda llegar a ese precio?</h3>
              <p className="rg-texto">
                Te dice qué capitalización de mercado haría falta y la compara con la de Bitcoin, Ethereum y Solana.
              </p>
            </div>

            <div className="rg-aparato">
              <span className="rg-aparato-cab" aria-hidden="true">
                <span className="rg-aparato-puntos"><i /><i /><i /></span>
                <span>calculadora · ejemplo</span>
              </span>
              <Suspense fallback={<Formula />}>
                <EjemploEnVivo />
              </Suspense>
            </div>

            <Link href="/calculadora" className="rg-boton rg-boton--cian">
              Haz tu cálculo
              <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <p className="rg-nota">Sin cuenta, tres cálculos. Con una cuenta gratuita, los que quieras.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── La pantalla de la calculadora ─────────────────────────────────────── */

/** Lo que se ve si CoinGecko no responde: la cuenta, sin cifras. */
function Formula() {
  return (
    <div className="rg-pantalla rg-pantalla--formula">
      <span className="rg-linea"><small>Precio objetivo</small></span>
      <span className="rg-op" aria-hidden="true">×</span>
      <span className="rg-linea"><small>Monedas en circulación</small></span>
      <span className="rg-op" aria-hidden="true">=</span>
      <span className="rg-linea rg-linea--total"><small>Capitalización que haría falta</small></span>
    </div>
  );
}

type Precio = { usd: number; usd_market_cap: number };

/** Precios y capitalizaciones de BTC, ETH y SOL, con caché de 5 minutos. Null si falla. */
async function mercado(): Promise<Record<"bitcoin" | "ethereum" | "solana", Precio> | null> {
  try {
    const res = await cgFetch("/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_market_cap=true", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const d: unknown = await res.json();
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

/** Un objetivo redondo, unas cinco veces el precio de hoy: 1, 2 o 5 por una potencia de 10. */
function objetivoRedondo(precio: number): number {
  const bruto = precio * 5;
  const escala = 10 ** Math.floor(Math.log10(bruto));
  return [1, 2, 5, 10].map((m) => m * escala).find((v) => v >= bruto) ?? 10 * escala;
}

/** 1,8 billones $ · 92 mil millones $ */
function capital(v: number): string {
  if (v >= 1e12) return `${(v / 1e12).toLocaleString("es-ES", { maximumFractionDigits: 1 })} billones $`;
  return `${(v / 1e9).toLocaleString("es-ES", { maximumFractionDigits: 0 })} mil millones $`;
}

async function EjemploEnVivo() {
  const m = await mercado();
  if (!m) return <Formula />;

  const sol = m.solana;
  const circulacion = sol.usd_market_cap / sol.usd;
  const objetivo = objetivoRedondo(sol.usd);
  const capObjetivo = objetivo * circulacion;
  const veces = capObjetivo / sol.usd_market_cap;
  const max = Math.max(capObjetivo, m.bitcoin.usd_market_cap);
  const ancho = (v: number) => `${Math.max(2, (v / max) * 100).toFixed(1)}%`;

  const barras = [
    { nombre: `Solana a ${objetivo.toLocaleString("es-ES")} $`, valor: capObjetivo, clase: "is-objetivo" },
    { nombre: "Bitcoin hoy", valor: m.bitcoin.usd_market_cap, clase: "" },
    { nombre: "Ethereum hoy", valor: m.ethereum.usd_market_cap, clase: "" },
    { nombre: "Solana hoy", valor: sol.usd_market_cap, clase: "is-hoy" },
  ];

  return (
    <div className="rg-pantalla">
      <span className="rg-pregunta">Si Solana llegara a</span>
      <span className="rg-grande">{objetivo.toLocaleString("es-ES")} $</span>
      <span className="rg-pregunta">su capitalización tendría que ser</span>
      <span className="rg-resultado">{capital(capObjetivo)}</span>
      <span className="rg-veces">
        {veces.toLocaleString("es-ES", { maximumFractionDigits: 1 })} veces la de hoy
      </span>

      <ul className="rg-barras">
        {barras.map((b) => (
          <li key={b.nombre} className={b.clase || undefined}>
            <span className="rg-barra-nombre">{b.nombre}</span>
            <span className="rg-barra-pista"><span className="rg-barra" style={{ width: ancho(b.valor) }} /></span>
            <span className="rg-barra-valor">{capital(b.valor)}</span>
          </li>
        ))}
      </ul>

      <span className="rg-fuente">Datos en vivo de CoinGecko · un ejemplo, no una previsión</span>
    </div>
  );
}
