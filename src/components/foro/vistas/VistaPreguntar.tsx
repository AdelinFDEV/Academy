import Link from "next/link";
import { Info, Lightbulb, ShieldAlert } from "lucide-react";
import MarcoForo from "@/components/foro/MarcoForo";
import FormPregunta from "@/components/foro/participar/FormPregunta";
import Invitacion from "@/components/foro/participar/Invitacion";
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
      <nav className="fo-migas" aria-label="Estás en">
        <Link href="/foro">Foro</Link>
      </nav>

      <header className="fq-cabecera">
        <span className="fo-antetitulo">
          <span className="fo-antetitulo-punto" aria-hidden="true" />
          Nueva pregunta
        </span>
        <h1 className="fo-titulo">Pregunta lo que <em>necesitas</em> saber.</h1>
        <p className="fo-entradilla">
          Una duda concreta y bien explicada recibe mejores respuestas. Antes de preguntar, mira si alguien ya la ha
          planteado.
        </p>
      </header>

      {aviso && (
        <p className="fo-aviso" role="status">
          <Info size={18} strokeWidth={2.2} aria-hidden="true" />
          <span>{aviso}</span>
        </p>
      )}

      <div className="fq-rejilla">
        <div className="fq-principal">
          {motivo === null ? <FormPregunta categorias={categorias} /> : <Invitacion motivo={motivo} />}
          <p className="fq-normas">
            Al publicar aceptas las <Link href="/foro/normas">normas del foro</Link>.
          </p>
        </div>

        <aside className="fq-lateral" aria-label="Consejos">
          <section className="fq-caja fo-tarjeta">
            <h2 className="fq-caja-titulo">
              <Lightbulb size={17} strokeWidth={2.2} aria-hidden="true" />
              Una buena pregunta
            </h2>
            <ol className="fq-pasos">
              <li><b>El título es la pregunta.</b> Entera, en una frase, como se la harías a alguien.</li>
              <li><b>Cuenta el contexto.</b> Qué has hecho, qué esperabas y qué ha pasado.</li>
              <li><b>Una duda por pregunta.</b> Si tienes dos, haz dos: así cada una encuentra su respuesta.</li>
              <li><b>Elige la respuesta que te sirva.</b> El hilo queda resuelto y ayuda al siguiente.</li>
            </ol>
          </section>

          <section className="fq-caja fq-caja--cuidado fo-tarjeta">
            <h2 className="fq-caja-titulo">
              <ShieldAlert size={17} strokeWidth={2.2} aria-hidden="true" />
              Nunca publiques
            </h2>
            <ul className="fq-nunca">
              <li>Frases semilla ni claves privadas</li>
              <li>Teléfonos, correos ni datos personales</li>
              <li>Enlaces o códigos de referido</li>
            </ul>
            <p>Lo que publicas es público y se puede editar solo durante 30 minutos.</p>
          </section>
        </aside>
      </div>
    </MarcoForo>
  );
}
