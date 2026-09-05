"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, User, ChevronDown, LogOut } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

/**
 * El nombre de quien ha iniciado sesión, en la barra, y su menú.
 *
 * Pulsarlo abre las dos cosas que busca alguien con cuenta: su panel y su
 * cuenta. Antes «Mi dashboard» era un botón suelto al lado; se metió aquí
 * porque dos accesos personales pegados el uno al otro compiten por el mismo
 * espacio y por la misma mirada.
 *
 * El saludo cambia con la hora, y por eso esto es un componente de cliente: la
 * hora buena es la del visitante, no la del servidor. Calcularlo arriba daría
 * «buenas noches» a mediodía a media España, que es el mismo error que ya se
 * cometió con el Radar. Hasta que monta se lee «Hola», que siempre vale.
 */
/**
 * Los saludos, por franja del día y con el vocabulario de la casa.
 *
 * Se elige uno al azar en cada carga: la barra es lo que más veces ve alguien
 * que entra a diario, y un texto fijo deja de leerse a la tercera visita.
 *
 * Dos reglas al añadir frases:
 *
 * 1. **DOS PALABRAS.** El hueco es una línea diminuta en mayúsculas, y las
 *    mayúsculas ocupan mucho más de lo que parece. «El mercado no duerme» y
 *    «Cierra el portátil» se cortaban a media palabra, que queda peor que no
 *    poner nada.
 * 2. **Nada que pueda ser falso.** Se habla de la hora, no del estado del
 *    mercado: «Wall Street abierto» a las 13:00 de España sería mentira la
 *    mitad de los días, y una barra que miente en algo pequeño resta
 *    credibilidad a lo que dice en lo grande.
 */
const SALUDOS: Record<string, string[]> = {
  madrugada: ["Modo insomnio", "Velas nocturnas", "Cripto 24/7", "Aún despierto"],
  manana: ["Buenos días", "Día nuevo", "Modo trader", "Vela verde"],
  tarde: ["Buenas tardes", "Al lío", "Sesión activa", "Modo gráfico"],
  noche: ["Buenas noches", "Modo HODL", "Hasta mañana", "Cierra gráficos"],
};

function franjaDe(hora: number): string {
  if (hora < 6) return "madrugada";
  if (hora < 13) return "manana";
  if (hora < 21) return "tarde";
  return "noche";
}

function saludoDeLaHora(hora: number): string {
  const opciones = SALUDOS[franjaDe(hora)];
  return opciones[Math.floor(Math.random() * opciones.length)];
}

export default function NavSaludo({ nombre }: { nombre: string }) {
  const [saludo, setSaludo] = useState("Hola");
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSaludo(saludoDeLaHora(new Date().getHours()));
  }, []);

  // Cerrar al pulsar fuera o con Escape. Sin esto el menú se queda abierto
  // mientras navegas y tapa la esquina de la página.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    window.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      window.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  // Solo el nombre de pila: «Jorge Adelin Gombos» no cabe en una barra, y en el
  // saludo suena a carta del banco.
  const pila = nombre.trim().split(/\s+/)[0] ?? nombre;
  const inicial = pila.charAt(0).toUpperCase();

  return (
    <div className="nav-saludo-wrap" ref={caja}>
      <button
        type="button"
        className={`nav-saludo${abierto ? " is-abierto" : ""}`}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Menú de ${nombre}`}
        title={`Has iniciado sesión como ${nombre}`}
      >
        <span className="nav-saludo-avatar" aria-hidden="true">{inicial}</span>
        <span className="nav-saludo-texto">
          <span className="nav-saludo-hola">{saludo},</span>
          <span className="nav-saludo-nombre">{pila}</span>
        </span>
        <ChevronDown className="nav-saludo-flecha" size={14} strokeWidth={2.4} aria-hidden="true" />
      </button>

      {abierto && (
        <div className="nav-saludo-menu" role="menu">
          <Link
            href="/dashboard"
            className="nav-saludo-item"
            role="menuitem"
            onClick={() => setAbierto(false)}
          >
            <LayoutDashboard size={15} strokeWidth={2.1} aria-hidden="true" />
            Mi dashboard
          </Link>
          <Link
            href="/cuenta"
            className="nav-saludo-item"
            role="menuitem"
            onClick={() => setAbierto(false)}
          >
            <User size={15} strokeWidth={2.1} aria-hidden="true" />
            Mi cuenta
          </Link>

          {/* Cerrar sesión reutiliza LogoutButton, que es quien sabe limpiar
              la sesión de verdad. Solo cambia el traje. */}
          <LogoutButton className="nav-saludo-salir" onDone={() => setAbierto(false)}>
            <LogOut size={15} strokeWidth={2.1} aria-hidden="true" />
            Cerrar sesión
          </LogoutButton>
        </div>
      )}
    </div>
  );
}
