import { ImageResponse } from "next/og";

/**
 * La imagen que sale al compartir la guía en Telegram, WhatsApp o X.
 *
 * La guía no tenía ninguna, así que el enlace viajaba con la genérica del sitio
 * —o con nada— y no decía de qué iba. La genera Next en el servidor: no hay
 * ningún archivo que subir, optimizar ni mantener.
 *
 * Mismo lenguaje que `src/app/opengraph-image.tsx`, con el dorado de las guías
 * en vez del naranja de la marca, que es el color con el que ya se pinta esta.
 */
export const alt = "Fiscalidad cripto en España: qué tributa, FIFO y modelo 721";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0a1628 0%, #112240 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 42,
            fontWeight: 700,
            color: "#f0f4ff",
            letterSpacing: "-0.04em",
          }}
        >
          adelin<span style={{ color: "#ff6b2b" }}>btc</span>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 60,
            fontWeight: 700,
            color: "#f0f4ff",
            lineHeight: 1.1,
            maxWidth: 940,
            letterSpacing: "-0.03em",
          }}
        >
          Fiscalidad cripto en España
        </div>

        <div style={{ marginTop: 20, fontSize: 30, color: "#b0c4d8", maxWidth: 900, lineHeight: 1.35 }}>
          Qué tributa y qué no, el método FIFO obligatorio, la escala del ahorro y el modelo 721.
        </div>

        {/* Las tres cifras que resumen la guía. Son las mismas que abren la
            página, para que quien llega desde el enlace reconozca el sitio. */}
        <div style={{ marginTop: 44, display: "flex", gap: 56 }}>
          {[
            ["30%", "tipo máximo"],
            ["50.000 €", "umbral del 721"],
            ["4 años", "para compensar"],
          ].map(([cifra, pie]) => (
            <div key={cifra} style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 40, fontWeight: 700, color: "#e6b455" }}>{cifra}</span>
              <span
                style={{
                  fontSize: 20,
                  color: "#8899bb",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: 6,
                }}
              >
                {pie}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
