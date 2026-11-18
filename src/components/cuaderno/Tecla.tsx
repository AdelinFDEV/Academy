"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, DOMAttributes, KeyboardEvent, ReactNode, Ref } from "react";
import { sonar } from "@/lib/sonidos";
import "./tecla.css";

/**
 * El botón-tecla: TODOS los botones de la web del estilo «Cuaderno de estudio»
 * son este (ESTILO.md, pedido por el admin el 17-11-2026: «esa sensación de
 * teclado súper satisfactorio»). Se hunde entero al pulsar, rebota al soltar,
 * hace clic dos veces como una tecla de verdad (al bajar y, más flojo, al
 * subir; sonidos encendidos por defecto) y vibra un instante en los móviles
 * que lo permiten. Con el teclado (Espacio o Intro) hace lo mismo.
 *
 * Con `href` es un enlace (Link de Next); sin él, un <button>. Acepta `ref`
 * (React 19 lo pasa como una prop más): sirve para devolver el foco a la
 * tecla que abrió un menú o una ventana al cerrarla.
 */

export type ColorTecla = "naranja" | "azul" | "menta" | "lila" | "amarillo" | "coral" | "cielo" | "blanca" | "tinta";
export type TamanoTecla = "peq" | "normal" | "grande";

interface Comunes {
  children: ReactNode;
  color?: ColorTecla;
  tamano?: TamanoTecla;
  /** Solo un icono: cuadrada. Necesita `aria-label`. */
  icono?: boolean;
  /** Ocupa todo el ancho de su contenedor. */
  ancho?: boolean;
  /**
   * Sin el clic propio de la tecla (se hunde y vibra igual): para la que hace
   * su propio sonido, como el altavoz, que suena distinto al encender y al
   * apagar. Si no, sonaban los dos a la vez.
   */
  muda?: boolean;
  className?: string;
}

type ComoEnlace = Comunes & { href: string; ref?: Ref<HTMLAnchorElement> } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;
type ComoBoton = Comunes & { href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

function clases({ color = "naranja", tamano = "normal", icono, ancho, className }: Omit<Comunes, "muda">): string {
  return [
    "tecla",
    `tecla--${color}`,
    tamano !== "normal" && `tecla--${tamano}`,
    icono && "tecla--icono",
    ancho && "tecla--ancho",
    className,
  ].filter(Boolean).join(" ");
}

/**
 * Lo mínimo que una tecla se queda hundida, en milisegundos. Un toque rápido
 * con el dedo dura menos de lo que tarda en verse el hundido: sin esto, en el
 * móvil la tecla apenas se movía y parecía que no había pasado nada.
 */
const MINIMO_HUNDIDA = 110;

/** Cuándo bajó cada tecla, y el temporizador que la suelta si el toque fue corto. */
const pulsaciones = new WeakMap<HTMLElement, { desde: number; espera: number; muda: boolean }>();

/**
 * El golpe: la tecla baja (clase `is-pulsada`, tecla.css), suena y, en los
 * móviles que lo permiten, vibra un instante (Android; iOS no deja en la web).
 * La clase se pone en el DOM, sin estado de React: pulsar no vuelve a pintar nada.
 */
function bajar(el: HTMLElement, muda: boolean) {
  const previa = pulsaciones.get(el);
  if (previa) window.clearTimeout(previa.espera);
  pulsaciones.set(el, { desde: performance.now(), espera: 0, muda });
  el.classList.add("is-pulsada");
  if (!muda) sonar("tecla");
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
}

/**
 * La tecla sube: rebota con su muelle (tecla.css) y, si la persona la soltó
 * encima (`conClic`), suena la otra mitad del clic. Si el dedo se fue fuera o
 * el toque se canceló, sube callada.
 */
function subir(el: HTMLElement, conClic: boolean) {
  const p = pulsaciones.get(el);
  if (!p) return;
  const fin = () => {
    pulsaciones.delete(el);
    el.classList.remove("is-pulsada");
    if (conClic && !p.muda) sonar("soltar");
  };
  window.clearTimeout(p.espera);
  const falta = MINIMO_HUNDIDA - (performance.now() - p.desde);
  if (falta > 0) p.espera = window.setTimeout(fin, falta);
  else fin();
}

/**
 * La chispa del clic (18-11-2026, pedida por el admin): con el ratón, al
 * pulsar una tecla salen del punto de clic tres rayitas de rotulador, como el
 * brillo que se dibuja a mano, y se borran en 0,35 s (tecla.css). Va en
 * <body> con posición fija: no la recorta ni la mueve la tecla al hundirse.
 * Con «reducir movimiento», no sale.
 */
function chispa(x: number, y: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("span");
  el.className = "tecla-chispa";
  el.setAttribute("aria-hidden", "true");
  el.style.left = x + "px";
  el.style.top = y + "px";
  for (let i = 0; i < 3; i++) el.appendChild(document.createElement("span"));
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 400);
}

/**
 * La tecla del teclado que la activa: Intro siempre, y Espacio solo en un
 * botón (en un enlace, Espacio baja la página y no lo abre).
 */
const esActivar = (e: KeyboardEvent<HTMLElement>) =>
  e.key === "Enter" || (e.key === " " && e.currentTarget.tagName === "BUTTON");

/**
 * Los gestos de una tecla, para el enlace y para el botón. Cada uno llama
 * después al manejador que le hayan pasado desde fuera.
 */
function gestos<E extends HTMLElement>(
  activa: boolean,
  muda: boolean,
  propios: Pick<DOMAttributes<E>, "onPointerDown" | "onPointerUp" | "onPointerLeave" | "onPointerCancel" | "onKeyDown" | "onKeyUp" | "onBlur">,
): typeof propios {
  return {
    onPointerDown: (e) => {
      // Solo el botón principal del ratón (o el dedo, o el lápiz).
      if (activa && e.button === 0) {
        bajar(e.currentTarget, muda);
        if (e.pointerType === "mouse") chispa(e.clientX, e.clientY);
      }
      propios.onPointerDown?.(e);
    },
    onPointerUp: (e) => {
      subir(e.currentTarget, true);
      propios.onPointerUp?.(e);
    },
    onPointerLeave: (e) => {
      subir(e.currentTarget, false);
      propios.onPointerLeave?.(e);
    },
    onPointerCancel: (e) => {
      subir(e.currentTarget, false);
      propios.onPointerCancel?.(e);
    },
    // Con el teclado se hunde y suena igual que con el dedo.
    onKeyDown: (e) => {
      if (activa && !e.repeat && esActivar(e)) bajar(e.currentTarget, muda);
      propios.onKeyDown?.(e);
    },
    onKeyUp: (e) => {
      if (esActivar(e)) subir(e.currentTarget, true);
      propios.onKeyUp?.(e);
    },
    onBlur: (e) => {
      subir(e.currentTarget, false);
      propios.onBlur?.(e);
    },
  };
}

export default function Tecla(props: ComoEnlace | ComoBoton) {
  const { children, color, tamano, icono, ancho, muda = false, className, ...resto } = props;
  const cls = clases({ children, color, tamano, icono, ancho, className });

  if (resto.href !== undefined) {
    const { href, onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onKeyDown, onKeyUp, onBlur, ...enlace } = resto as ComoEnlace;
    return (
      <Link
        href={href}
        className={cls}
        {...enlace}
        {...gestos<HTMLAnchorElement>(true, muda, { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onKeyDown, onKeyUp, onBlur })}
      >
        {children}
      </Link>
    );
  }

  const { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onKeyDown, onKeyUp, onBlur, type, disabled, ...boton } = resto as ComoBoton;
  return (
    <button
      type={type ?? "button"}
      className={cls}
      disabled={disabled}
      {...boton}
      {...gestos<HTMLButtonElement>(!disabled, muda, { onPointerDown, onPointerUp, onPointerLeave, onPointerCancel, onKeyDown, onKeyUp, onBlur })}
    >
      {children}
    </button>
  );
}
