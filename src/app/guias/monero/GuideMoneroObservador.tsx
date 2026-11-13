"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * La misma operación (Ana paga a Luis) vista por un tercero en Bitcoin y en
 * Monero. No consulta nada: los datos son inventados para el ejemplo y solo
 * cambia qué filas se pueden leer en cada red.
 */
type Fila = { dato: string; btc: string; xmr: string; oculto: boolean };

const FILAS: Fila[] = [
  { dato: "Dirección que paga", btc: "bc1q7k…m4pz (la de Ana)", xmr: "Una de 16 posibles", oculto: true },
  { dato: "Dirección que cobra", btc: "bc1qe9…t0xw (la de Luis)", xmr: "Una dirección de un solo uso", oculto: true },
  { dato: "Cantidad", btc: "0,0412 BTC", xmr: "Cifrada", oculto: true },
  { dato: "Saldo que le queda a Ana", btc: "1,3070 BTC", xmr: "No se puede saber", oculto: true },
  { dato: "Otros pagos de Ana y de Luis", btc: "Todos, hacia atrás y hacia delante", xmr: "No se pueden enlazar", oculto: true },
  { dato: "Fecha y comisión pagada", btc: "Visible", xmr: "Visible", oculto: false },
  { dato: "Que la operación existe", btc: "Visible", xmr: "Visible", oculto: false },
];

export default function GuideMoneroObservador() {
  const [red, setRed] = useState<"btc" | "xmr">("btc");
  const visibles = FILAS.filter((f) => red === "btc" || !f.oculto).length;

  return (
    <div className="xmr-obs">
      <p className="xmr-obs-titulo">Lo que ve cualquiera en el explorador</p>

      <div className="xmr-obs-redes" role="group" aria-label="Elige la red">
        <button type="button" aria-pressed={red === "btc"} className={red === "btc" ? "is-activa" : ""} onClick={() => setRed("btc")}>Bitcoin</button>
        <button type="button" aria-pressed={red === "xmr"} className={red === "xmr" ? "is-activa" : ""} onClick={() => setRed("xmr")}>Monero</button>
      </div>

      <ul className="xmr-obs-filas" aria-live="polite">
        {FILAS.map((f) => {
          const tapado = red === "xmr" && f.oculto;
          return (
            <li key={f.dato} className={tapado ? "is-tapado" : ""}>
              <span className="xmr-obs-icono" aria-hidden="true">{tapado ? <EyeOff size={17} /> : <Eye size={17} />}</span>
              <span className="xmr-obs-dato">{f.dato}</span>
              <span className="xmr-obs-valor">{red === "btc" ? f.btc : f.xmr}</span>
            </li>
          );
        })}
      </ul>

      <p className="xmr-obs-resumen">
        {red === "btc"
          ? `Se leen los ${visibles} datos. Con saber de quién es una sola dirección, se reconstruye el resto.`
          : `Se leen ${visibles} de 7: que hubo una operación, cuándo y cuánto pagó de comisión. Nada más.`}
      </p>
    </div>
  );
}
