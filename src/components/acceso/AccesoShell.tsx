import Link from "next/link";
import type { ReactNode } from "react";
import InterruptorSonido from "@/components/cuaderno/InterruptorSonido";
import TarjetaEstudio, { type ColorTarjeta } from "@/components/cuaderno/TarjetaEstudio";
import EnviarALaVista from "./EnviarALaVista";
import "./acceso.css";

/**
 * La mesa de las pantallas de acceso (estilo «Cuaderno de estudio», 17-11-2026):
 * /login, /register, /forgot-password, /auth/reset-password y /mfa-challenge.
 *
 * · A la izquierda, la hoja del cuaderno con el formulario. Lleva el único <h1>.
 * · A la derecha, un apunte de seguridad: una tarjeta de estudio que se gira y un
 *   pósit. Es contenido de verdad (qué es el 2FA, qué hace fuerte una
 *   contraseña…), no una promesa del producto. En el móvil se esconde: ahí
 *   solo estorbaría al formulario.
 * · Estas pantallas no llevan la barra de la web, así que traen su propia marca
 *   y el altavoz: los sonidos vienen encendidos y silenciarlos tiene que estar
 *   siempre a mano (ESTILO.md, «Los sonidos»).
 *
 * Neutro de papel con acentos naranja de marca: el acceso no es ninguna sección.
 */

export interface Apunte {
  tema: string;
  pregunta: string;
  respuesta: string;
  detalle: string;
  color: ColorTarjeta;
  /** El pósit pegado sobre la tarjeta. */
  postit: string;
  /** La nota a mano de debajo. */
  nota: string;
}

export default function AccesoShell({
  nota,
  titulo,
  lead,
  icono,
  apunte,
  children,
}: {
  /** La línea a mano sobre el titular. */
  nota: string;
  titulo: ReactNode;
  lead?: ReactNode;
  /** Un sello sobre el titular (el escudo del 2FA). */
  icono?: ReactNode;
  apunte: Apunte;
  children: ReactNode;
}) {
  return (
    <main className="acc">
      <EnviarALaVista />
      <header className="acc-cabeza">
        <Link href="/" className="acc-marca" aria-label="AdelinBTC Academy: ir a la portada">
          Adelin<em>BTC</em>
        </Link>
        <InterruptorSonido />
      </header>

      <div className="acc-mesa">
        <section className="acc-hoja" aria-labelledby="acc-titulo">
          {icono && <span className="acc-sello" aria-hidden="true">{icono}</span>}
          <p className="acc-nota">{nota}</p>
          <h1 id="acc-titulo" className="acc-titulo">{titulo}</h1>
          {lead && <p className="acc-lead">{lead}</p>}
          <div className="acc-cuerpo">{children}</div>
        </section>

        <aside className="acc-lado" aria-label="Apunte de seguridad">
          <span className="acc-postit" aria-hidden="true">{apunte.postit}</span>
          <TarjetaEstudio
            className="acc-tarjeta"
            color={apunte.color}
            tema={apunte.tema}
            pregunta={apunte.pregunta}
            respuesta={apunte.respuesta}
            detalle={apunte.detalle}
          />
          <p className="acc-apunte">{apunte.nota}</p>
        </aside>
      </div>
    </main>
  );
}
