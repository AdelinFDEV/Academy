import type { Metadata, Viewport } from "next";
import { Poppins, DM_Sans, Kalam } from "next/font/google";
import "./globals.css";
import BadgeNotifier from "@/components/BadgeNotifier";

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const description =
  "Academia de criptomonedas: análisis de mercado, educación blockchain y herramientas para operar con criterio. Publicaciones semanales para inversores que van en serio.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AdelinBTC Academy | Formación en Criptomonedas",
    template: "%s | AdelinBTC Academy",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} ${dmSans.variable} ${kalam.variable}`} style={{ fontFamily: "var(--font-dm-sans, sans-serif)" }}>
      <body>
        {children}
        <BadgeNotifier />
      </body>
    </html>
  );
}
