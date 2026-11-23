import Link from "next/link";
import Image from "next/image";
import SimboloEstudio from "@/components/cuaderno/SimboloEstudio";
import type { ReactNode } from "react";
import EnviarALaVista from "./EnviarALaVista";
import "./acceso.css";

import MarcaLogo from "@/components/MarcaLogo";
/**
 * La mesa de las pantallas de acceso (estilo «Cuaderno de estudio», 17-11-2026):
 * /login, /register, /forgot-password, /auth/reset-password y /mfa-challenge.
 *
 * · El formulario, centrado. Lleva el único <h1>.
 * · Sin apunte al lado ni efecto de hoja (18-11-2026, pedido por el admin): la
 *   página entera es blanca, como el formulario, y este va centrado.
 * · Estas pantallas no llevan la barra de la web, así que traen su propia marca.
 *   Sin el altavoz (18-11-2026, pedido por el admin): se silencia desde la barra
 *   del resto de la web, y la elección se recuerda.
 *
 * Neutro de papel con acentos naranja de marca: el acceso no es ninguna sección.
 */

export default function AccesoShell({
  nota,
  titulo,
  lead,
  icono,
  ilustracion,
  lado,
  children,
}: {
  /** La línea a mano sobre el titular. */
  nota: string;
  titulo: ReactNode;
  lead?: ReactNode;
  /** Un sello sobre el titular (el escudo del 2FA). */
  icono?: ReactNode;
  /** Una pegatina del cuaderno bajo el titular, solo en el ordenador (acceso.css). */
  ilustracion?: string;
  /** Algo más bajo la ilustración, solo en el ordenador (p. ej. los requisitos
   *  de la contraseña en el registro). */
  lado?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="acc">
      <EnviarALaVista />
      <header className="acc-cabeza">
        <Link href="/" className="acc-marca" aria-label="AdelinBTC Academy: ir a la portada">
          <MarcaLogo prioridad />
        </Link>
      </header>

      <div className="acc-mesa">
        <section className="acc-hoja" aria-labelledby="acc-titulo">
          {icono && <span className="acc-sello" aria-hidden="true">{icono}</span>}
          <p className="acc-nota">{nota}</p>
          <h1 id="acc-titulo" className="acc-titulo">{titulo}</h1>
          {lead && <p className="acc-lead">{lead}</p>}
          {ilustracion && (
            <span className="acc-ilustracion-caja">
              <Image src={ilustracion} alt="" width={840} height={627} className="acc-ilustracion" draggable={false} priority />
              {/* En el móvil, una flecha a mano que sale a la derecha y baja al formulario. */}
              {/* La flecha a mano del cuaderno (la misma del pósit del hero):
                  sale a la derecha y se curva hacia abajo. */}
              <SimboloEstudio tipo="flecha" color="naranja" giro={22} tamano={58} semilla={9} retraso={500} className="acc-ilustracion-flecha" />
            </span>
          )}
          {lado && <div className="acc-lado-pc" aria-hidden="true">{lado}</div>}
          <div className="acc-cuerpo">{children}</div>
        </section>
      </div>
    </main>
  );
}
