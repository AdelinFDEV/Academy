"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import { sonar } from "@/lib/sonidos";
import "./tecla.css";

/**
 * El botón-tecla: TODOS los botones de la web del estilo «Cuaderno de estudio»
 * son este (ESTILO.md, pedido por el admin el 17-11-2026: «esa sensación de
 * teclado súper satisfactorio»). Se hunde entero al pulsar, rebota al soltar,
 * hace clic (sonidos encendidos por defecto) y vibra un instante en los móviles
 * que lo permiten.
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
  className?: string;
}

type ComoEnlace = Comunes & { href: string; ref?: Ref<HTMLAnchorElement> } & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;
type ComoBoton = Comunes & { href?: undefined; ref?: Ref<HTMLButtonElement> } & Omit<ComponentPropsWithoutRef<"button">, "className" | "children">;

function clases({ color = "naranja", tamano = "normal", icono, ancho, className }: Comunes): string {
  return [
    "tecla",
    `tecla--${color}`,
    tamano !== "normal" && `tecla--${tamano}`,
    icono && "tecla--icono",
    ancho && "tecla--ancho",
    className,
  ].filter(Boolean).join(" ");
}

/** El golpe: sonido y una vibración cortísima (Android; iOS no la permite en la web). */
function alPulsar() {
  sonar("tecla");
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
}

export default function Tecla(props: ComoEnlace | ComoBoton) {
  const { children, color, tamano, icono, ancho, className, ...resto } = props;
  const cls = clases({ children, color, tamano, icono, ancho, className });

  if (resto.href !== undefined) {
    const { href, onPointerDown, ...enlace } = resto as ComoEnlace;
    return (
      <Link
        href={href}
        className={cls}
        onPointerDown={(e) => {
          alPulsar();
          onPointerDown?.(e);
        }}
        {...enlace}
      >
        {children}
      </Link>
    );
  }

  const { onPointerDown, type, disabled, ...boton } = resto as ComoBoton;
  return (
    <button
      type={type ?? "button"}
      className={cls}
      disabled={disabled}
      onPointerDown={(e) => {
        if (!disabled) alPulsar();
        onPointerDown?.(e);
      }}
      {...boton}
    >
      {children}
    </button>
  );
}
