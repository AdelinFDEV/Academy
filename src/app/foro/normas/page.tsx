import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import AceptarNormas from "@/components/foro/participar/AceptarNormas";
import { NORMAS_VERSION } from "@/lib/foro/limites";
import { entradaAlForo } from "@/lib/foro/permisos";
import { LEGAL } from "@/lib/legal";
import "../normas.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { modo } = await entradaAlForo();
  return {
    title: "Normas del foro",
    description: "Las normas de la comunidad del foro: qué se puede publicar, qué no y cómo se modera.",
    alternates: { canonical: "/foro/normas" },
    robots: modo === "abierto" ? undefined : { index: false, follow: false },
  };
}

/**
 * Las normas de la comunidad (FORO.md §13). Página pública: cualquiera puede
 * leerlas, y quien va a participar las acepta aquí. Se guarda la versión
 * aceptada (`NORMAS_VERSION`): si el texto cambia de fondo, se sube el número
 * aquí y en `foro_ajustes`, y todos vuelven a aceptarlas.
 *
 * ⚠️ El texto es un borrador: falta la revisión legal de la fase 10.
 */
export default async function NormasPage() {
  const { visible, usuarioId } = await entradaAlForo();
  if (!visible) notFound();

  return (
    <div className="blog-page">
      <SiteNav user={usuarioId !== null} />

      <main className="blog-main fo-main fn-main">
        <nav className="fo-migas" aria-label="Estás en">
          <Link href="/foro">Foro</Link>
        </nav>

        <header className="fo-cabecera">
          <span className="fo-antetitulo">Versión {NORMAS_VERSION}</span>
          <h1 className="fo-titulo">Normas del foro</h1>
          <p className="fo-entradilla">
            El foro es para resolver dudas reales sobre criptomonedas entre personas que quieren aprender. Estas
            normas existen para que siga siendo un sitio útil y seguro.
          </p>
        </header>

        <div className="fn-texto">
          <h2>Cómo funciona</h2>
          <ul>
            <li>Cualquiera puede leer el foro. Para preguntar, responder, valorar y reportar hace falta ser Premium.</li>
            <li>Firmas con tu alias y tu foto de perfil. Tu nombre y tu email no se enseñan nunca.</li>
            <li>Lo que publicas es público: lo puede leer cualquiera y puede aparecer en buscadores.</li>
            <li>Los mensajes se publican al momento, sin revisión previa. Un filtro automático rechaza lo que incumple estas normas, y la comunidad y la academia retiran lo que se le escapa.</li>
          </ul>

          <h2>Lo que no se puede publicar</h2>
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

          <h2>Lo que se dice aquí no es asesoramiento</h2>
          <p>
            Las preguntas y respuestas son opiniones de quien las escribe, no de AdelinBTC Academy, y no son
            asesoramiento financiero, fiscal ni legal. Nadie en el foro puede garantizarte un resultado. Contrasta
            siempre lo que leas antes de tomar una decisión con tu dinero.
          </p>

          <h2>Valorar y elegir respuesta</h2>
          <ul>
            <li>Puedes dar «me gusta» a las respuestas y etiquetar las preguntas como Interesante, Gracias o Yo también. No a lo que has escrito tú.</li>
            <li>Quien pregunta puede elegir la respuesta que le ha resuelto la duda. Al elegirla, el hilo queda resuelto y no admite más respuestas. La elección no se puede cambiar.</li>
            <li>Ayudar da puntos, y los puntos dan un nivel que se ve junto a tu alias. Ponerse de acuerdo para votarse no sirve: los puntos tienen tope y se revisan.</li>
          </ul>

          <h2>Tus mensajes</h2>
          <ul>
            <li>Puedes editar un mensaje durante los 30 minutos siguientes a publicarlo.</li>
            <li>Puedes borrar tus respuestas cuando quieras, salvo la elegida, y tu pregunta mientras nadie haya respondido.</li>
            <li>Si borras tu cuenta, tus mensajes se quedan publicados sin tu alias, como «Usuario eliminado». Si además quieres que se borren, pídelo.</li>
            <li>Si dejas de ser Premium, lo que publicaste se queda; solo dejas de poder participar.</li>
          </ul>

          <h2>Moderación</h2>
          <ul>
            <li>Cualquier Premium puede reportar un mensaje. Con varios reportes, el mensaje se oculta hasta que la academia lo revise.</li>
            <li>La academia puede ocultar, corregir o borrar un mensaje, y te dirá siempre el motivo.</li>
            <li>Incumplir las normas tiene consecuencias, por este orden: un aviso, una suspensión del foro de 7 días, otra de 30 y la expulsión. Una estafa, publicar la frase semilla de otra persona o hacerse pasar por la academia suponen la expulsión directa.</li>
            <li>Una sanción en el foro no afecta al resto de tu suscripción Premium.</li>
            <li>Reportar en falso de forma repetida hace perder la posibilidad de reportar.</li>
          </ul>

          <h2>Avisar de contenido ilícito</h2>
          <p>
            Si no eres Premium y ves en el foro algo que creas ilícito, escribe a{" "}
            <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> indicando la dirección de la página y el motivo. Se
            revisa igual que un reporte.
          </p>
        </div>

        <AceptarNormas version={NORMAS_VERSION} conSesion={usuarioId !== null} />
      </main>

      <Footer />
    </div>
  );
}
