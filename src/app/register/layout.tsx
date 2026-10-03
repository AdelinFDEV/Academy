import type { Metadata } from "next";

/**
 * `noindex` para /register: no tiene nada que posicionar.
 *
 * Va en un layout porque la página es un componente de cliente y no puede
 * exportar `metadata`. Aquí es seguro: la ruta no tiene hijas que lo hereden
 * sin querer (la regla de no poner canónicas en un layout es por eso).
 *
 * Funciona porque /register ya NO está en el `disallow` de `robots.ts`: con la
 * ruta bloqueada Google no entraba, no veía este `noindex` y la indexaba
 * igual si alguien la enlazaba. Pasó con /login y /forgot-password en
 * septiembre de 2026.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
