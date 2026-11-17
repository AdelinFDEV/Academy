"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookA, BookOpenText, Crown, LayoutDashboard, LogOut, Shield, UserRound, type LucideIcon, MessagesSquare } from "lucide-react";
import LogoutButton from "./LogoutButton";
import AvatarUsuario from "./AvatarUsuario";
import GuideSearch from "./GuideSearch";
import { destinoPorRuta, herramienta } from "@/lib/herramientas";
import { sonar } from "@/lib/sonidos";
import { INSTAGRAM_DM_URL, YOUTUBE_URL } from "@/lib/contacto";
import { InstagramIcon } from "./SocialLinks";
import Tecla from "./cuaderno/Tecla";
import InterruptorSonido from "./cuaderno/InterruptorSonido";
import CoheteGarabato from "./MenuGarabatos";
import "./menu-movil.css";

interface Props {
  user: boolean;
  isPremium?: boolean;
  userName?: string;
  isAdmin?: boolean;
  /** La foto que eligió el usuario en «Mi perfil»; sin ella, su inicial. */
  avatar?: string | null;
  /** El foro existe para quien mira (lo decide `SiteNav` en el servidor). */
  foro?: boolean;
  /** El precio de Premium, ya formateado («19,99€»). Llega del servidor
   *  (`SiteNav`, de `@/lib/stripe`): este componente es de cliente y no puede
   *  importarlo, y escribirlo a mano aquí era una segunda copia que olvidar. */
  precio: string;
}

/** El color de cada sección (ESTILO.md, «Cada sección, su color»). */
type Tono = "naranja" | "azul" | "menta" | "lila" | "amarillo" | "coral" | "cielo";

type Entrada = {
  id: string;
  ruta: string;
  label: string;
  /** Una línea: qué es, no un eslogan. */
  linea: string;
  icon: LucideIcon;
  tono: Tono;
};

/**
 * Lo que va en el menú, en dos grupos: lo que se paga y lo que se aprende
 * gratis. Las herramientas toman icono y nombre del catálogo
 * (`@/lib/herramientas`, fuente única); Guías y Diccionario no son
 * herramientas y se declaran aquí. El color es el de su sección en el estilo
 * «Cuaderno de estudio» (ESTILO.md): Diario azul, Portfolio menta, Cursos
 * lila, Guías cielo, Diccionario y Logros amarillo, Foro coral; la Predicción
 * de Precio, sin sección propia en el mapa, lleva el naranja de la marca.
 */
function deCatalogo(id: string, ruta: string, linea: string, tono: Tono): Entrada {
  const h = herramienta(id);
  return { id, ruta, label: h.label, linea, icon: h.icon, tono };
}

const PREMIUM: Entrada[] = [
  deCatalogo("diario", "/dashboard/trading", "Cada operación registrada y medida", "azul"),
  deCatalogo("portfolio", "/portfolio", "Mis compras reales, al momento", "menta"),
  deCatalogo("cursos", "/cursos", "Por módulos, con examen y certificado", "lila"),
];

const GRATIS: Entrada[] = [
  { id: "guias", ruta: "/guias", label: "Guías interactivas", linea: "Criptomonedas, explicadas a fondo", icon: BookOpenText, tono: "cielo" },
  { id: "glosario", ruta: "/glosario", label: "Diccionario cripto", linea: "El vocabulario, en cristiano", icon: BookA, tono: "amarillo" },
  deCatalogo("prediccion", "/calculadora", "¿Qué market cap necesita tu token?", "naranja"),
  deCatalogo("logros", "/logros", "Insignias y rachas de tu progreso", "amarillo"),
];

/**
 * El foro, en la columna de lo gratuito: leerlo es libre. No sale del
 * catálogo de herramientas porque no es una herramienta, igual que las guías
 * y el diccionario. Solo se añade a la lista si el foro existe para quien mira.
 */
const FORO: Entrada = { id: "foro", ruta: "/foro", label: "Foro", linea: "Preguntas y respuestas de la comunidad", icon: MessagesSquare, tono: "coral" };

/**
 * El nombre corto de cada tecla, para el móvil (17-11-2026, pedido por el
 * admin): una palabra cabe en una línea, el menú gana alto y los iconos pueden
 * crecer. En el ordenador sale el nombre completo (menu-movil.css).
 */
const NOMBRE_CORTO: Record<string, string> = {
  diario: "Diario",
  portfolio: "Portfolio",
  cursos: "Cursos",
  guias: "Guías",
  glosario: "Diccionario",
  prediccion: "Predicción",
  logros: "Logros",
  foro: "Foro",
};

/** Las entradas que no salen del catálogo: su ruta es siempre la misma. */
const FUERA_DEL_CATALOGO = new Set(["guias", "glosario", "foro"]);

/**
 * El menú de la web, a pantalla completa. Rehecho desde cero el 31-10-2026 y
 * pasado al estilo «Cuaderno de estudio» el 17-11-2026 (CSS en
 * `menu-movil.css`): fondo lavanda y cada destino una fila-tecla de papel con
 * el color de su sección, que se hunde al pulsarla.
 *
 * Dos columnas de destinos —lo de pago y lo gratuito— y un panel lateral con
 * la cuenta y, a quien no lo tiene, Premium una sola vez. En el móvil los
 * destinos van en teclas de tres en fondo (sin la línea de explicación) para
 * que el menú quepa en la pantalla, y el panel de cuenta queda al final.
 *
 * Abrir y cerrar tienen su animación (17-11-2026, pedida por el admin: «más
 * personalidad»): la hoja se despliega en círculo desde el botón del menú,
 * las filas se reparten como tarjetas sobre la mesa, cada icono salta y las
 * notas a mano se escriben. Al cerrar, todo se recoge hacia el botón. Por eso
 * el menú sigue montado un instante después de cerrarlo (`montado`).
 *
 * Solo hay UNA barra de desplazamiento, la del propio menú: al abrirlo se
 * bloquea el scroll del documento entero (el elemento html), no solo el del
 * body. Con `overflow-x: hidden` en los dos (globals.css), bloquear solo el
 * body dejaba la barra de la página a la vista junto a la del menú.
 *
 * A dónde lleva cada enlace NO se decide aquí: lo decide el catálogo con
 * `destinoPorRuta`, según quién mire (la ficha pública a quien no tiene
 * acceso, la herramienta a quien sí).
 */
export default function BlogMobileMenu({ user, isPremium = false, userName, isAdmin = false, avatar = null, foro = false, precio }: Props) {
  const [open, setOpen] = useState(false);
  // Sigue en pantalla mientras se recoge, después de cerrarlo.
  const [montado, setMontado] = useState(false);
  // De dónde sale la hoja: el centro del botón del menú.
  const [origen, setOrigen] = useState({ x: "100%", y: "0px" });
  const pathname = usePathname();
  const primerEnlace = useRef<HTMLAnchorElement>(null);
  // Todo lo que va dentro del menú: se escala si no cabe en la pantalla.
  const hoja = useRef<HTMLDivElement>(null);
  // Lo que ocupa la barra en la página (alto y margen) justo antes de abrir.
  const hueco = useRef(0);
  const boton = useRef<HTMLButtonElement>(null);

  const activo = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const destino = (ruta: string) => destinoPorRuta(ruta, { logueado: user, premium: isPremium });
  const close = () => setOpen(false);
  const gratis = foro ? [GRATIS[0], GRATIS[1], FORO, ...GRATIS.slice(2)] : GRATIS;

  /** Abre o cierra, con su sonido, desde el centro del botón. */
  const alternar = () => {
    const r = boton.current?.getBoundingClientRect();
    if (r) setOrigen({ x: `${Math.round(r.left + r.width / 2)}px`, y: `${Math.round(r.top + r.height / 2)}px` });
    sonar(open ? "cerrar" : "abrir");
    if (!open) {
      // Se mide ANTES de abrir: al abrir, la barra pasa a fija (site-nav.css)
      // y deja de ocupar su sitio.
      const barra = boton.current?.closest<HTMLElement>(".blog-nav");
      if (barra) hueco.current = barra.getBoundingClientRect().height + parseFloat(getComputedStyle(barra).marginBottom);
      setMontado(true);
    }
    setOpen(!open);
  };

  // El menú nunca tiene scroll (pedido por el admin el 17-11-2026): ocupa la
  // pantalla y, si su contenido no cabe ni compactado (menu-movil.css), se
  // escala con `zoom` lo justo para que quepa. Se recalcula al girar el
  // móvil o cambiar el tamaño de la ventana. Dos pasadas: al escalar, el
  // contenido se reparte en un ancho distinto y su alto cambia un poco.
  useLayoutEffect(() => {
    if (!montado) return;
    const el = hoja.current;
    const caja = el?.parentElement;
    if (!el || !caja) return;
    // Se mide con `offsetHeight`, el alto de maquetación: no lo cambian ni la
    // animación de apertura (la tapa gira en perspectiva y, medida con
    // getBoundingClientRect a mitad de giro, parecía 226 px en vez de 850, y el
    // menú se cortaba: avisado por el admin el 17-11-2026) ni el propio `zoom`,
    // que solo multiplica lo que se ve.
    const ajustar = () => {
      const estilo = getComputedStyle(caja);
      const disponible = caja.clientHeight - parseFloat(estilo.paddingTop) - parseFloat(estilo.paddingBottom);
      el.style.zoom = "1";
      for (let pasada = 0; pasada < 3; pasada++) {
        // Un 2 % de colchón: el canto de la última tecla y el redondeo.
        const escala = Math.min(1, (disponible / el.offsetHeight) * 0.98);
        el.style.zoom = String(Math.max(0.55, Math.floor(escala * 1000) / 1000));
      }
    };
    ajustar();
    // Y otra vez si el contenido cambia de tamaño después (una foto que carga,
    // una fuente): una vez por fotograma como mucho.
    let pendiente = 0;
    const observador = new ResizeObserver(() => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(ajustar);
    });
    for (const hijo of Array.from(el.children)) observador.observe(hijo);
    window.addEventListener("resize", ajustar);
    return () => {
      cancelAnimationFrame(pendiente);
      observador.disconnect();
      window.removeEventListener("resize", ajustar);
    };
  }, [montado, user, isPremium, isAdmin, foro]);

  // Al abrir se monta (en `alternar`); al cerrar se deja que se recoja
  // (menu-movil.css, `mm-recoger`, 0,32 s) y después se quita. Con «reducir
  // movimiento», al momento.
  useEffect(() => {
    if (open || !montado) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // 0,65 s en el móvil y 0,44 s en el ordenador (menu-movil.css): se espera lo más largo.
    const espera = window.setTimeout(() => setMontado(false), quieto ? 0 : 700);
    return () => window.clearTimeout(espera);
  }, [open, montado]);

  // Al abrir, la barra pasa a fija y sale del flujo: todo lo de detrás subía de
  // golpe lo que ella medía (el «salto» que vio el admin el 17-11-2026). La
  // página reserva ese hueco arriba mientras el menú está abierto. En
  // useLayoutEffect, para que se aplique antes de pintar y no se vea el salto.
  useLayoutEffect(() => {
    if (!open || !hueco.current) return;
    const cuerpo = document.body;
    cuerpo.style.paddingTop = `${hueco.current}px`;
    return () => {
      cuerpo.style.paddingTop = "";
    };
  }, [open]);

  // Con el menú abierto, la página de debajo no se desplaza; Escape lo cierra
  // (con su sonido, y el foco vuelve al botón del menú) y el foco entra en el
  // primer enlace, como en cualquier diálogo.
  useEffect(() => {
    if (!open) return;
    const raiz = document.documentElement;
    raiz.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    // Sin desplazar la página al darle el foco.
    primerEnlace.current?.focus({ preventScroll: true });
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      sonar("cerrar");
      setOpen(false);
      boton.current?.focus();
    };
    window.addEventListener("keydown", alPulsar);
    return () => {
      raiz.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", alPulsar);
    };
  }, [open]);

  return (
    <>
      <Tecla
        color={open ? "tinta" : "blanca"}
        tamano="peq"
        icono
        className={`btn-hamburger${open ? " open" : ""}`}
        ref={boton}
        onClick={alternar}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        <span className="hamburger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </Tecla>

      {(open || montado) && (
        <div
          className={`mm${open ? "" : " is-cerrando"}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          aria-hidden={open ? undefined : true}
          style={{ "--mm-x": origen.x, "--mm-y": origen.y } as React.CSSProperties}
        >
          <div className="mm-hoja" ref={hoja}>
          <div className="mm-buscar">
            <GuideSearch />
            {/* En el móvil la etiqueta colgante no se ve con el menú abierto:
                el altavoz pasa aquí, junto al buscador (site-nav.css). */}
            <span className="mm-sonido"><InterruptorSonido /></span>
          </div>
          <div className="mm-cuerpo">
            <nav className="mm-nav" aria-label="Secciones de la academia">
              <Grupo titulo="Mejora como trader" adorno={<CoheteGarabato />} nota="Incluido en Premium" entradas={PREMIUM} desde={0} activo={activo} destino={destino} close={close} primerEnlace={primerEnlace} />
              <Grupo
                titulo="Aprende cripto"
                nota="Gratis, a tu ritmo"
                entradas={gratis}
                desde={PREMIUM.length}
                activo={activo}
                destino={destino}
                close={close}
                primerEnlace={primerEnlace}
                extra={
                  // Tu dashboard, con tu foto, en el hueco que queda al final:
                  // en naranja sólido, distinta del resto (pedido por el admin el
                  // 17-11-2026). Solo en el móvil (menu-movil.css), donde tu
                  // cuenta ya no va en el menú, y solo con sesión.
                  user && (
                    <li className="mm-tu-li" style={{ "--i": PREMIUM.length + gratis.length } as React.CSSProperties}>
                      <Link href="/dashboard" onClick={close} className="mm-item mm-tu" onPointerDown={() => sonar("tecla")}>
                        <span className="mm-tu-foto" aria-hidden="true">
                          <AvatarUsuario avatar={avatar} inicial={(userName || "U").charAt(0).toUpperCase()} className="mm-tu-avatar" />
                        </span>
                        <span className="mm-item-texto">
                          <span className="mm-item-nombre">Dashboard</span>
                        </span>
                      </Link>
                    </li>
                  )
                }
              />
            </nav>

            <aside className="mm-lado" aria-label="Tu cuenta">
              {user ? (
                // La misma ficha de alumno que el desplegable de la barra
                // (NavSaludo, site-nav.css): cabecera naranja con saludo a mano
                // y filas con su icono de color. Pedido por el admin el 17-11-2026.
                <div className="mm-cuenta mm-ficha">
                  <div className="nav-saludo-cabecera">
                    <span className="nav-saludo-avatar nav-saludo-avatar--grande" aria-hidden="true">
                      <AvatarUsuario avatar={avatar} inicial={(userName || "U").charAt(0).toUpperCase()} className="nav-saludo-foto" />
                      {isPremium && <span className="nav-saludo-corona"><Crown size={11} strokeWidth={2.6} /></span>}
                    </span>
                    <span className="nav-saludo-cabecera-texto">
                      <span className="nav-saludo-hola" aria-hidden="true">¡hola de nuevo!</span>
                      <span className="nav-saludo-cabecera-nombre">{userName || "Tu cuenta"}</span>
                      <span className={`nav-saludo-chip${isPremium ? " is-premium" : ""}`}>
                        {isPremium && <Crown size={11} strokeWidth={2.4} aria-hidden="true" />}
                        {isAdmin ? "Admin" : isPremium ? "Premium" : "Cuenta gratuita"}
                      </span>
                    </span>
                  </div>
                  <div className="nav-saludo-lista">
                    <Link href="/dashboard" onClick={close} className="nav-saludo-item nav-saludo-item--cielo" style={{ "--i": 0 } as React.CSSProperties}>
                      <span className="nav-saludo-icono" aria-hidden="true"><LayoutDashboard size={16} strokeWidth={2.2} /></span>
                      Mi dashboard
                      <ArrowRight className="nav-saludo-ir" size={15} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                    <Link href="/dashboard/perfil" onClick={close} className="nav-saludo-item nav-saludo-item--menta" style={{ "--i": 1 } as React.CSSProperties}>
                      <span className="nav-saludo-icono" aria-hidden="true"><UserRound size={16} strokeWidth={2.2} /></span>
                      Mi perfil
                      <ArrowRight className="nav-saludo-ir" size={15} strokeWidth={2.4} aria-hidden="true" />
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={close} className="nav-saludo-item nav-saludo-item--lila" style={{ "--i": 2 } as React.CSSProperties}>
                        <span className="nav-saludo-icono" aria-hidden="true"><Shield size={16} strokeWidth={2.2} /></span>
                        Panel admin
                        <ArrowUpRight className="nav-saludo-ir" size={15} strokeWidth={2.4} aria-hidden="true" />
                      </Link>
                    )}
                    <span className="nav-saludo-salir-caja" style={{ "--i": isAdmin ? 3 : 2 } as React.CSSProperties}>
                      <LogoutButton className="nav-saludo-salir" onDone={close}>
                        <span className="nav-saludo-icono" aria-hidden="true"><LogOut size={16} strokeWidth={2.2} /></span>
                        Cerrar sesión
                      </LogoutButton>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mm-cuenta">
                  <span className="mm-cuenta-titulo">Tu academia</span>
                  <p className="mm-cuenta-texto">
                    Con una cuenta gratuita haces el quiz de cada guía y desbloqueas sus logros.
                  </p>
                  <Tecla href="/register" onClick={close} ancho className="mm-btn">
                    Crear cuenta gratis <ArrowRight size={16} strokeWidth={2.6} aria-hidden="true" />
                  </Tecla>
                  <Tecla href="/login" onClick={close} color="blanca" ancho className="mm-btn">
                    Ya tengo cuenta
                  </Tecla>
                </div>
              )}

              <div className="mm-redes">
                <a href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" onClick={close} className="mm-red mm-instagram">
                  <span className="mm-red-icono" aria-hidden="true"><InstagramIcon size={19} /></span>
                  <span className="mm-red-texto">
                    <strong><span className="mm-nombre-largo">Escríbeme por Instagram</span><span className="mm-nombre-corto" aria-hidden="true">Instagram</span></strong>
                    <small>@adelinbtc · te contesto yo</small>
                  </span>
                  <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" className="mm-red-flecha" />
                </a>

                <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer" onClick={close} className="mm-red mm-youtube">
                  <span className="mm-red-icono" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" />
                    </svg>
                  </span>
                  <span className="mm-red-texto">
                    <strong><span className="mm-nombre-largo">Mi canal de YouTube</span><span className="mm-nombre-corto" aria-hidden="true">YouTube</span></strong>
                    <small>@AdelinBTC · todos mis vídeos</small>
                  </span>
                  <ArrowUpRight size={16} strokeWidth={2.4} aria-hidden="true" className="mm-red-flecha" />
                </a>
              </div>

              {!isPremium && (
                <Link href="/premium" onClick={close} className="mm-premium">
                  <span className="mm-premium-cabecera">
                    <Crown size={15} aria-hidden="true" /> Premium
                  </span>
                  <span className="mm-premium-titulo">Diario, Portfolio Adelin y Cursos en una suscripción</span>
                  <span className="mm-premium-pie">
                    <span className="mm-premium-precio">{precio}<small>/mes</small></span>
                    <span className="mm-premium-ir">
                      Ver qué incluye <ArrowRight size={15} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                  </span>
                  <span className="mm-premium-nota">Sin permanencia · Cancela cuando quieras</span>
                </Link>
              )}
            </aside>
          </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Un grupo del menú: su cabecera y sus destinos. */
function Grupo({ titulo, adorno, nota, entradas, desde, activo, destino, close, primerEnlace, extra }: {
  titulo: string;
  /** Un dibujo pequeño junto al título (el cohete, en el móvil). */
  adorno?: React.ReactNode;
  nota: string;
  entradas: Entrada[];
  /** Posición del primer enlace en todo el menú: escalona la entrada. */
  desde: number;
  activo: (href: string) => boolean;
  destino: (ruta: string) => string;
  close: () => void;
  primerEnlace: React.RefObject<HTMLAnchorElement | null>;
  /** Una tecla más al final de la lista (el acceso a tu dashboard, en el móvil). */
  extra?: React.ReactNode;
}) {
  return (
    <section className="mm-grupo" aria-label={titulo}>
      <header className={adorno ? "mm-grupo-cabecera mm-grupo-cabecera--adorno" : "mm-grupo-cabecera"}>
        <span className="mm-grupo-titulo">{titulo}</span>
        <span className="mm-grupo-nota">{nota}</span>
        {adorno}
      </header>
      <ul className="mm-lista">
        {entradas.map((e, i) => {
          const Icono = e.icon;
          const proximamente = herramientaProxima(e.id);
          const href = FUERA_DEL_CATALOGO.has(e.id) ? e.ruta : destino(e.ruta);
          return (
            <li key={e.id} style={{ "--i": desde + i } as React.CSSProperties}>
              <Link
                ref={desde + i === 0 ? primerEnlace : undefined}
                href={href}
                onClick={close}
                className={`mm-item mm-item--${e.id} mm-tono--${e.tono}${activo(e.ruta) ? " is-activo" : ""}`}
                onPointerDown={() => sonar("tecla")}
                aria-current={activo(e.ruta) ? "page" : undefined}
              >
                <span className="mm-item-icono" aria-hidden="true"><Icono size={19} strokeWidth={2} /></span>
                <span className="mm-item-texto">
                  <span className="mm-item-nombre">
                    <span className="mm-nombre-largo">{e.label}</span>
                    <span className="mm-nombre-corto" aria-hidden="true">{NOMBRE_CORTO[e.id] ?? e.label}</span>
                    {proximamente && <span className="mm-pill mm-pill--pronto">Próximamente</span>}
                  </span>
                  <span className="mm-item-linea">{e.linea}</span>
                </span>
                <ArrowRight size={16} strokeWidth={2.4} className="mm-item-flecha" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
        {extra}
      </ul>
    </section>
  );
}

/** ¿Está anunciada pero aún sin abrir? Hoy, los Cursos hasta que se publique el primero. */
function herramientaProxima(id: string): boolean {
  if (FUERA_DEL_CATALOGO.has(id)) return false;
  return herramienta(id).acceso === "proximamente";
}
