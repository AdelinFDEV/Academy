"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * Los cuatro tipos de operación de Zcash, según de qué dirección sale y a cuál
 * llega, y lo que ve un tercero en el explorador en cada uno. No consulta
 * nada: las direcciones y la cantidad son inventadas para el ejemplo.
 *
 * El texto de la sección explica lo mismo en el HTML del servidor; esto solo
 * deja comparar los cuatro casos de un vistazo.
 */
type Tipo = "tt" | "tz" | "zz" | "zt";
type Celda = { valor: string; visible: boolean };
type Caso = {
  nombre: string;
  ruta: string;
  paga: Celda;
  cobra: Celda;
  cantidad: Celda;
  nota: Celda;
  resumen: string;
};

const FECHA: Celda = { valor: "Visible", visible: true };

const CASOS: Record<Tipo, Caso> = {
  tt: {
    nombre: "Transparente",
    ruta: "t → t",
    paga: { valor: "t1Vx…9qL (la de Ana)", visible: true },
    cobra: { valor: "t1Mf…3wD (la de Luis)", visible: true },
    cantidad: { valor: "2,5 ZEC", visible: true },
    nota: { valor: "No existe en este tipo", visible: true },
    resumen: "Lo ve todo el mundo, igual que en Bitcoin. Es el tipo de operación que usan los exchanges.",
  },
  tz: {
    nombre: "Blindar",
    ruta: "t → z",
    paga: { valor: "t1Vx…9qL (la de Ana)", visible: true },
    cobra: { valor: "Entra en el fondo blindado", visible: false },
    cantidad: { valor: "2,5 ZEC entran en el fondo", visible: true },
    nota: { valor: "Cifrada", visible: false },
    resumen: "Se ve quién mete dinero y cuánto. A partir de ahí, se le pierde la pista.",
  },
  zz: {
    nombre: "Blindada",
    ruta: "z → z",
    paga: { valor: "Oculta", visible: false },
    cobra: { valor: "Oculta", visible: false },
    cantidad: { valor: "Oculta", visible: false },
    nota: { valor: "Cifrada, solo la lee Luis", visible: false },
    resumen: "Solo se ve que hubo una operación, cuándo y la comisión. Es la que da la privacidad.",
  },
  zt: {
    nombre: "Desblindar",
    ruta: "z → t",
    paga: { valor: "Sale del fondo blindado", visible: false },
    cobra: { valor: "t1Mf…3wD (la de Luis)", visible: true },
    cantidad: { valor: "2,5 ZEC salen del fondo", visible: true },
    nota: { valor: "No llega a una dirección transparente", visible: true },
    resumen: "Se ve quién recibe y cuánto. Si alguien blindó 2,5 ZEC hace diez minutos, la relación salta a la vista.",
  },
};

const ORDEN: Tipo[] = ["tt", "tz", "zz", "zt"];

const FILAS: { clave: "paga" | "cobra" | "cantidad" | "nota"; dato: string }[] = [
  { clave: "paga", dato: "Dirección que paga" },
  { clave: "cobra", dato: "Dirección que cobra" },
  { clave: "cantidad", dato: "Cantidad" },
  { clave: "nota", dato: "Nota adjunta al pago" },
];

function Fila({ dato, celda }: { dato: string; celda: Celda }) {
  return (
    <li className={celda.visible ? "" : "is-oculto"}>
      <span className="zec-tx-icono" aria-hidden="true">{celda.visible ? <Eye size={17} /> : <EyeOff size={17} />}</span>
      <span className="zec-tx-dato">{dato}</span>
      <span className="zec-tx-valor">{celda.valor}</span>
    </li>
  );
}

export default function GuideZcashTransacciones() {
  const [tipo, setTipo] = useState<Tipo>("tt");
  const caso = CASOS[tipo];
  const ocultos = FILAS.filter((f) => !caso[f.clave].visible).length;

  return (
    <div className="zec-tx">
      <p className="zec-tx-titulo">Ana paga 2,5 ZEC a Luis. ¿Qué ve un tercero?</p>

      <div className="zec-tx-tipos" role="group" aria-label="Elige el tipo de operación">
        {ORDEN.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tipo === t}
            className={tipo === t ? "is-activo" : ""}
            onClick={() => setTipo(t)}
          >
            <strong>{CASOS[t].nombre}</strong>
            <span>{CASOS[t].ruta}</span>
          </button>
        ))}
      </div>

      <ul className="zec-tx-filas" aria-live="polite">
        {FILAS.map((f) => (
          <Fila key={f.clave} dato={f.dato} celda={caso[f.clave]} />
        ))}
        <Fila dato="Fecha y comisión" celda={FECHA} />
      </ul>

      <p className="zec-tx-resumen">
        <strong>{ocultos === 0 ? "Nada oculto." : `${ocultos} de 4 datos ocultos.`}</strong> {caso.resumen}
      </p>
    </div>
  );
}
