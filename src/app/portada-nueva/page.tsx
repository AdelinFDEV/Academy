import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Play, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SiteNav from "@/components/SiteNav";
import Footer from "@/components/Footer";
import GuiaPortada from "@/components/GuiaPortada";
import NovaMini from "@/components/NovaMini";
import Firma from "@/components/foro/Firma";
import { InstagramIcon } from "@/components/SocialLinks";
import { resumenPortfolioPublico } from "@/lib/portfolio-publico";
import { cursosPublicados } from "@/lib/cursos";
import { guiasVisiblesRecientes } from "@/lib/guiasVisibles";
import { GLOSARIO } from "@/lib/glosario";
import { detalleDe, herramienta } from "@/lib/herramientas";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import { PREGUNTAS_FRECUENTES } from "@/lib/preguntas-frecuentes";
import { INSTAGRAM_DM_URL, YOUTUBE_URL } from "@/lib/contacto";
import { AVATAR_ADMIN } from "@/lib/perfilPublico";
import { getLatestVideos } from "@/lib/youtube";
import { ultimosHilos } from "@/lib/foro/datos/hilos";
import { foroALaVista } from "@/lib/foro/permisos";
import "@/app/foro/foro.css";
import "./portada-nueva.css";

/**
 * /portada-nueva · PRUEBA de una portada rehecha de cero (13-11-2026).
 *
 * Pedida por el admin: el mismo contenido que la portada de hoy (`/`), con cada
 * sección diseñada desde cero en negro puro y naranja de Bitcoin, con toques
 * de blanco y de violeta. No sustituye a la portada: vive aparte para poder
 * compararlas, y no se indexa ni está en el sitemap.
 *
 * Todo lo que dice sale de su fuente, igual que en la portada real: la cartera
 * de `resumenPortfolioPublico()`, los cursos de Supabase, las guías de
 * `guides.ts`, las preguntas de `preguntas-frecuentes.ts`. El panel del Diario
 * es un dibujo y lo dice («Ejemplo»).
 *
 * Si se da por buena, pasa a ser `/` y se borra la portada anterior con su CSS.
 * Si no, se borra esta carpeta entera.
 */
export const metadata: Metadata = {
  title: "Portada nueva (prueba)",
  robots: { index: false, follow: false },
};

const PRECIO = precioEur(PREMIUM_PRICE_EUR);
const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1).replace(".", ",")} %`;
const DIA = 24 * 60 * 60 * 1000;

function hace(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const dias = Math.floor((Date.now() - t) / DIA);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "Ayer";
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 28) return dias < 14 ? "Hace 1 semana" : `Hace ${Math.floor(dias / 7)} semanas`;
  return new Date(t).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Bucharest" });
}

/** La cabecera de cada sección: su número, su nombre y una raya que llega al borde. */
function Cabecera({ n, nombre, children, accion }: { n: string; nombre: string; children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <header className="pn-cab">
      <p className="pn-cab-indice"><span>{n}</span>{nombre}<i aria-hidden="true" /></p>
      <div className="pn-cab-fila">
        <h2 className="pn-titulo">{children}</h2>
        {accion}
      </div>
    </header>
  );
}

function Enlace({ href, children, fuera = false }: { href: string; children: React.ReactNode; fuera?: boolean }) {
  const flecha = <span className="pn-enlace-flecha" aria-hidden="true"><ArrowUpRight size={15} strokeWidth={2.4} /></span>;
  return fuera
    ? <a href={href} target="_blank" rel="noopener noreferrer" className="pn-enlace">{children}{flecha}</a>
    : <Link href={href} className="pn-enlace">{children}{flecha}</Link>;
}

/* ── Foro ─────────────────────────────────────────────────────────────── */
async function Foro({ conSesion }: { conSesion: boolean }) {
  if (!(await foroALaVista(conSesion))) return null;
  const hilos = await ultimosHilos(3).catch(() => []);
  if (hilos.length === 0) return null;

  return (
    <section className="pn-seccion" aria-labelledby="pn-foro">
      <Cabecera n="02" nombre="Comunidad" accion={<Enlace href="/foro">Ver el foro</Enlace>}>
        <span id="pn-foro">Lo último que se ha <em>preguntado</em></span>
      </Cabecera>

      <div className="pn-foro">
        <ol className="pn-hilos">
          {hilos.map((h) => (
            <li key={h.id}>
              <Link href={`/foro/${h.id}-${h.slug}`} className="pn-hilo">
                <span className="pn-hilo-cat">{h.categoria.nombre}{h.resuelto && <b><Check size={11} strokeWidth={3} aria-hidden="true" /> Resuelta</b>}</span>
                <span className="pn-hilo-titulo">{h.titulo}</span>
                {h.extracto && <span className="pn-hilo-extracto">{h.extracto}</span>}
                <span className="pn-hilo-pie fo-pagina">
                  <Firma autor={h.autor} fecha={h.fecha} compacta />
                  <span className="pn-hilo-n"><b>{h.respuestas}</b> {h.respuestas === 1 ? "respuesta" : "respuestas"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <aside className="pn-invita" aria-label="Participa en el foro">
          <span className="pn-invita-borde" aria-hidden="true" />
          {/* Una conversación dibujada, en bucle. Son rayas, no texto: es un adorno. */}
          <div className="pn-chat" aria-hidden="true">
            <div className="pn-burbuja pn-burbuja--a"><i /><span><b /><b /></span></div>
            <div className="pn-burbuja pn-burbuja--b"><span><b /><b /><b /></span><i /></div>
            <div className="pn-burbuja pn-burbuja--c"><i /><span className="pn-escribe"><em /><em /><em /></span></div>
          </div>
          <p className="pn-invita-titulo">¿Se te ha quedado <em>una duda</em>?</p>
          <p className="pn-invita-texto">Pregunta lo que no te haya quedado claro de una guía o de un curso, y ayuda a quien viene detrás.</p>
          <div className="pn-invita-acciones">
            <Link href="/foro/preguntar" className="pn-boton pn-boton--blanco">Hacer una pregunta <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" /></Link>
            <Link href="/foro/ranking" className="pn-invita-enlace">Ver el ranking</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

/* ── Vídeos ───────────────────────────────────────────────────────────── */
async function Videos() {
  const videos = await getLatestVideos(3);
  if (videos.length === 0) return null;
  const [principal, ...resto] = videos;

  return (
    <section className="pn-seccion" aria-labelledby="pn-videos">
      <Cabecera n="03" nombre="YouTube" accion={<Enlace href={YOUTUBE_URL} fuera>Ver el canal</Enlace>}>
        <span id="pn-videos">Lo último del <em>canal</em></span>
      </Cabecera>

      <div className="pn-videos">
        <a href={principal.url} target="_blank" rel="noopener noreferrer" className="pn-video-grande">
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube */}
          <img src={`https://i.ytimg.com/vi/${principal.id}/sddefault.jpg`} alt="" loading="lazy" />
          <span className="pn-video-velo" aria-hidden="true" />
          <span className="pn-video-play" aria-hidden="true"><Play size={22} fill="currentColor" /></span>
          <span className="pn-video-texto">
            <span className="pn-video-meta"><b>Último vídeo</b>{hace(principal.publishedAt)}</span>
            <span className="pn-video-titulo">{principal.title}</span>
          </span>
        </a>

        <ol className="pn-video-lista">
          {resto.map((v, i) => (
            <li key={v.id}>
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="pn-video-fila">
                <span className="pn-video-num" aria-hidden="true">{String(i + 2).padStart(2, "0")}</span>
                <span className="pn-video-mini">
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura de YouTube */}
                  <img src={v.thumbnail} alt="" loading="lazy" />
                </span>
                <span className="pn-video-fila-texto">
                  <small>{hace(v.publishedAt)}</small>
                  <strong>{v.title}</strong>
                </span>
                <ArrowUpRight className="pn-fila-flecha" size={18} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export default async function PortadaNuevaPage() {
  const supabase = await createClient();
  const [{ data: { user } }, cartera, cursos, guias] = await Promise.all([
    supabase.auth.getUser(),
    resumenPortfolioPublico(),
    cursosPublicados(),
    guiasVisiblesRecientes(),
  ]);

  const perfil = user
    ? (await supabase.from("profiles").select("role, full_name").eq("id", user.id).single()).data
    : null;
  const isPremium = perfil?.role === "premium" || perfil?.role === "admin";
  const isAdmin = perfil?.role === "admin";
  const userName = perfil?.full_name || user?.email?.split("@")[0] || "";

  const diario = herramienta("diario");
  const portfolio = herramienta("portfolio");
  const aula = herramienta("cursos");
  const destino = (h: typeof diario) => (isPremium && h.premiumHref ? h.premiumHref : detalleDe(h));

  const lecciones = cursos.reduce((t, c) => t + c.lecciones, 0);
  const minutos = cursos.reduce((t, c) => t + c.minutos, 0);
  const horas = minutos >= 60 ? `${Math.round(minutos / 60)} h` : `${minutos} min`;
  const preguntas = PREGUNTAS_FRECUENTES.filter((p) => p.portada);
  const [destacada, ...otras] = guias;
  const cinta = [...guias.map((g) => g.shortTitle), ...cursos.map((c) => c.titulo)];

  // Los dos botones del hero dependen de quién mira.
  const principal = isPremium
    ? { href: "/dashboard", texto: "Ir a mi dashboard" }
    : user
      ? { href: "/api/checkout", texto: "Hazte Premium" }
      : { href: "/register", texto: "Crear cuenta gratis" };
  const secundario = isPremium ? { href: "/guias", texto: "Ver las guías" } : { href: "/premium", texto: "Ver qué incluye Premium" };

  const PIEZAS = [
    {
      n: "01", h: diario, nombre: "Diario de Trading",
      frase: "Deja de operar de memoria.",
      texto: "Apuntas cada operación en un minuto y el Diario hace las cuentas. Nova lee tus datos y te avisa de lo que repites.",
      datos: ["10 estadísticas", "Calendario", "Emociones", "Privado"],
    },
    {
      n: "02", h: portfolio, nombre: "Portfolio Adelin",
      frase: "Mis compras reales, también las que pierden.",
      texto: "La cartera spot y el DCA de bitcoin, con el precio de entrada de cada compra y su rentabilidad en vivo.",
      datos: cartera
        ? [`${pct(cartera.rentabilidadPct)} en spot`, `${cartera.posiciones} posiciones`, ...(cartera.dca ? [`${pct(cartera.dca.rentabilidadPct)} DCA`] : [])]
        : ["Precios en vivo", "Spot y DCA"],
    },
    {
      n: "03", h: aula, nombre: "Cursos",
      frase: "Aprende con examen y certificado.",
      texto: "Por módulos, con examen en cada uno y certificado verificable al aprobar el final.",
      datos: cursos.length > 0 ? [`${cursos.length} cursos`, `${lecciones} lecciones`, `${horas} de contenido`] : ["Con certificado"],
    },
  ];

  return (
    <div className="pn">
      <SiteNav user={!!user} isPremium={isPremium} userName={userName} isAdmin={isAdmin} />

      <p className="pn-prueba">Estás viendo una <strong>prueba de diseño</strong>. La portada de siempre sigue en <Link href="/">la página principal</Link>.</p>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pn-hero" aria-labelledby="pn-h1">
        <span className="pn-hero-luz pn-hero-luz--naranja" aria-hidden="true" />
        <span className="pn-hero-luz pn-hero-luz--violeta" aria-hidden="true" />

        <div className="pn-hero-texto">
          <p className="pn-sello"><span aria-hidden="true" /> Academia cripto en español</p>
          <h1 id="pn-h1" className="pn-h1">
            Opera con <em>método</em>.
            <span>Aprende con certificado.</span>
          </h1>
          <p className="pn-hero-lead">
            Guías gratuitas para entender, cursos con examen para aprender de verdad y un diario que te avisa de lo
            que se te escapa.
          </p>
          <div className="pn-hero-acciones">
            <Link href={principal.href} prefetch={principal.href.startsWith("/api") ? false : undefined} className="pn-boton pn-boton--naranja">
              {principal.texto} <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </Link>
            <Link href={secundario.href} className="pn-boton pn-boton--linea">{secundario.texto}</Link>
          </div>
          {!isPremium && <p className="pn-hero-nota">Las guías son gratis y sin tarjeta. Premium, {PRECIO} al mes y sin permanencia.</p>}
        </div>

        {/* La mesa: tres piezas apiladas, con cifras de verdad. */}
        <div className="pn-mesa" aria-label="Las tres piezas de Premium">
          <Link href={destino(portfolio)} className="pn-ficha pn-ficha--cartera">
            <span className="pn-ficha-cab"><span>Portfolio Adelin</span><b className="pn-vivo"><i /> En directo</b></span>
            <span className="pn-ficha-cifra">{cartera ? pct(cartera.rentabilidadPct) : "En vivo"}</span>
            <span className="pn-ficha-pie">
              {cartera ? `Rentabilidad real de la cartera spot${cartera.desdeAnio ? `, desde ${cartera.desdeAnio}` : ""}` : "Precio de entrada y rentabilidad de cada compra"}
            </span>
          </Link>

          <Link href={destino(diario)} className="pn-ficha pn-ficha--diario">
            <span className="pn-ficha-cab"><span>Diario de Trading</span><b className="pn-ejemplo">Ejemplo</b></span>
            <span className="pn-kpis" aria-hidden="true">
              <span><small>Win rate</small><strong>58 %</strong></span>
              <span><small>Ratio R</small><strong>1,8</strong></span>
              <span><small>P&amp;L</small><strong className="es-verde">+12,4 %</strong></span>
            </span>
            <span className="pn-nova">
              <NovaMini size={28} />
              <span><strong>Nova</strong> · Cierras las ganadoras antes de tiempo.</span>
            </span>
          </Link>

          <Link href={destino(aula)} className="pn-ficha pn-ficha--cursos">
            <span className="pn-ficha-cab"><span>Cursos</span><b>Con certificado</b></span>
            <span className="pn-ficha-fila">
              <span><strong>{cursos.length}</strong><small>cursos</small></span>
              <span><strong>{lecciones}</strong><small>lecciones</small></span>
              <span><strong>{horas}</strong><small>de contenido</small></span>
            </span>
          </Link>
        </div>
      </section>

      {/* ── La cinta: de qué se habla aquí ───────────────────────────── */}
      <div className="pn-cinta" aria-hidden="true">
        <div className="pn-cinta-pista">
          {[...cinta, ...cinta].map((t, i) => <span key={i}>{t}<i /></span>)}
        </div>
      </div>

      {/* ── Las cifras ───────────────────────────────────────────────── */}
      <dl className="pn-cifras">
        <div><dt>Guías gratuitas</dt><dd>{guias.length}</dd></div>
        <div><dt>Cursos con certificado</dt><dd>{cursos.length}</dd></div>
        <div><dt>Lecciones</dt><dd>{lecciones}</dd></div>
        <div><dt>Términos en el diccionario</dt><dd>{GLOSARIO.length}</dd></div>
      </dl>

      {/* ── 01 · Guías ───────────────────────────────────────────────── */}
      {destacada && (
        <section className="pn-seccion" id="guias" aria-labelledby="pn-guias">
          <Cabecera n="01" nombre="Guías gratuitas" accion={<Enlace href="/guias">Todas las guías</Enlace>}>
            <span id="pn-guias">Empieza por <em>entender</em></span>
          </Cabecera>

          <div className="pn-guias">
            <Link href={`/guias/${destacada.slug}`} className="pn-guia-grande">
              <GuiaPortada guia={destacada} className="pn-guia-foto" sizes="(max-width: 900px) 100vw, 560px" />
              <span className="pn-guia-cuerpo">
                <span className="pn-guia-meta"><b>La más reciente</b>{destacada.difficulty} · {destacada.readTime}</span>
                <span className="pn-guia-titulo">{destacada.title}</span>
                <span className="pn-guia-texto">{destacada.description}</span>
                <span className="pn-guia-leer">Leer la guía <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" /></span>
              </span>
            </Link>

            <ol className="pn-guia-lista">
              {otras.slice(0, 5).map((g, i) => (
                <li key={g.slug}>
                  <Link href={`/guias/${g.slug}`} className="pn-guia-fila">
                    <span className="pn-guia-num" aria-hidden="true">{String(i + 2).padStart(2, "0")}</span>
                    <span className="pn-guia-fila-texto">
                      <strong>{g.title}</strong>
                      <small>{g.difficulty} · {g.readTime}</small>
                    </span>
                    <ArrowUpRight className="pn-fila-flecha" size={18} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ── 02 · Foro ────────────────────────────────────────────────── */}
      <Foro conSesion={!!user} />

      {/* ── 03 · Vídeos ──────────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <Videos />
      </Suspense>

      {/* ── 04 · Premium ─────────────────────────────────────────────── */}
      <section className="pn-seccion" aria-labelledby="pn-premium">
        <Cabecera n="04" nombre={isPremium ? "Tu Premium" : "Premium"}>
          <span id="pn-premium">Una suscripción, <em>las tres piezas</em></span>
        </Cabecera>

        <div className={`pn-premium${isPremium ? " pn-premium--dentro" : ""}`}>
          <ol className="pn-piezas">
            {PIEZAS.map((p) => (
              <li key={p.n}>
                <Link href={destino(p.h)} className="pn-pieza">
                  <span className="pn-pieza-num" aria-hidden="true">{p.n}</span>
                  <span className="pn-pieza-cuerpo">
                    <span className="pn-pieza-nombre">{p.nombre}</span>
                    <span className="pn-pieza-frase">{p.frase}</span>
                    <span className="pn-pieza-texto">{p.texto}</span>
                    <span className="pn-pieza-datos">{p.datos.map((d) => <span key={d}>{d}</span>)}</span>
                  </span>
                  <span className="pn-pieza-ir" aria-hidden="true"><ArrowUpRight size={20} /></span>
                </Link>
              </li>
            ))}
          </ol>

          {!isPremium && (
            <aside className="pn-oferta" aria-label="Premium">
              <span className="pn-oferta-borde" aria-hidden="true" />
              <p className="pn-oferta-plan">Premium</p>
              <p className="pn-oferta-precio">{PRECIO}<small>/mes</small></p>
              <p className="pn-oferta-nota">Sin permanencia. El precio se te queda fijado.</p>
              <ul className="pn-oferta-lista">
                {["Diario de Trading con Nova", "Portfolio Adelin: spot y DCA de bitcoin", "Todos los cursos, con examen y certificado", "Insignia de Miembro Fundador", "Todo lo que se añada, sin pagar más"].map((t) => (
                  <li key={t}><Check size={15} strokeWidth={2.8} aria-hidden="true" /> {t}</li>
                ))}
              </ul>
              <Link href="/api/checkout" prefetch={false} className="pn-boton pn-boton--naranja pn-boton--ancho">
                Hazte Premium <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
              </Link>
              <p className="pn-oferta-pie">Pago seguro con Stripe · Acceso inmediato</p>
            </aside>
          )}
        </div>

        <ul className="pn-gratis">
          <li className="pn-gratis-titulo"><b>Gratis</b> Y esto, para todo el mundo</li>
          <li><Link href="/guias">Guías interactivas <ArrowUpRight size={14} aria-hidden="true" /></Link></li>
          <li><Link href="/glosario">Diccionario cripto <ArrowUpRight size={14} aria-hidden="true" /></Link></li>
          <li><Link href="/calculadora">Predicción de Precio <ArrowUpRight size={14} aria-hidden="true" /></Link></li>
          <li><Link href="/logros">Logros y rachas <ArrowUpRight size={14} aria-hidden="true" /></Link></li>
        </ul>
      </section>

      {/* ── 05 · Dudas ───────────────────────────────────────────────── */}
      <section className="pn-seccion" id="preguntas" aria-labelledby="pn-dudas">
        <Cabecera n="05" nombre="Dudas">
          <span id="pn-dudas">Lo que más me <em>preguntan</em></span>
        </Cabecera>

        <div className="pn-dudas">
          <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" className="pn-contacto">
            {/* eslint-disable-next-line @next/next/no-img-element -- estático, 256 px, ya optimizado */}
            <img src={AVATAR_ADMIN.src ?? ""} alt="" width={72} height={72} />
            <span className="pn-contacto-texto">
              <strong>¿La tuya no está?</strong>
              <span>Escríbeme. Te contesto yo, de tú a tú.</span>
            </span>
            <span className="pn-boton pn-boton--blanco pn-boton--ancho"><InstagramIcon size={17} /> Escríbeme por Instagram</span>
          </a>

          <div className="pn-preguntas">
            {preguntas.map((p, i) => (
              <details key={p.q} className="pn-pregunta" open={i === 0}>
                <summary>
                  <span className="pn-pregunta-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pn-pregunta-q">{p.q}</span>
                  <span className="pn-pregunta-mas" aria-hidden="true"><Plus size={18} /></span>
                </summary>
                <p>{p.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
