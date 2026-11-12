import Link from "next/link";
import MarcoForo from "@/components/foro/MarcoForo";
import AceptarNormas from "@/components/foro/participar/AceptarNormas";
import { NORMAS_VERSION } from "@/lib/foro/limites";
import { LEGAL } from "@/lib/legal";
import "@/app/foro/normas.css";

/**
 * Las normas de la comunidad (FORO.md §13). Página pública: cualquiera puede
 * leerlas, y quien va a participar las acepta aquí. Se guarda la versión
 * aceptada (`NORMAS_VERSION`): si el texto cambia de fondo, se sube el número
 * aquí y en `foro_ajustes`, y todos vuelven a aceptarlas.
 *
 * Un índice a la izquierda, que se queda fijo, y las secciones numeradas a la
 * derecha. La de lo prohibido va marcada en rojo: es la que hay que leer.
 *
 * ⚠️ El texto es un borrador: falta la revisión legal de la fase 10.
 */

type Seccion = { id: string; titulo: string; prohibido?: boolean; cuerpo: React.ReactNode };

const SECCIONES: Seccion[] = [
  {
    id: "como-funciona",
    titulo: "Cómo funciona",
    cuerpo: (
      <ul>
        <li>Cualquiera puede leer el foro. Para preguntar, responder, valorar y reportar hace falta ser Premium.</li>
        <li>Firmas con tu alias y tu foto de perfil. Tu nombre y tu email no se enseñan nunca.</li>
        <li>Lo que publicas es público: lo puede leer cualquiera y puede aparecer en buscadores.</li>
        <li>Los mensajes se publican al momento, sin revisión previa. Un filtro automático rechaza lo que incumple estas normas, y la comunidad y la academia retiran lo que se le escapa.</li>
      </ul>
    ),
  },
  {
    id: "prohibido",
    titulo: "Lo que no se puede publicar",
    prohibido: true,
    cuerpo: (
      <ul>
        <li><b>Estafas y ofertas de inversión.</b> Nada de prometer ganancias, gestionar el dinero de otros, vender señales ni captar para ningún producto.</li>
        <li><b>Contacto fuera del foro.</b> No se pide ni se ofrece hablar por privado, WhatsApp, Telegram, Discord ni por ninguna otra vía. Lo que se responde, se responde aquí, a la vista de todos.</li>
        <li><b>Frases semilla y claves privadas.</b> Ni las tuyas ni las de nadie, tampoco «para que me ayudéis».</li>
        <li><b>Datos personales.</b> Ni teléfonos, ni correos, ni direcciones, ni nombres de terceros.</li>
        <li><b>Direcciones de cartera para pedir fondos</b>, donaciones incluidas.</li>
        <li><b>Códigos y enlaces de referido</b> o de afiliado.</li>
        <li><b>Enlaces</b> a webs que no estén en la lista permitida: esta academia, YouTube, exploradores de bloques y webs oficiales.</li>
        <li><b>Suplantar</b> a la academia, a su equipo, a un exchange o a su soporte.</li>
        <li><b>Insultos, acoso y lenguaje malsonante.</b> Se discuten las ideas, no a las personas.</li>
        <li><b>Spam</b>, mensajes repetidos y contenido que no tenga que ver con las criptomonedas.</li>
        <li><b>Contenido ilegal</b> de cualquier tipo.</li>
      </ul>
    ),
  },
  {
    id: "no-es-asesoramiento",
    titulo: "Lo que se dice aquí no es asesoramiento",
    cuerpo: (
      <p>
        Las preguntas y respuestas son opiniones de quien las escribe, no de AdelinBTC Academy, y no son
        asesoramiento financiero, fiscal ni legal. Nadie en el foro puede garantizarte un resultado. Contrasta
        siempre lo que leas antes de tomar una decisión con tu dinero.
      </p>
    ),
  },
  {
    id: "valorar",
    titulo: "Valorar y elegir respuesta",
    cuerpo: (
      <ul>
        <li>Puedes dar «me gusta» a las respuestas y etiquetar las preguntas como Interesante, Gracias o Yo también. No a lo que has escrito tú.</li>
        <li>Quien pregunta puede elegir la respuesta que le ha resuelto la duda. Al elegirla, el hilo queda resuelto y no admite más respuestas. La elección no se puede cambiar.</li>
        <li>Ayudar da puntos, y los puntos dan un nivel que se ve junto a tu alias. Ponerse de acuerdo para votarse no sirve: los puntos tienen tope y se revisan.</li>
      </ul>
    ),
  },
  {
    id: "tus-mensajes",
    titulo: "Tus mensajes",
    cuerpo: (
      <ul>
        <li>Puedes editar un mensaje durante los 30 minutos siguientes a publicarlo.</li>
        <li>Puedes borrar tus respuestas cuando quieras, salvo la elegida, y tu pregunta mientras nadie haya respondido.</li>
        <li>Si borras tu cuenta, tus mensajes se quedan publicados sin tu alias, como «Usuario eliminado». Si además quieres que se borren, pídelo.</li>
        <li>Si dejas de ser Premium, lo que publicaste se queda; solo dejas de poder participar.</li>
      </ul>
    ),
  },
  {
    id: "moderacion",
    titulo: "Moderación",
    cuerpo: (
      <ul>
        <li>Cualquier Premium puede reportar un mensaje. Con varios reportes, el mensaje se oculta hasta que la academia lo revise.</li>
        <li>La academia puede ocultar, corregir o borrar un mensaje, y te dirá siempre el motivo.</li>
        <li>Incumplir las normas tiene consecuencias, por este orden: un aviso, una suspensión del foro de 7 días, otra de 30 y la expulsión. Una estafa, publicar la frase semilla de otra persona o hacerse pasar por la academia suponen la expulsión directa.</li>
        <li>Una sanción en el foro no afecta al resto de tu suscripción Premium.</li>
        <li>Reportar en falso de forma repetida hace perder la posibilidad de reportar.</li>
      </ul>
    ),
  },
  {
    id: "contenido-ilicito",
    titulo: "Avisar de contenido ilícito",
    cuerpo: (
      <p>
        Si no eres Premium y ves en el foro algo que creas ilícito, escribe a{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> indicando la dirección de la página y el motivo. Se
        revisa igual que un reporte.
      </p>
    ),
  },
];

const dos = (n: number) => String(n).padStart(2, "0");

export default function VistaNormas({ conSesion }: { conSesion: boolean }) {
  return (
    <MarcoForo conSesion={conSesion}>
      <nav className="fo-migas" aria-label="Estás en">
        <Link href="/foro">Foro</Link>
      </nav>

      <header className="fn-cabecera">
        <span className="fo-antetitulo">
          <span className="fo-antetitulo-punto" aria-hidden="true" />
          Normas · versión {NORMAS_VERSION}
        </span>
        <h1 className="fo-titulo">Un sitio útil y <em>seguro</em>.</h1>
        <p className="fo-entradilla">
          El foro es para resolver dudas reales sobre criptomonedas entre personas que quieren aprender. Estas
          normas existen para que siga siendo un sitio útil y seguro.
        </p>
      </header>

      <div className="fn-rejilla">
        <nav className="fn-indice" aria-label="Secciones de las normas">
          <ol>
            {SECCIONES.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span aria-hidden="true">{dos(i + 1)}</span>
                  {s.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="fn-texto">
          {SECCIONES.map((s, i) => (
            <section key={s.id} id={s.id} className={`fn-seccion fo-tarjeta${s.prohibido ? " es-prohibido" : ""}`}>
              <span className="fn-num" aria-hidden="true">{dos(i + 1)}</span>
              <h2>{s.titulo}</h2>
              {s.cuerpo}
            </section>
          ))}

          <AceptarNormas version={NORMAS_VERSION} conSesion={conSesion} />
        </div>
      </div>
    </MarcoForo>
  );
}
