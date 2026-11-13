import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import GuideProgressBar from "@/components/GuideProgressBar";
import GuideHeroStats from "@/components/GuideHeroStats";
import GuideFlipCards from "@/components/GuideFlipCards";
import GuideInteractions from "@/components/GuideInteractions";
import GuideBreadcrumbJsonLd from "@/components/GuideBreadcrumbJsonLd";
import GuiasRelacionadas from "@/components/GuiasRelacionadas";
import GuideQuizCuenta from "@/components/GuideQuizCuenta";
import DisclaimerRiesgo from "@/components/DisclaimerRiesgo";
import GuideDiarioCalc from "./GuideDiarioCalc";
import GuideDiarioQuiz from "./GuideDiarioQuiz";
import GuiaDiarioCta, { type EstadoLector } from "./GuiaDiarioCta";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import "./como-hacer-un-diario-de-trading.css";

/**
 * Guía «Cómo hacer un diario de trading» (10-11-2026).
 *
 * Nace de la mejora SEO de la ficha del Diario: quien busca «diario de
 * trading» casi siempre quiere aprender a llevarlo, no comprar nada, y una
 * página de venta no compite con esa intención. Esta guía la responde entera
 * —sirve con cuaderno o con Excel—. No la conviertas en un anuncio: si deja
 * de responder a la pregunta, deja de posicionar.
 *
 * Desde el 11-11-2026 (pedido por el admin) lleva LLAMADAS al Diario y a Nova
 * para que quien llegue sepa que existen y se registre (GuiaDiarioCta.tsx).
 * La regla para que convivan con el SEO: van DESPUÉS de responder, como
 * bloques aparte, y el texto de la guía no cambia por ellas. Una línea bajo el
 * hero, una franja tras los 5 pasos, el escaparate en «Dónde llevarlo» y el
 * cierre tras el quiz. Ninguna antes de los 5 pasos.
 */

const SLUG = "como-hacer-un-diario-de-trading";

export const metadata: Metadata = {
  alternates: { canonical: "/guias/como-hacer-un-diario-de-trading" },
  title: "Cómo hacer un diario de trading, paso a paso",
  description:
    "Cómo hacer un diario de trading: qué apuntar en cada operación, qué cifras mirar, cómo revisarlo y los errores que lo vuelven inútil. Con calculadora.",
  openGraph: {
    title: "Cómo hacer un diario de trading: qué apuntar y qué cifras mirar",
    description:
      "Los campos de cada operación, el win rate, los múltiplos de R y la esperanza, la rutina de revisión y los errores típicos. Con calculadora, quiz y badge.",
    type: "article",
  },
};

const SECTIONS = [
  { id: "pasos", label: "En 5 pasos" },
  { id: "que-es", label: "Qué es" },
  { id: "que-apuntar", label: "Qué apuntar" },
  { id: "cifras", label: "Las cifras" },
  { id: "emociones", label: "Emociones" },
  { id: "revisar", label: "Revisarlo" },
  { id: "errores", label: "Errores" },
  { id: "donde", label: "Dónde llevarlo" },
  { id: "hacienda", label: "Hacienda" },
  { id: "glosario", label: "Glosario" },
  { id: "quiz", label: "Quiz" },
];

const HERO_STATS = [
  { prefix: "", value: 30, suffix: "", dec: 0, label: "Operaciones para que\nlas cifras signifiquen algo" },
  { prefix: "", value: 1, suffix: " min", dec: 0, label: "Lo que cuesta apuntar\ncada operación" },
  { prefix: "", value: 2, suffix: " %", dec: 0, label: "Riesgo máximo habitual\npor operación" },
  { prefix: "", value: 4, suffix: "", dec: 0, label: "Cifras que deciden\nsi tu método funciona" },
];

/** La respuesta corta, arriba: quien busca «cómo hacer…» quiere los pasos. */
const PASOS_RESUMEN = [
  { t: "Elige dónde", d: "Un cuaderno, una hoja de cálculo o una herramienta. Vale el que vayas a abrir cada día." },
  { t: "Fija la plantilla", d: "Los mismos campos en cada operación: activo, entrada, stop, riesgo, motivo, ánimo y resultado." },
  { t: "Apunta en el momento", d: "El plan y el motivo al entrar; el resultado y si seguiste el plan, al salir." },
  { t: "Calcula cuatro cifras", d: "Win rate, ganancia y pérdida medias, resultado en R y esperanza por operación." },
  { t: "Revísalo con calendario", d: "Cada semana, las que se saltaron el plan; cada mes, las cifras; cada 30 operaciones, los desgloses." },
];

/** Los campos de cada operación: los de antes de entrar y los de después. */
const CAMPOS_ANTES: [string, React.ReactNode][] = [
  ["Fecha y hora", "Para ver luego a qué horas y qué días operas mejor."],
  ["Activo y dirección", <>Por ejemplo, <Link href="/glosario/bitcoin">BTC</Link>/USDT <Link href="/glosario/long-short">long</Link>. Sin esto no puedes desglosar por par.</>],
  ["Temporalidad", "El gráfico en el que decides: 15 minutos, 4 horas, diario. Mezclarlas falsea las cifras."],
  ["Precio de entrada", "El precio real al que entraste, no el que querías."],
  ["Stop-loss", <>Dónde sales si te equivocas: tu <Link href="/glosario/stop-loss">stop-loss</Link>. Define tu riesgo.</>],
  ["Objetivo", <>Dónde piensas recoger beneficios, tu <Link href="/glosario/take-profit">take-profit</Link>, si lo tienes.</>],
  ["Tamaño y riesgo", "Cuánto dinero pones y cuánto pierdes si salta el stop."],
  ["Estrategia", "La configuración que operas: ruptura, rango, tendencia…"],
  ["Por qué entras", "Una frase. Si no sabes escribirla, no tienes motivo."],
  ["Cómo te sientes", "Tranquilo, eufórico, cansado, con ganas de recuperar."],
  ["Captura del gráfico", "Una imagen de cómo estaba el precio al entrar. Al revisar, vale más que cualquier nota."],
];

const CAMPOS_DESPUES: [string, string][] = [
  ["Precio de salida", "Y si saliste por el stop, por el objetivo o a mano."],
  ["Resultado", "En euros, en % del capital y en múltiplos de R."],
  ["¿Seguiste el plan?", "Sí o no, sin matices. Es la columna más reveladora."],
  ["Una nota", "Qué harías distinto. Dos líneas bastan."],
];

const PASOS_REVISION = [
  { t: "Cada operación", d: "Apuntar los campos de antes al entrar y los de después al salir. Un minuto, en el momento: de memoria se maquilla." },
  { t: "Cada semana", d: "Leer las operaciones de la semana y marcar las que se saltaron el plan. Contar cuántas fueron y cuánto costaron." },
  { t: "Cada mes", d: "Calcular el win rate, la ganancia y la pérdida medias, el resultado en R y la caída máxima. Compararlas con el mes anterior." },
  { t: "Cada 30 operaciones", d: "Desglosar por estrategia, activo, hora y ánimo. Dejar de operar lo que pierde y apuntar más de lo que gana." },
];

const ERRORES = [
  {
    title: "Apuntar solo los números",
    frontText: "El resultado no explica nada...",
    backText1: "Con precio de entrada, salida y resultado sabes qué pasó, pero no por qué. No puedes separar una buena decisión que salió mal de una mala que salió bien.",
    backText2: "El motivo de la entrada y si seguiste el plan son las dos columnas que convierten una lista de números en un diario.",
  },
  {
    title: "Dejarlo en la mala racha",
    frontText: "Justo cuando más enseña...",
    backText1: "Casi todo el mundo deja de apuntar cuando pierde, por pura incomodidad. Las estadísticas quedan infladas y el diario se vuelve inútil.",
    backText2: "Las pérdidas son la parte que más información da: dicen si son normales en tu método o si te has saltado tus reglas.",
  },
  {
    title: "Apuntar tarde y de memoria",
    frontText: "La memoria maquilla...",
    backText1: "Si apuntas al final del día, el motivo de la entrada se reescribe solo con lo que pasó después. Siempre parece más razonable de lo que fue.",
    backText2: "Apunta el porqué antes de entrar, o justo al entrar. Es un minuto, y es el único momento en que es verdad.",
  },
  {
    title: "Sacar conclusiones con diez operaciones",
    frontText: "Diez no son una muestra...",
    backText1: "Con diez operaciones, un 70 % de acierto puede ser suerte y un 30 % mala racha. Cambiar de estrategia cada diez operaciones es no saber nunca cuál funciona.",
    backText2: "Como referencia, a partir de treinta operaciones las medias empiezan a describir tu forma de operar.",
  },
  {
    title: "No medir el riesgo",
    frontText: "Sin stop, no hay R...",
    backText1: "Si no apuntas dónde estaba el stop, no sabes cuánto arriesgabas, y sin eso no puedes medir en múltiplos de R ni comparar operaciones.",
    backText2: "Una ganancia de 100 € es buena si arriesgabas 50 € y mala si arriesgabas 400 €. El resultado solo se entiende al lado del riesgo.",
  },
  {
    title: "Mirar solo el win rate",
    frontText: "Acertar mucho no es ganar...",
    backText1: "Un 75 % de acierto pierde dinero si cada pérdida borra cuatro ganancias. Es el patrón de quien cierra pronto lo que gana y aguanta lo que pierde.",
    backText2: "El win rate se lee siempre junto a la ganancia media y la pérdida media.",
  },
];

const GLOSSARY_CARDS = [
  {
    title: "Diario de trading",
    frontText: "El registro de cómo operas...",
    backText1: "La lista de todas tus operaciones con su riesgo, su resultado y su porqué. En inglés, trading journal.",
    backText2: "Sirve para medir cómo operas de verdad en vez de fiarte de la memoria, que recuerda los aciertos y olvida las pérdidas.",
  },
  {
    title: "R (múltiplo de R)",
    frontText: "Medir en lo que arriesgas...",
    backText1: "R es lo que pierdes si salta el stop. Una operación que gana el doble de lo arriesgado es +2 R; una que pierde lo previsto, −1 R.",
    backText2: "Permite comparar operaciones de tamaños distintos y ver si tus ganadoras compensan a tus perdedoras.",
  },
  {
    title: "Win rate",
    frontText: "Cuántas veces aciertas...",
    backText1: "El porcentaje de operaciones que cierran con ganancia.",
    backText2: "Solo es la mitad de la historia: sin la ganancia y la pérdida medias no dice si ganas dinero.",
  },
  {
    title: "Esperanza matemática",
    frontText: "Lo que deja cada operación...",
    backText1: "El resultado medio por operación si repites tu método muchas veces: win rate × ganancia media − (1 − win rate) × pérdida media.",
    backText2: "Si es negativa, operar más solo acelera las pérdidas.",
  },
  {
    title: "Drawdown",
    frontText: "La caída desde el máximo...",
    backText1: "Lo que baja tu cuenta desde su punto más alto hasta el más bajo antes de recuperarse.",
    backText2: "Te dice cuánto dolor aguanta tu método, y si tu riesgo por operación es demasiado grande.",
  },
  {
    title: "Plan de trading",
    frontText: "Las reglas antes de operar...",
    backText1: "Lo que decides en frío: qué operas, cuándo entras y sales, cuánto arriesgas y qué haces tras una pérdida.",
    backText2: "El diario es lo que comprueba si lo cumples.",
  },
];

export default async function DiarioTradingGuidePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profileResult, likesResult, savedResult, sharesResult] = await Promise.all([
    user
      ? supabase.from("profiles").select("full_name, role").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase.from("guide_likes").select("id", { count: "exact", head: true }).eq("guide_slug", SLUG),
    user
      ? supabase.from("guide_saves").select("id").eq("guide_slug", SLUG).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("guide_shares").select("id", { count: "exact", head: true }).eq("guide_slug", SLUG),
  ]);

  const profileData = profileResult.data;
  const role = profileData?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const userName = profileData?.full_name || user?.email?.split("@")[0] || "Usuario";
  const isRegistered = !!user;
  const lector: EstadoLector = isPremium ? "premium" : isRegistered ? "cuenta" : "anonimo";
  const precio = precioEur(PREMIUM_PRICE_EUR);

  let initialLiked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("guide_likes").select("id").eq("guide_slug", SLUG).eq("user_id", user.id).maybeSingle();
    initialLiked = !!likeRow;
  }
  const initialLikes = (likesResult as { count?: number | null }).count ?? 0;
  const initialSaved = !!(savedResult as { data?: unknown }).data;
  const initialShares = (sharesResult as { count?: number | null }).count ?? 0;

  return (
    <div className="gbc-wrap">
      <GuideBreadcrumbJsonLd slug={SLUG} />
      <GuideProgressBar />

      <SiteNav user={!!user} isPremium={isPremium} userName={user ? userName : undefined} isAdmin={isAdmin} />

      <nav className="gbc-index" aria-label="Índice de la guía">
        <div className="gbc-index-inner">
          <span className="gbc-index-lbl">Índice</span>
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="gbc-index-link">{s.label}</a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <header className="gbc-hero">
        <div className="gbc-hero-glow" aria-hidden="true" />
        <div className="gbc-hero-ey">Guía de trading · AdelinBTC Academy · 2026</div>
        <h1 className="gbc-hero-title">
          Cómo hacer un diario de trading<br />
          <span className="gbc-hero-gold">Qué apuntar, qué cifras mirar y cómo revisarlo.</span>
        </h1>
        <p className="gbc-hero-desc">
          Un diario de trading es la diferencia entre creer que operas bien y saberlo. Aquí tienes cómo hacer un
          diario de trading desde cero: los campos que lleva cada operación, las cuatro cifras que dicen si tu
          método gana dinero, cómo apuntar las emociones y la rutina para revisarlo. Sirve igual con un cuaderno,
          con un Excel o con una herramienta.
        </p>
        <div className="gbc-hero-pills">
          <span className="gbc-pill">8 secciones</span>
          <span className="gbc-pill">Calculadora de R y esperanza</span>
          <span className="gbc-pill">Glosario interactivo</span>
          <span className="gbc-pill">Quiz + Badge</span>
        </div>
        <GuideHeroStats stats={HERO_STATS} />
        <GuiaDiarioCta variante="aviso" estado={lector} precio={precio} />
      </header>

      {/* ── LA RESPUESTA CORTA ── */}
      <section id="pasos" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">En resumen</div>
          <h2 className="gbc-title">Cómo hacer un diario de trading en 5 pasos</h2>
          <div className="gbc-body">
            <p>
              Si solo tienes un minuto, esto es cómo hacer un diario de trading que sirva. El resto de la guía
              desarrolla cada paso con ejemplos y una calculadora.
            </p>
          </div>
          <ol className="dtg-pasos">
            {PASOS_RESUMEN.map((p) => (
              <li key={p.t}>
                <strong>{p.t}</strong>
                <span>{p.d}</span>
              </li>
            ))}
          </ol>
          <GuiaDiarioCta variante="banner" estado={lector} precio={precio} />
        </div>
      </section>

      {/* ── SECCIÓN 1: QUÉ ES ── */}
      <section id="que-es" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 1</div>
          <h2 className="gbc-title">Qué es un diario de trading y para qué sirve</h2>
          <div className="gbc-body">
            <p>
              Un <Link href="/glosario/diario-de-trading">diario de trading</Link> es el registro de todas tus
              operaciones: qué hiciste, cuánto arriesgaste, cómo salió y por qué entraste. En inglés se le llama{" "}
              <em>trading journal</em>. No es un cuaderno de ideas ni una lista de lo que piensas comprar: es lo
              que ya hiciste, con sus números.
            </p>
            <p>
              Sirve porque la memoria es un mal contable. Recuerda con detalle la operación que salió bien y
              difumina las cinco que salieron mal. Por eso casi todo el mundo cree que opera mejor de lo que opera,
              y por eso tanta gente cambia de estrategia sin saber si la anterior funcionaba.
            </p>
            <p>
              Un diario contesta tres preguntas que de memoria no se pueden contestar. ¿Gano dinero por método o por
              suerte? ¿Dónde se me va? ¿Cumplo las reglas que me pongo? Para eso hace falta apuntar cada operación,
              también las malas, durante el tiempo suficiente.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">La idea en una frase</div>
            <div className="gbc-box-body">
              <p>Tu <Link href="/glosario/plan-de-trading">plan de trading</Link> dice lo que vas a hacer. El
              diario dice lo que hiciste. La distancia entre los dos es lo que tienes que corregir.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 2: QUÉ APUNTAR ── */}
      <section id="que-apuntar" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 2</div>
          <h2 className="gbc-title">Qué apuntar en cada operación: la plantilla</h2>
          <div className="gbc-body">
            <p>
              La plantilla es la parte central de cómo hacer un diario de trading. Tiene dos momentos: lo que
              apuntas antes de entrar y lo que apuntas al salir. Lo primero es tu plan para esa operación; lo segundo, lo que pasó. Si solo rellenas lo segundo,
              tienes una lista de resultados, no un diario.
            </p>
          </div>

          <div className="dtg-tablas">
            <div className="dtg-tabla">
              <h3>Antes de entrar</h3>
              <dl>
                {CAMPOS_ANTES.map(([c, d]) => (
                  <div key={c}><dt>{c}</dt><dd>{d}</dd></div>
                ))}
              </dl>
            </div>
            <div className="dtg-tabla">
              <h3>Al salir</h3>
              <dl>
                {CAMPOS_DESPUES.map(([c, d]) => (
                  <div key={c}><dt>{c}</dt><dd>{d}</dd></div>
                ))}
              </dl>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              Tres campos merecen una explicación. El stop-loss es lo que convierte una operación en un riesgo
              medible: sin él no sabes cuánto podías perder. El tamaño importa
              porque el mismo acierto con el doble de dinero es el doble de riesgo; el{" "}
              <Link href="/glosario/tamano-de-posicion">tamaño de posición</Link> se decide a partir del stop, no al
              revés. Y la columna «¿seguiste el plan?» es la que más enseña a medio plazo: separa las pérdidas que
              forman parte de tu método de las que te has buscado tú.
            </p>
          </div>

          <div className="gbc-box gbc-box--green" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">Un ejemplo apuntado</div>
            <div className="gbc-box-body">
              <p>Así se ve en la práctica cómo hacer un diario de trading: una operación inventada, apuntada de
              principio a fin.</p>
              <p>Antes de entrar: BTC/USDT long en 4 horas. Entrada a 60.000, stop a 58.800 y objetivo a 63.600.
              Posición de 1.000 €, con 20 € de riesgo: el 1 % de una cuenta de 2.000 €. Estrategia: ruptura de
              rango. Motivo: «rompe el máximo de la semana con volumen». Ánimo: tranquilo.</p>
              <p>Al salir: 63.000, por un objetivo ajustado a mano. Resultado: +50 €, es decir, +2,5 R. Plan
              cumplido: sí. Nota: «moví el objetivo antes de tiempo por miedo; dejé 10 € en la mesa».</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 3: LAS CIFRAS ── */}
      <section id="cifras" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 3</div>
          <h2 className="gbc-title">Las cuatro cifras que dicen si tu método funciona</h2>
          <div className="gbc-body">
            <p>
              Saber cómo hacer un diario de trading incluye saber qué medir con él. Con treinta o cuarenta
              operaciones apuntadas, el diario empieza a dar cifras con sentido. Hay muchas posibles, pero cuatro
              deciden casi todo, y se leen juntas.
            </p>
            <p>
              <strong>1. El <Link href="/glosario/win-rate">win rate</Link></strong>: qué parte de tus operaciones
              gana. <strong>2. La ganancia media y la pérdida media</strong>: cuánto ganas cuando aciertas y cuánto
              pierdes cuando fallas. <strong>3. El resultado en{" "}
              <Link href="/glosario/r-multiplo">múltiplos de R</Link></strong>, donde R es lo que arriesgabas: ganar
              el doble de lo arriesgado es +2 R. <strong>4. La{" "}
              <Link href="/glosario/esperanza-matematica">esperanza matemática</Link></strong>, que junta las
              anteriores en una sola cifra: lo que deja de media cada operación.
            </p>
            <p>
              El error más común es mirar solo la primera. Un 70 % de acierto suena bien, pero si ganas 20 € cuando
              aciertas y pierdes 80 € cuando fallas, cada diez operaciones pierdes 100 €. Al revés, con un 35 % se
              gana dinero si cada ganadora triplica a cada perdedora. Pruébalo con tus números:
            </p>
          </div>

          <GuideDiarioCalc />

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              Hay una quinta cifra que conviene vigilar aunque no decida si ganas: el{" "}
              <Link href="/glosario/drawdown">drawdown</Link>, la caída de tu cuenta desde su máximo. Te dice cuánto
              dolor aguanta tu método y si tu riesgo por operación es demasiado grande para tu capital. El{" "}
              <Link href="/glosario/pnl">P&amp;L</Link> total, en cambio, es la cifra que todo el mundo mira primero y
              la que menos explica: dice cuánto, no cómo.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 4: EMOCIONES ── */}
      <section id="emociones" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 4</div>
          <h2 className="gbc-title">Apuntar las emociones: la columna que nadie rellena</h2>
          <div className="gbc-body">
            <p>
              Casi todo lo que se explica sobre cómo hacer un diario de trading se queda en los números. Es una
              pena, porque las decisiones que
              más dinero cuestan casi nunca son técnicas. Son entrar justo después de una pérdida para recuperarla,
              subir el tamaño tras una racha buena o cerrar una ganadora por miedo a que se dé la vuelta.
            </p>
            <p>
              Cada uno de esos hábitos tiene nombre. Entrar para recuperar es{" "}
              <Link href="/glosario/revenge-trading">revenge trading</Link>. Cerrar pronto lo que gana y aguantar lo
              que pierde es el <Link href="/glosario/efecto-disposicion">efecto disposición</Link>. Subir el riesgo
              tras varios aciertos es <Link href="/glosario/exceso-de-confianza">exceso de confianza</Link>. Ninguno
              se ve desde dentro, mientras pasa. En el diario se ven en pocas semanas.
            </p>
            <p>
              Basta con una palabra por operación o por día: tranquilo, eufórico, cansado, con ganas de recuperar.
              Al cabo de un mes, cruza esa columna con el resultado. Si tus operaciones «con ganas de recuperar»
              pierden de media, ya tienes una regla: después de una pérdida, se espera.
            </p>
          </div>

          <div className="gbc-box gbc-box--red" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">Una regla que sale casi siempre del diario</div>
            <div className="gbc-box-body">
              <p>Tras dos pérdidas seguidas, se cierra la plataforma hasta el día siguiente. Es la regla que más
              gente acaba escribiendo cuando cruza sus emociones con sus resultados, y la que más dinero ahorra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 5: REVISAR ── */}
      <section id="revisar" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 5</div>
          <h2 className="gbc-title">Cómo revisar tu diario: la rutina</h2>
          <div className="gbc-body">
            <p>
              Un diario que no se lee es un archivo. Saber cómo hacer un diario de trading es la mitad; la otra
              mitad es revisarlo, y funciona mejor con un calendario fijo que cuando apetece.
            </p>
          </div>

          <ol className="dtg-pasos">
            {PASOS_REVISION.map((p) => (
              <li key={p.t}>
                <strong>{p.t}</strong>
                <span>{p.d}</span>
              </li>
            ))}
          </ol>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              El objetivo de cada revisión es salir con una sola decisión concreta, no con diez. «Dejo de operar
              rupturas los lunes», «bajo el riesgo al 0,5 % hasta volver al máximo», «no entro sin escribir el
              motivo». Una cada vez, y la siguiente revisión dice si funcionó.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 6: ERRORES ── */}
      <section id="errores" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 6</div>
          <h2 className="gbc-title">Los errores que vuelven inútil un diario de trading</h2>
          <div className="gbc-body">
            <p>Seis fallos muy comunes, incluso en quien ya sabe cómo hacer un diario de trading. Todos tienen
            arreglo, y casi todos cuestan menos de un minuto al día.</p>
          </div>
          <div className="gbc-fc-section" style={{ padding: 0 }}>
            <GuideFlipCards cards={ERRORES} />
          </div>
        </div>
      </section>

      {/* ── SECCIÓN 7: DÓNDE LLEVARLO ── */}
      <section id="donde" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 7</div>
          <h2 className="gbc-title">Cuaderno, Excel o herramienta: dónde llevarlo</h2>
          <div className="gbc-body">
            <p>
              La última decisión sobre cómo hacer un diario de trading es dónde llevarlo. El mejor sitio es el que
              vas a usar todos los días. Las tres opciones
              funcionan; cambian el trabajo que te cuesta y lo que te cuentan.
            </p>
          </div>

          <div className="dtg-compara">
            <div>
              <h3>Cuaderno</h3>
              <p className="dtg-compara-pro">Cero fricción para apuntar el porqué y las emociones.</p>
              <p className="dtg-compara-contra">Las cuentas, a mano. Desglosar por estrategia u hora es casi imposible.</p>
            </div>
            <div>
              <h3>Hoja de cálculo</h3>
              <p className="dtg-compara-pro">Gratis y flexible: calcula el win rate, la R y la esperanza con unas fórmulas.</p>
              <p className="dtg-compara-contra">Hay que montarla y mantenerla, y nadie te avisa cuando algo se tuerce.</p>
            </div>
            <div>
              <h3>Herramienta</h3>
              <p className="dtg-compara-pro">Las cifras, la curva y los desgloses salen solos con cada operación.</p>
              <p className="dtg-compara-contra">Suele ser de pago, y tienes que fiarte de cómo calcula.</p>
            </div>
          </div>

          <div className="gbc-body" style={{ marginTop: 28 }}>
            <p>
              Si empiezas, una hoja de cálculo con los campos de la sección 2 es suficiente. Si prefieres no montar
              nada, el <Link href="/herramientas/diario">Diario de Trading</Link> de la academia hace estas cuentas
              solo, cruza tu ánimo con tus resultados y no se conecta a ningún{" "}
              <Link href="/glosario/exchange">exchange</Link>: las operaciones las apuntas tú. Lo que importa no es
              la herramienta, sino apuntar todas las operaciones durante el tiempo suficiente.
            </p>
          </div>

          <GuiaDiarioCta variante="escaparate" estado={lector} precio={precio} />
        </div>
      </section>

      {/* ── SECCIÓN 8: HACIENDA ── El ángulo que no tienen las webs de los
          brókeres: el diario como base de la declaración en España. */}
      <section id="hacienda" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Sección 8 · Si declaras en España</div>
          <h2 className="gbc-title">Tu diario de trading y la declaración de la renta</h2>
          <div className="gbc-body">
            <p>
              Ninguna norma te obliga a llevar un diario de trading, pero en España casi todo lo que apuntas acaba
              haciendo falta en junio. Cada venta de una criptomoneda, y también cada cambio de una por otra,
              produce una ganancia o una pérdida que se declara. Para calcularla, Hacienda exige el método FIFO: lo
              primero que compraste es lo primero que vendes.
            </p>
            <p>
              Si tu plantilla guarda la fecha, la cantidad, el precio y la comisión de cada compra y cada venta,
              tienes la materia prima de ese cálculo. Lo que no sustituye es el histórico oficial que descargas del
              exchange: ese es el que respalda tus cifras si te las piden. La guía de{" "}
              <Link href="/guias/fiscalidad-cripto-espana">fiscalidad cripto en España</Link> explica el cálculo
              entero, con un simulador FIFO.
            </p>
          </div>

          <div className="gbc-box gbc-box--gold" style={{ marginTop: 28 }}>
            <div className="gbc-box-title">Un hábito que ahorra un susto</div>
            <div className="gbc-box-body">
              <p>Una vez al trimestre, cuadra el total de operaciones de tu diario con el extracto del exchange. Si
              falta alguna, la encuentras en marzo, no la víspera de presentar la declaración.</p>
            </div>
          </div>

          <DisclaimerRiesgo variante="guia" />
        </div>
      </section>

      {/* ── GLOSARIO: FLASHCARDS ── */}
      <section id="glosario" className="gbc-fc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Glosario</div>
          <h2 className="gbc-title">Términos clave — haz clic para ver la definición</h2>
          <GuideFlipCards cards={GLOSSARY_CARDS} />
        </div>
      </section>

      {/* ── QUIZ ── */}
      <section id="quiz" className="gbc-section">
        <div className="gbc-gc">
          <div className="gbc-ey">Quiz final</div>
          <h2 className="gbc-title">Demuestra lo que sabes — 5 preguntas, badge en juego</h2>
          <div className="gbc-body" style={{ marginBottom: 32 }}>
            <p>Comprueba si ya sabes cómo hacer un diario de trading. Necesitas <strong>5/5</strong> respuestas correctas para desbloquear el badge <strong style={{ color: "var(--gold)" }}>Bitácora al Día</strong>. Sin prisa — puedes releer cualquier sección antes de responder.</p>
          </div>
          {isRegistered ? <GuideDiarioQuiz /> : <GuideQuizCuenta slug={SLUG} />}
        </div>
      </section>

      {/* ── LA ÚLTIMA LLAMADA: el Diario y Nova, antes del cierre fijo de toda guía ── */}
      <section className="gbc-section">
        <div className="gbc-gc">
          <GuiaDiarioCta variante="cierre" estado={lector} precio={precio} />
        </div>
      </section>

      <GuiasRelacionadas slug={SLUG} />

      {/* ── Interacciones ── */}
      <section className="gbc-section gbc-interactions-section">
        <div className="gbc-gc">
          <div className="gbc-interactions-wrap">
            <p className="gbc-interactions-label">¿Te ha resultado útil esta guía?</p>
            <GuideInteractions
              guideSlug={SLUG}
              initialLikes={initialLikes}
              initialLiked={initialLiked}
              initialSaved={initialSaved}
              initialShares={initialShares}
              isLoggedIn={isRegistered}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
