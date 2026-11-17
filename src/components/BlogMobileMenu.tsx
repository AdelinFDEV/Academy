"use client";

import { useEffect, useRef, useState } from "react";
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
  const pathname = usePathname();
  const primerEnlace = useRef<HTMLAnchorElement>(null);
  const boton = useRef<HTMLButtonElement>(null);

  const activo = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const destino = (ruta: string) => destinoPorRuta(ruta, { logueado: user, premium: isPremium });
  const close = () => setOpen(false);

  // Con el menú abierto, la página de debajo no se desplaza; Escape lo cierra
  // (con su sonido, y el foco vuelve al botón del menú) y el foco entra en el
  // primer enlace, como en cualquier diálogo.
  useEffect(() => {
    if (!open) return;
    const raiz = document.documentElement;
    raiz.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    primerEnlace.current?.focus();
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
        onClick={() => {
          sonar(open ? "cerrar" : "abrir");
          setOpen(!open);
        }}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
      >
        <span className="hamburger-lines" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </Tecla>

      {open && (
        <div className="mm" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="mm-buscar">
            <GuideSearch />
          </div>
          <div className="mm-cuerpo">
            <nav className="mm-nav" aria-label="Secciones de la academia">
              <Grupo titulo="Mejora como trader" nota="Incluido en Premium" entradas={PREMIUM} desde={0} activo={activo} destino={destino} close={close} primerEnlace={primerEnlace} />
              <Grupo titulo="Aprende cripto" nota="Gratis, a tu ritmo" entradas={foro ? [GRATIS[0], GRATIS[1], FORO, ...GRATIS.slice(2)] : GRATIS} desde={PREMIUM.length} activo={activo} destino={destino} close={close} primerEnlace={primerEnlace} />
            </nav>

            <aside className="mm-lado" aria-label="Tu cuenta">
              {user ? (
                <div className="mm-cuenta">
                  <div className="mm-cuenta-quien">
                    <span aria-hidden="true" className="mm-avatar-caja">
                      <AvatarUsuario avatar={avatar} inicial={(userName || "U").charAt(0).toUpperCase()} className="mm-avatar" />
                    </span>
                    <span>
                      <span className="mm-cuenta-nombre">{userName || "Tu cuenta"}</span>
                      <span className={`mm-rol${isPremium ? " is-premium" : ""}`}>
                        {isAdmin ? "Admin" : isPremium ? "Premium" : "Cuenta gratuita"}
                      </span>
                    </span>
                  </div>
                  <div className="mm-cuenta-enlaces">
                    <Link href="/dashboard" onClick={close} className="mm-cuenta-enlace">
                      <LayoutDashboard size={16} aria-hidden="true" /> Mi dashboard
                    </Link>
                    <Link href="/dashboard/perfil" onClick={close} className="mm-cuenta-enlace">
                      <UserRound size={16} aria-hidden="true" /> Mi perfil
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" onClick={close} className="mm-cuenta-enlace">
                        <Shield size={16} aria-hidden="true" /> Panel admin
                        <ArrowUpRight size={14} aria-hidden="true" className="mm-cuenta-enlace-ext" />
                      </Link>
                    )}
                    <LogoutButton className="mm-cuenta-enlace mm-salir" onDone={close}>
                      <LogOut size={16} aria-hidden="true" /> Cerrar sesión
                    </LogoutButton>
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
                    <strong>Escríbeme por Instagram</strong>
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
                    <strong>Mi canal de YouTube</strong>
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
      )}
    </>
  );
}

/** Un grupo del menú: su cabecera y sus destinos. */
function Grupo({ titulo, nota, entradas, desde, activo, destino, close, primerEnlace }: {
  titulo: string;
  nota: string;
  entradas: Entrada[];
  /** Posición del primer enlace en todo el menú: escalona la entrada. */
  desde: number;
  activo: (href: string) => boolean;
  destino: (ruta: string) => string;
  close: () => void;
  primerEnlace: React.RefObject<HTMLAnchorElement | null>;
}) {
  return (
    <section className="mm-grupo" aria-label={titulo}>
      <header className="mm-grupo-cabecera">
        <span className="mm-grupo-titulo">{titulo}</span>
        <span className="mm-grupo-nota">{nota}</span>
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
                className={`mm-item mm-tono--${e.tono}${activo(e.ruta) ? " is-activo" : ""}`}
                onPointerDown={() => sonar("tecla")}
                aria-current={activo(e.ruta) ? "page" : undefined}
              >
                <span className="mm-item-icono" aria-hidden="true"><Icono size={19} strokeWidth={2} /></span>
                <span className="mm-item-texto">
                  <span className="mm-item-nombre">
                    {e.label}
                    {proximamente && <span className="mm-pill mm-pill--pronto">Próximamente</span>}
                  </span>
                  <span className="mm-item-linea">{e.linea}</span>
                </span>
                <ArrowRight size={16} strokeWidth={2.4} className="mm-item-flecha" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** ¿Está anunciada pero aún sin abrir? Hoy, los Cursos hasta que se publique el primero. */
function herramientaProxima(id: string): boolean {
  if (FUERA_DEL_CATALOGO.has(id)) return false;
  return herramienta(id).acceso === "proximamente";
}
