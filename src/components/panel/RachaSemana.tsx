import type { DiaRacha } from "@/lib/rachaSemana";

/**
 * La racha de la semana, como en el sistema de diseño: siete casillas, la de
 * cada día que contó, en naranja. Sin estado: sirve en servidor y en cliente.
 * Los estilos van en dashboard.css (solo sale dentro de /dashboard).
 */
export default function RachaSemana({ dias, etiqueta }: { dias: DiaRacha[]; etiqueta: string }) {
  return (
    <ol className="rs" aria-label={etiqueta}>
      {dias.map((d) => (
        <li
          key={d.dia}
          className={`rs-dia${d.encendido ? " is-on" : ""}${d.hoy ? " is-hoy" : ""}`}
          title={d.encendido ? "Día de racha" : undefined}
        >
          <span aria-hidden="true">{d.letra}</span>
          <span className="sr-only">{d.dia}{d.encendido ? ": cuenta" : ""}</span>
        </li>
      ))}
    </ol>
  );
}
