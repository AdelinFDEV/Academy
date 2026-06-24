import { ImageResponse } from "next/og";

export const alt = "AdelinBTC Academy — Formación crypto profesional";
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
          padding: "80px",
          background: "linear-gradient(135deg, #0a1628 0%, #112240 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 64,
            fontWeight: 700,
            color: "#f0f4ff",
            letterSpacing: "-0.04em",
          }}
        >
          adelin<span style={{ color: "#ff6b2b" }}>btc</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 52,
            fontWeight: 700,
            color: "#f0f4ff",
            lineHeight: 1.15,
            maxWidth: 900,
            letterSpacing: "-0.03em",
          }}
        >
          El conocimiento que el mercado no te va a regalar
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            color: "#8899bb",
            maxWidth: 820,
          }}
        >
          Análisis de mercado, educación blockchain y trading con criterio.
        </div>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            fontSize: 22,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "#ff6b2b",
          }}
        >
          Formación crypto profesional
        </div>
      </div>
    ),
    { ...size }
  );
}
