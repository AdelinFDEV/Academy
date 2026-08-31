import type { Metadata, Viewport } from "next";
import { Poppins, DM_Sans, Kalam } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SITE_URL } from "@/lib/site";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import JsonLd from "@/components/JsonLd";
import BadgeNotifier from "@/components/BadgeNotifier";
import CookieBanner from "@/components/CookieBanner";
import SiteVisitTracker from "@/components/SiteVisitTracker";
import StreakTracker from "@/components/StreakTracker";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const kalam = Kalam({
  weight: ["700"],
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
});

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

export const viewport: Viewport = {
  themeColor: "#0a1628",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} ${dmSans.variable} ${kalam.variable}`} style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}>
      <head>
        {/* El feed va aquí a mano y NO en `alternates.types` de la metadata.
            Motivo comprobado: en Next los metadatos se fusionan por campo, así
            que el `alternates: { canonical }` de cada página **reemplaza entero**
            el `alternates` del layout — y como todas las rutas públicas declaran
            su canónica desde el punto 4, el enlace al feed desaparecía de todas.
            Aquí se emite siempre, independientemente de la metadata. */}
        <link
          rel="alternate"
          type="application/rss+xml"
          title="AdelinBTC Academy"
          href="/rss.xml"
        />
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
        <SiteVisitTracker />
        <StreakTracker />
        {/* Cloudflare Web Analytics (gratis, sin cookies) */}
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          strategy="afterInteractive"
          data-cf-beacon='{"token": "7969fb64e16745b899eaf16b074d07c4"}'
        />
      </body>
    </html>
  );
}
