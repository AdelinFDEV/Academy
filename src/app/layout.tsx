import type { Metadata, Viewport } from "next";
import { Fraunces, Nunito, Caveat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import BadgeNotifier from "@/components/BadgeNotifier";
import CookieBanner from "@/components/CookieBanner";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import RegistroVisita from "@/components/RegistroVisita";
import StreakTracker from "@/components/StreakTracker";
import GlosarioPopupGlobal, { type TerminoCorto } from "@/components/GlosarioPopupGlobal";
import AcordeonesSuaves from "@/components/AcordeonesSuaves";
import SonidosGlobales from "@/components/SonidosGlobales";
import { GLOSARIO_CON_PAGINA } from "@/lib/glosario";

// Poppins y DM Sans, las letras de la web oscura, se quitaron el 17-11-2026:
// desde entonces toda la web va con las tres del «Cuaderno de estudio».
//
// Fraunces: la serif del certificado de los cursos. Antes llegaba con un
// @import a fonts.googleapis.com en globals.css: una petición a Google que
// bloqueaba el pintado de TODAS las páginas, cargaba dos familias que no se
// usaban (Space Grotesk y Caveat) y mandaba la IP del visitante a Google antes
// del consentimiento. next/font la sirve desde el propio dominio (08-11-2026).
// Kalam se quitó a la vez: solo la usaba una clase que ya no existía.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
});

// Las dos letras del estilo «Cuaderno de estudio» (ESTILO.md, 17-11-2026):
// Nunito para el texto y los botones, Caveat para las notas a mano. Fraunces
// (arriba) hace los titulares y las cifras.
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

// Las definiciones cortas para el popup del diccionario de toda la web. Solo
// los términos con ficha propia: el «ver explicación detallada» de los demás
// daría 404. Son unos 15 KB sin comprimir y van en el layout, que en la
// navegación interna no se vuelve a pedir: se pagan una vez por visita.
const TERMINOS_POPUP: Record<string, TerminoCorto> = Object.fromEntries(
  GLOSARIO_CON_PAGINA.map((t) => [t.slug, { term: t.term, definition: t.definition }]),
);

const siteUrl = SITE_URL;
const description =
  "Academia de criptomonedas: análisis de mercado, educación blockchain y herramientas para operar con criterio. Publicaciones semanales para quien va en serio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AdelinBTC Academy | Formación en Criptomonedas",
    template: "%s | AdelinBTC",
  },
  description,
  keywords: ["bitcoin", "criptomonedas", "blockchain", "trading", "DeFi", "análisis crypto"],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "AdelinBTC Academy",
    title: "AdelinBTC Academy | Formación en Criptomonedas",
    description,
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "AdelinBTC Academy | Formación en Criptomonedas",
    description,
  },
};

// Sin `maximumScale` ni `userScalable: false`: impedir el zoom deja fuera a
// quien necesita ampliar para leer, incumple las pautas de accesibilidad y
// Google lo cuenta como señal negativa de usabilidad móvil. Se quitó el
// 31-08-2026; si alguien vuelve a añadirlo para "que no se descuadre", el
// arreglo correcto es el CSS, no bloquear el zoom del visitante.
export const viewport: Viewport = {
  // El lavanda del fondo (`--fondo`): la barra del navegador móvil se funde con la página.
  themeColor: "#f3f5ff",
  width: "device-width",
  initialScale: 1,
  // En Android, al abrir el teclado la página se encoge en vez de quedar
  // tapada: el botón de enviar de los formularios sigue a la vista.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${nunito.variable} ${caveat.variable}`} style={{ fontFamily: "var(--font-nunito, sans-serif)" }}>
      <head>
      </head>
      <body suppressHydrationWarning>
        {/* La organización y el sitio se declaran aquí y SOLO aquí: el resto de
            esquemas apuntan a su `@id`. Al ir en el layout raíz salen en todas
            las rutas, que es justo lo que se quiere para estas dos — al revés
            que la canónica, que por eso vive en cada página. */}
        <JsonLd data={[organizationSchema(), websiteSchema(description)]} />
        {children}
        <BadgeNotifier />
        <CookieBanner />
        <RegistroVisita />
        <StreakTracker />
        <GlosarioPopupGlobal terminos={TERMINOS_POPUP} />
        <AcordeonesSuaves />
        {/* El sonido al escribir y el clic de las tarjetas que no son teclas. */}
        <SonidosGlobales />
        {/* Cloudflare Web Analytics: sin cookies, así que no depende del
            banner y mide siempre. Es la red de seguridad si alguien no acepta. */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token": "7969fb64e16745b899eaf16b074d07c4"}'
        />
        {/* Google Analytics 4: usa cookies, así que solo se carga si el
            visitante lo acepta. Ver `src/components/GoogleAnalytics.tsx`. */}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
