import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";

interface Props {
  /** «el Diario de Trading», «el Portfolio Adelin»: para los textos. */
  nombre: string;
  /** La herramienta en sí, tras el muro. */
  ruta: string;
  /** Texto del botón para quien ya tiene acceso: «Abrir mi diario». */
  abrir: string;
  logueado: boolean;
  premium: boolean;
}

/**
 * Los botones de una ficha de herramienta (/herramientas/diario y
 * /herramientas/portfolio). Van dos veces: bajo la cabecera y en el cierre.
 *
 * Quien ya es Premium abre la herramienta. El resto va directo a pagar: el
 * botón apunta a /api/checkout, que manda primero al registro si no hay sesión
 * y vuelve solo al pago (ver su ruta). Antes el único botón era «Ver qué
 * incluye Premium», un paso más justo donde más gente se cae.
 */
export default function AccesoHerramienta({ nombre, ruta, abrir, logueado, premium }: Props) {
  if (premium) {
    return (
      <div className="acceso">
        <Link href={ruta} className="acceso-btn">
          {abrir}
          <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <div className="acceso">
      <div className="acceso-fila">
        <Link href="/api/checkout" prefetch={false} className="acceso-btn">
          <Lock size={15} strokeWidth={2.4} aria-hidden="true" />
          Acceder a {nombre}
          <ArrowRight size={17} strokeWidth={2.4} aria-hidden="true" />
        </Link>
        <Link href="/premium" className="acceso-sec">
          Ver todo lo que incluye Premium
        </Link>
      </div>
      <p className="acceso-nota">
        <ShieldCheck size={13} aria-hidden="true" />
        Premium · 49,99 €/mes · Sin permanencia
        {!logueado && (
          <>
            {" "}· ¿Ya eres Premium? <Link href={`/login?next=${encodeURIComponent(ruta)}`}>Inicia sesión</Link>
          </>
        )}
      </p>
    </div>
  );
}
