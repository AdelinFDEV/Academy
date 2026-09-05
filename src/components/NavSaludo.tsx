"use client";

import { useEffect, useState } from "react";

/**
 * El saludo con el nombre en la barra superior.
 *
 * El saludo cambia con la hora, y por eso es un componente de cliente: la hora
 * buena es la del visitante, no la del servidor. Calcularlo en el servidor daría
 * «buenas noches» a mediodía a media España, que es el mismo error que ya se
 * cometió con el Radar.
 *
 * Hasta que monta, se enseña «Hola»: siempre vale y no deja el hueco vacío.
 */
function saludoDeLaHora(hora: number): string {
  if (hora >= 6 && hora < 13) return "Buenos días";
  if (hora >= 13 && hora < 21) return "Buenas tardes";
  return "Buenas noches";
}

export default function NavSaludo({ nombre }: { nombre: string }) {
  const [saludo, setSaludo] = useState("Hola");

  useEffect(() => {
    setSaludo(saludoDeLaHora(new Date().getHours()));
  }, []);

  // Solo el nombre de pila: «Jorge Adelin Gombos» no cabe en una barra, y en el
  // saludo suena a carta del banco.
  const pila = nombre.trim().split(/\s+/)[0] ?? nombre;
  const inicial = pila.charAt(0).toUpperCase();

  return (
    <span className="nav-saludo" title={`Has iniciado sesión como ${nombre}`}>
      <span className="nav-saludo-avatar" aria-hidden="true">{inicial}</span>
      <span className="nav-saludo-texto">
        <span className="nav-saludo-hola">{saludo},</span>
        <span className="nav-saludo-nombre">{pila}</span>
      </span>
    </span>
  );
}
