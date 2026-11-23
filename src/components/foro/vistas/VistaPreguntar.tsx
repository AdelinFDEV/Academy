import Image from "next/image";
import Link from "next/link";
import { Info, Lightbulb, ShieldAlert } from "lucide-react";
import MarcoForo from "@/components/foro/MarcoForo";
import FormPregunta from "@/components/foro/participar/FormPregunta";
import Invitacion from "@/components/foro/participar/Invitacion";
import { LIMITES } from "@/lib/foro/limites";
import "@/app/foro/preguntar.css";

/**
 * Hacer una pregunta: el formulario a la izquierda y, a la derecha, lo que
 * hace que una pregunta reciba buenas respuestas y lo que nunca se publica.
 *
 * `motivo` es lo que le falta a quien mira para poder participar (`null` si
 * puede): lo decide el servidor, y con motivo sale la invitación en vez del
 * formulario.
 */
export default function VistaPreguntar({
  conSesion,
  aviso,
  motivo,
  categorias,
}: {
  conSesion: boolean;
  aviso: string | null;
  motivo: string | null;
  categorias: { slug: string; nombre: string }[];
}) {
  return (
    <MarcoForo conSesion={conSesion}>
      {/* La cabecera (23-11-2026, rehecha a petición del admin): corta, sin
          migas ni entradilla, porque quien llega aquí ya sabe a qué viene.
          Una franja en el coral del foro con el título y, a la derecha, el
          boli escribiendo y el «?» asomando. */}
      <header className="fqc">
        <div className="fqc-texto">
          <h1 className="fqc-titulo">Nueva pregunta</h1>
          <p className="fqc-nota">la comunidad te responde</p>
        </div>
        <div className="fqc-pegatinas" aria-hidden="true">
          <Image src="/cuaderno/boli-pegatina.webp" alt="" width={130} height={458} className="fqc-boli" draggable={false} />
          <Image src="/cuaderno/pregunta-pegatina.webp" alt="" width={225} height={300} className="fqc-pregunta" draggable={false} />
        </div>
      </header>

      {aviso && (
        <p className="fo-aviso" role="status">
          <Info size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      )}

      <div className="fq-rejilla">
        <div className="fq-principal">
          {motivo === null ? (
            <>
              <FormPregunta categorias={categorias} />
              <p className="fq-normas">
                Al publicar aceptas las <Link href="/foro/normas">normas del foro</Link>.
              </p>
            </>
          ) : (
            <Invitacion motivo={motivo} />
          )}
        </div>

        <aside className="fq-lateral" aria-label="Consejos">
          <section className="fq-caja fq-caja--postit">
            <h2 className="fq-caja-titulo">
              <Lightbulb size={20} strokeWidth={2.4} aria-hidden="true" />
              Una buena pregunta
            </h2>
            <ol className="fq-pasos">
              <li><b>El título es la pregunta.</b> Entera, en una frase, como se la harías a alguien.</li>
              <li><b>Cuenta el contexto.</b> Qué has hecho, qué esperabas y qué ha pasado.</li>
              <li><b>Una duda por pregunta.</b> Si tienes dos, haz dos: así cada una encuentra su respuesta.</li>
              <li><b>Elige la respuesta que te sirva.</b> El hilo queda resuelto y ayuda al siguiente.</li>
            </ol>
          </section>

          <section className="fq-caja fq-caja--cuidado">
            <h2 className="fq-caja-titulo">
              <span className="fq-caja-icono" aria-hidden="true"><ShieldAlert size={18} strokeWidth={2.5} /></span>
              Nunca publiques
            </h2>
            <ul className="fq-nunca">
              <li>Frases semilla ni claves privadas</li>
              <li>Teléfonos, correos ni datos personales</li>
              <li>Enlaces o códigos de referido</li>
            </ul>
            <p>Lo que publicas es público y se puede editar solo durante {LIMITES.minutosParaEditar} minutos.</p>
          </section>
        </aside>
      </div>
    </MarcoForo>
  );
}
