import { createClient } from "@/lib/supabase/server";
import { PREMIUM_PRICE_EUR } from "@/lib/stripe";
import DashboardSavedTerms from "@/components/DashboardSavedTerms";
import Link from "next/link";
import Image from "next/image";
import {
  NotebookPen, Wallet, GraduationCap, Crown, ArrowRight, Check, Flame, Trophy, BookOpenCheck, Clock,
  Shield, MessagesSquare, CheckCircle2, EyeOff, Hourglass, MessageCircle, UserRound, BookA, Plus, Calculator, BellRing,
} from "lucide-react";
import DashboardSavedGuides from "@/components/DashboardSavedGuides";
import TwoFactorNudge from "@/components/TwoFactorNudge";
import { coleccionDeLogros, diarioLevel, isEarned } from "@/lib/logros";
import PegatinaLogro, { colorDeLogro } from "@/components/panel/PegatinaLogro";
import RachaSemana from "@/components/panel/RachaSemana";
import Tecla from "@/components/cuaderno/Tecla";
import TeclaPremium from "@/components/cuaderno/TeclaPremium";
import CaritaFeliz from "@/components/cuaderno/CaritaFeliz";
import { semanaDeRacha } from "@/lib/rachaSemana";
import { GUIDES, GUIDES_NEWEST_FIRST } from "@/lib/guides";
import { getEffectiveStreak, todayStr } from "@/lib/streak";
import GuiaPortada from "@/components/GuiaPortada";
import AvatarUsuario from "@/components/AvatarUsuario";
import VitrinaCertificados from "@/components/VitrinaCertificados";
import { certificadosDelAlumno, cursosDelAlumno, logrosDeCursos } from "@/lib/cursos";
import { PEGATINA_CURSO } from "@/lib/cursosPegatinas";
import { destinoPorRuta } from "@/lib/herramientas";
import { misPreguntas, novedadesDelForo } from "@/lib/foro/datos/mio";
import { fraseDeAviso } from "@/lib/foro/tipos";
import { pnlStr } from "@/components/trading/tjFormat";
import { milestoneBadgeId } from "@/components/trading/tjStats";

/** La semana de la racha. Fuera del componente: la fecha de hoy no puede leerse en el render. */
function semanaActual(racha: number, ultimoDia: string | null | undefined) {
  return semanaDeRacha(racha, racha > 0 ? ultimoDia ?? null : null, todayStr());
}

/** «2026-11-23» → «23/11», sin pasar por `Date` (que lo leería en UTC y podría mover el día). */
function diaMes(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return d && m ? `${d}/${m}` : iso;
}

/** Ahora, en milisegundos. Fuera del componente, como `semanaActual`: el render no lee el reloj. */
function ahoraMs(): number {
  return Date.now();
}

/** Hace cuánto, en palabras: para la última actividad de una pregunta. */
function haceCuanto(iso: string, ahora: number): string {
  const ms = ahora - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const min = Math.floor(ms / 60_000);
  if (min < 60) return min <= 1 ? "hace un momento" : `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 24) return horas === 1 ? "hace 1 hora" : `hace ${horas} horas`;
  const dias = Math.floor(horas / 24);
  if (dias < 30) return dias === 1 ? "ayer" : `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return meses <= 1 ? "hace un mes" : `hace ${meses} meses`;
}

type Operacion = { date: string; pair: string; direction: string; pnl: number | null; result: string };

/** Cuántas operaciones salen en el resumen del diario. */
const ULTIMAS_OPERACIONES = 4;
/** Cuántos cursos a medias salen como mucho (los más avanzados). */
const CURSOS_EN_MARCHA = 4;
/** Cuántos logros conseguidos se enseñan (los más recientes). */
const ULTIMOS_LOGROS = 6;

/**
 * El dashboard: el sitio privado de cada usuario (rehecho el 23-11-2026, pedido
 * por el admin: «que sea más como el lugar privado del usuario»).
 *
 * Ya no es un índice de la web (eso está en el menú): enseña cómo va él, y
 * cada bloque sale de sus datos, sin una cifra de adorno.
 *
 * 1. El saludo, con su racha, sus logros y sus guías completadas; al admin, la
 *    tecla de su panel (solo se pinta con su rol: a nadie más le llega).
 * 2. Su Diario de Trading: resultado, operaciones, acierto y las últimas. Sin
 *    operaciones, una invitación a apuntar la primera; sin Premium, qué es.
 * 3. Sus preguntas del foro con su estado. Solo si ha publicado alguna.
 * 4. Sus guías: las guardadas y las completadas. Sin ninguna, por dónde empezar.
 * 5. Sus últimos logros (o los primeros a por los que ir) y sus certificados.
 * 6. Su diccionario guardado, si tiene, y Premium a quien no lo tiene.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, current_streak, last_seen, is_featured")
    .eq("id", user.id)
    .single();

  const effectiveStreak = getEffectiveStreak(profile?.current_streak, profile?.last_seen);

  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const inicial = (name.trim().charAt(0) || "U").toUpperCase();
  const role = profile?.role || "free";
  const isAdmin = role === "admin";
  const isPremium = role === "premium" || isAdmin;
  const planLabel = isAdmin ? "Admin" : isPremium ? "Premium" : "Plan gratuito";

  const [
    { data: savedTermsData },
    { data: savedGuidesData },
    { data: userBadgesData },
    { data: foto },
    { data: operacionesData },
    preguntas,
    certificados,
    cursos,
    novedades,
    logrosCursos,
  ] = await Promise.all([
    supabase
      .from("saved_terms")
      .select("term, definition, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("guide_saves")
      .select("guide_slug, saved_at")
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false }),
    supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false }),
    // La foto de perfil, para el saludo. Aparte: si la columna aún no existe,
    // falla sola y sale la inicial.
    supabase.from("profiles").select("avatar").eq("id", user.id).maybeSingle(),
    // El diario solo se resume a quien puede abrirlo. Sus operaciones, con su sesión.
    isPremium
      ? supabase
          .from("trades")
          .select("date, pair, direction, pnl, result")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(5000)
      : Promise.resolve({ data: [] as Operacion[] }),
    misPreguntas(user.id, 4),
    certificadosDelAlumno(user.id),
    cursosDelAlumno(user.id, isAdmin),
    novedadesDelForo(user.id, 3),
    // Un logro por curso publicado: se gana con el certificado, no con `user_badges`.
    logrosDeCursos(user.id),
  ]);

  // ── El foro: la tarjeta sale si tiene preguntas o si hay algo nuevo para él
  // (una respuesta, una réplica, un me gusta…), aunque no haya preguntado nada.
  const hayForo = preguntas.length > 0 || novedades.sinLeer > 0;
  // Las preguntas con una respuesta que aún no ha visto: llevan su marca.
  const conRespuestaNueva = new Set(
    novedades.avisos.flatMap((a) => (a.tipo === "respuesta" && a.hilo ? [a.hilo.id] : [])),
  );

  // ── Los cursos: a la vista, los que tiene a medias; los terminados se cuentan
  // (sus certificados están en la vitrina, más abajo).
  const enMarcha = cursos.filter((c) => !c.terminado);
  const terminados = cursos.length - enMarcha.length;

  const avatar = (foto as { avatar?: string | null } | null)?.avatar ?? null;
  const ahora = ahoraMs();

  // ── Guías ──
  const savedTermsList = savedTermsData ?? [];
  const savedGuidesList = (savedGuidesData ?? [])
    .map((sg) => ({ slug: sg.guide_slug, savedAt: sg.saved_at, meta: GUIDES.find((g) => g.slug === sg.guide_slug) }))
    .filter((sg): sg is { slug: string; savedAt: string; meta: NonNullable<typeof sg.meta> } => !!sg.meta);
  // Lo que tiene: los logros de `user_badges` y, por cada certificado, el de su curso.
  const earnedBadgeIds = new Set<string>([
    ...(userBadgesData ?? []).map((b) => b.badge_id as string),
    ...logrosCursos.filter((c) => c.conseguido).map((c) => `curso-${c.slug}`),
  ]);
  // Una guía está completada cuando tiene su logro: el quiz con nota perfecta.
  const guiasHechas = GUIDES_NEWEST_FIRST.filter((g) => earnedBadgeIds.has(g.badgeId));
  const sinGuias = savedGuidesList.length === 0 && guiasHechas.length === 0;

  // ── Logros ──
  // La cuenta única de la web (`coleccionDeLogros`): actividad, guías, cursos
  // y los hitos del diario. La misma cifra que enseña «Mis logros».
  const { defs: DASH_BADGES, total: logrosTotales } = coleccionDeLogros(earnedBadgeIds, logrosCursos, isPremium);
  const conseguidos = DASH_BADGES.filter((b) => isEarned(earnedBadgeIds, b));
  const badgesPct = logrosTotales ? Math.round((conseguidos.length / logrosTotales) * 100) : 0;
  // Los más recientes primero, por su fecha. Un hito del diario se guarda
  // nivel a nivel: cuenta el último nivel que subió.
  const fechaDe = new Map<string, string>([
    ...(userBadgesData ?? []).map((b): [string, string] => [b.badge_id as string, String(b.unlocked_at ?? "")]),
    ...logrosCursos.flatMap((c): [string, string][] => (c.conseguido ? [[`curso-${c.slug}`, c.conseguido.fecha]] : [])),
  ]);
  const ultimaVez = (b: (typeof DASH_BADGES)[number]) => {
    const hito = b.diario;
    const ids = hito ? Array.from({ length: hito.levels }, (_, i) => milestoneBadgeId(hito.family, i + 1)) : [b.id];
    return ids.map((id) => fechaDe.get(id) ?? "").sort().at(-1) ?? "";
  };
  const ultimosLogros = [...conseguidos].sort((a, b) => ultimaVez(b).localeCompare(ultimaVez(a))).slice(0, ULTIMOS_LOGROS);
  // Sin ninguno: los primeros a por los que ir, con lo que piden a la vista.
  const proximosLogros = conseguidos.length === 0 ? DASH_BADGES.filter((b) => !b.diario && !b.cursoSlug).slice(0, 3) : [];

  const semana = semanaActual(effectiveStreak, profile?.last_seen);

  // ── El diario ──
  const operaciones = (operacionesData ?? []) as Operacion[];
  const totalOps = operaciones.length;
  const ganadas = operaciones.filter((o) => o.result === "win").length;
  const acierto = totalOps ? Math.round((ganadas / totalOps) * 100) : 0;
  const resultado = operaciones.reduce((s, o) => s + Number(o.pnl ?? 0), 0);
  const ultimas = operaciones.slice(0, ULTIMAS_OPERACIONES);
  const destinoDiario = destinoPorRuta("/dashboard/trading", { logueado: true, premium: isPremium });
  const signo = (n: number) => (n > 0 ? "is-sube" : n < 0 ? "is-baja" : "");

  return (
    <main className="dashboard-main">

      {/* ── Cabecera: el saludo, tres datos suyos y la racha de la semana ── */}
      <section className="dh pn-hoja" aria-labelledby="dh-titulo">
        <div className="dh-texto">
          <p className="pn-mano dh-nota">tu rincón de la academia</p>
          <div className="dh-saludo-fila">
            {avatar && <AvatarUsuario avatar={avatar} inicial={inicial} className="dh-saludo-foto" />}
            <h1 id="dh-titulo" className="dh-saludo">
              Hola, <span className="fluor">{name}</span>
              {profile?.is_featured && (
                <span className="dh-estrella" title="Usuario destacado: 30 días de racha">★</span>
              )}
            </h1>
          </div>
          <p className="dh-sub">Tu diario, tus guías, tus logros y tus preguntas: todo lo tuyo, en un sitio.</p>
          <div className="dh-acciones">
            <span className={`pn-chip ${isPremium ? "tono-naranja" : "tono-gris"}`}>
              {isPremium && <Crown size={13} aria-hidden="true" />}
              {planLabel}
            </span>
            {!isPremium && <TeclaPremium href="/premium" tamano="peq" flecha={false} />}
            {/* El panel de admin: se decide aquí, en el servidor, así que a nadie
                más le llega ni el enlace; y /admin lo protege además src/proxy.ts. */}
            {isAdmin && (
              <Tecla href="/admin" color="lila" tamano="peq">
                <Shield size={14} strokeWidth={2.6} aria-hidden="true" /> Panel admin
              </Tecla>
            )}
          </div>
        </div>

        <div className="dh-lado">
          <p className="pn-mano dh-lado-nota" aria-hidden="true">así vas hasta hoy</p>
          <div className="dh-datos">
            <Link href="/dashboard/logros" className="dh-dato tono-naranja">
              <span className="dh-dato-icono" aria-hidden="true"><Flame size={18} /></span>
              <span className="dh-dato-valor">{effectiveStreak}</span>
              <span className="dh-dato-texto">{effectiveStreak === 1 ? "día de racha" : "días de racha"}</span>
            </Link>
            <Link href="/dashboard/logros" className="dh-dato tono-amarillo">
              <span className="dh-dato-icono" aria-hidden="true"><Trophy size={18} /></span>
              <span className="dh-dato-valor">{conseguidos.length}<small>/{logrosTotales}</small></span>
              <span className="dh-dato-texto">logros</span>
            </Link>
            <Link href="/guias" className="dh-dato tono-cielo">
              <span className="dh-dato-icono" aria-hidden="true"><BookOpenCheck size={18} /></span>
              <span className="dh-dato-valor">{guiasHechas.length}<small>/{GUIDES.length}</small></span>
              <span className="dh-dato-texto">guías completadas</span>
            </Link>
          </div>
          <div className="dh-racha">
            <span className="pn-etiqueta">Racha de esta semana</span>
            <RachaSemana dias={semana} etiqueta="Tu racha en los últimos siete días" />
          </div>
        </div>
      </section>

      {/* El aviso del segundo paso, si le falta: lo primero tras el saludo. */}
      <TwoFactorNudge />

      {/* ── El diario y el foro, uno al lado del otro en el ordenador ── */}
      <div className={`dp-par${hayForo ? "" : " is-solo"}`}>

        {/* ── Su Diario de Trading ── */}
        <section className="pn-hoja dp-diario" aria-labelledby="dp-diario-titulo">
          <header className="pn-hoja-cab">
            <div>
              <span className="pn-etiqueta dp-etiqueta tono-azul"><NotebookPen size={14} aria-hidden="true" /> Diario de Trading</span>
              <h2 id="dp-diario-titulo" className="pn-h2">Tu trading</h2>
            </div>
            {isPremium && totalOps > 0 && (
              <Tecla href={destinoDiario} color="azul" tamano="peq">
                Abrir mi diario <ArrowRight size={14} aria-hidden="true" />
              </Tecla>
            )}
          </header>

          {!isPremium ? (
            <div className="dp-diario-vacio">
              <p className="dp-diario-texto">
                Apunta cada operación y el diario te dice qué te funciona: resultado, acierto, tus mejores pares y tus errores repetidos.
              </p>
              <Tecla href={destinoDiario} color="azul" tamano="peq">
                Ver qué es el Diario <ArrowRight size={14} aria-hidden="true" />
              </Tecla>
            </div>
          ) : totalOps === 0 ? (
            <div className="dp-diario-vacio">
              <CaritaFeliz tamano={44} className="dp-carita" />
              <p className="dp-diario-texto">
                Tu diario está listo. Apunta tu primera operación y aquí verás tu resultado y tu acierto.
              </p>
              <Tecla href={destinoDiario} color="azul" tamano="peq">
                <Plus size={14} strokeWidth={2.8} aria-hidden="true" /> Apuntar la primera
              </Tecla>
            </div>
          ) : (
            <>
              <dl className="dp-cifras">
                <div className="dp-cifra">
                  <dt className="pn-etiqueta">Resultado</dt>
                  <dd className={`dp-cifra-valor ${signo(resultado)}`}>{pnlStr(resultado)}</dd>
                </div>
                <div className="dp-cifra">
                  <dt className="pn-etiqueta">Operaciones</dt>
                  <dd className="dp-cifra-valor">{totalOps}</dd>
                </div>
                <div className="dp-cifra">
                  <dt className="pn-etiqueta">Acierto</dt>
                  <dd className="dp-cifra-valor">{acierto} %</dd>
                </div>
              </dl>
              <span
                className="pn-barra pn-barra--fina tono-azul"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={acierto}
                aria-label="Operaciones ganadas"
              >
                <i style={{ width: `${acierto}%` }} />
              </span>

              <p className="pn-etiqueta dp-subtitulo">Últimas operaciones</p>
              <ul className="dp-ops">
                {ultimas.map((o, i) => (
                  <li key={`${o.date}-${o.pair}-${i}`} className="dp-op">
                    <span className={`dp-op-dir ${o.direction === "short" ? "is-short" : "is-long"}`}>
                      {o.direction === "short" ? "Short" : "Long"}
                    </span>
                    <span className="dp-op-par">{o.pair}</span>
                    <span className="dp-op-fecha">{diaMes(o.date)}</span>
                    <span className={`dp-op-pnl ${signo(Number(o.pnl ?? 0))}`}>{pnlStr(Number(o.pnl ?? 0))}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        {/* ── Sus cursos, justo después del diario (pedido por el admin el
            23-11-2026: «cursos es muy importante»). En el ordenador ocupa todo
            el ancho bajo el diario y el foro; en el móvil va entre los dos. ── */}
        <section className="pn-hoja dp-cursos" aria-labelledby="dp-cursos-titulo">
          {/* Las velas de trading (pegatina del admin, 23-11-2026), en la
              esquina como la del foro: solo en el móvil (dashboard.css). */}
          <Image src="/cuaderno/velas-pegatina.webp" alt="" width={240} height={258} className="dp-cursos-mascota" draggable={false} />
          <header className="pn-hoja-cab">
            <div>
              <span className="pn-etiqueta dp-etiqueta tono-lila"><GraduationCap size={14} aria-hidden="true" /> Cursos</span>
              <h2 id="dp-cursos-titulo" className="pn-h2">Tus cursos</h2>
              {cursos.length > 0 && (
                <p className="pn-sub">
                  {enMarcha.length} en marcha · {terminados} {terminados === 1 ? "terminado" : "terminados"}
                </p>
              )}
            </div>
            <Tecla href="/cursos" color="lila" tamano="peq">
              Ver cursos <ArrowRight size={14} aria-hidden="true" />
            </Tecla>
          </header>

          {enMarcha.length === 0 ? (
            <div className="dp-cursos-vacio">
              <p className="dp-cursos-texto">
                {terminados > 0
                  ? `Has terminado ${terminados === 1 ? "tu curso" : `tus ${terminados} cursos`}. Cuando empieces otro, aquí verás por dónde vas.`
                  : "Cursos por módulos, con examen y certificado. Cuando empieces uno, aquí verás por dónde vas y qué te toca."}
              </p>
            </div>
          ) : (
            <ul className="dp-cursos-lista">
              {enMarcha.slice(0, CURSOS_EN_MARCHA).map((c) => {
                const pegatina = PEGATINA_CURSO[c.slug];
                const toca = !c.siguiente
                  ? "Sigue donde lo dejaste"
                  : c.siguiente.tipo === "leccion"
                    ? `Ahora: ${c.siguiente.titulo}`
                    : c.siguiente.tipo === "examen"
                      ? `Te toca el examen del módulo ${c.siguiente.moduloOrden}`
                      : "Te toca el examen final";
                return (
                  <li key={c.slug}>
                    <Link href={isPremium ? `/aula/${c.slug}` : `/cursos/${c.slug}`} className="dp-curso">
                      <span className="dp-curso-dibujo" style={{ "--curso": c.color } as React.CSSProperties} aria-hidden="true">
                        {pegatina ? (
                          <Image src={pegatina} alt="" width={330} height={330} draggable={false} />
                        ) : (
                          <GraduationCap size={26} />
                        )}
                      </span>
                      <span className="dp-curso-cuerpo">
                        <span className="dp-curso-titulo">{c.titulo}</span>
                        <span className="dp-curso-progreso">
                          <span
                            className="pn-barra pn-barra--fina tono-lila"
                            role="progressbar"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={c.porcentaje}
                            aria-label={`Progreso de ${c.titulo}`}
                          >
                            <i style={{ width: `${c.porcentaje}%` }} />
                          </span>
                          <b>{c.porcentaje} %</b>
                        </span>
                        <span className="dp-curso-datos">
                          Módulos {c.modulosAprobados}/{c.modulosTotales} · Lecciones {c.leccionesHechas}/{c.leccionesTotales}
                        </span>
                        <span className="dp-curso-toca">{toca}</span>
                      </span>
                      <ArrowRight className="dp-curso-ir" size={18} strokeWidth={2.6} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ── Sus preguntas del foro, con su estado. Solo si ha publicado alguna ── */}
        {hayForo && (
          <section className="pn-hoja dp-foro" aria-labelledby="dp-foro-titulo">
            {/* La pegatina del foro (la misma de la portada), en la esquina:
                solo en el móvil (dashboard.css). Pedido por el admin el 23-11-2026. */}
            <Image src="/cuaderno/burbujas-pegatina.webp" alt="" width={360} height={339} className="dp-foro-mascota" draggable={false} />
            <header className="pn-hoja-cab">
              <div>
                <span className="pn-etiqueta dp-etiqueta tono-coral"><MessagesSquare size={14} aria-hidden="true" /> Foro</span>
                <h2 id="dp-foro-titulo" className="pn-h2">{preguntas.length ? "Tus preguntas" : "Tu foro"}</h2>
              </div>
              <Tecla href="/foro/mio" color="coral" tamano="peq" className="dp-foro-tecla">
                Lo mío <ArrowRight size={14} aria-hidden="true" />
                {/* El punto rojo: cuántas novedades tiene sin leer. */}
                {novedades.sinLeer > 0 && (
                  <span className="dp-punto">
                    <span aria-hidden="true">{novedades.sinLeer > 9 ? "9+" : novedades.sinLeer}</span>
                    <span className="sr-only">
                      {novedades.sinLeer === 1 ? "1 novedad sin leer" : `${novedades.sinLeer} novedades sin leer`}
                    </span>
                  </span>
                )}
              </Tecla>
            </header>

            {/* Lo nuevo: una nota con su campana, que lleva a «Lo mío» (allí se leen y se marcan). */}
            {novedades.sinLeer > 0 && (
              <Link href="/foro/mio" className="dp-novedades">
                <span className="dp-novedades-campana" aria-hidden="true"><BellRing size={20} strokeWidth={2.4} /></span>
                <span className="dp-novedades-cuerpo">
                  <span className="dp-novedades-titulo">
                    {novedades.sinLeer === 1 ? "Tienes 1 novedad" : `Tienes ${novedades.sinLeer} novedades`}
                  </span>
                  <span className="dp-novedades-lista">
                    {novedades.avisos.map((a) => (
                      <span key={a.id} className="dp-novedad">
                        {fraseDeAviso(a)}
                        {a.hilo && <small>{a.hilo.titulo}</small>}
                      </span>
                    ))}
                    {novedades.sinLeer > novedades.avisos.length && (
                      <span className="dp-novedad dp-novedad--mas">y {novedades.sinLeer - novedades.avisos.length} más</span>
                    )}
                  </span>
                </span>
                <ArrowRight className="dp-novedades-ir" size={18} strokeWidth={2.6} aria-hidden="true" />
              </Link>
            )}

            <ul className="dp-preguntas">
              {preguntas.map((p) => {
                const oculta = p.estado === "oculta";
                const estado = oculta
                  ? { clase: "tono-gris", icono: <EyeOff size={13} strokeWidth={2.6} aria-hidden="true" />, texto: "Oculta" }
                  : p.resuelta
                    ? { clase: "tono-menta", icono: <CheckCircle2 size={13} strokeWidth={2.6} aria-hidden="true" />, texto: "Resuelta" }
                    : p.respuestas > 0
                      ? { clase: "tono-azul", icono: <MessageCircle size={13} strokeWidth={2.6} aria-hidden="true" />, texto: p.respuestas === 1 ? "1 respuesta" : `${p.respuestas} respuestas` }
                      : { clase: "tono-amarillo", icono: <Hourglass size={13} strokeWidth={2.6} aria-hidden="true" />, texto: "Esperando respuesta" };
                const cuerpo = (
                  <>
                    <span className="dp-pregunta-titulo">{p.titulo}</span>
                    <span className="dp-pregunta-pie">
                      <span className={`pn-chip ${estado.clase}`}>{estado.icono}{estado.texto}</span>
                      {conRespuestaNueva.has(p.id) && !oculta && (
                        <span className="dp-nueva"><i aria-hidden="true" />Nueva respuesta</span>
                      )}
                      {p.resuelta && !oculta && p.respuestas > 0 && (
                        <span className="dp-pregunta-dato">{p.respuestas === 1 ? "1 respuesta" : `${p.respuestas} respuestas`}</span>
                      )}
                      <span className="dp-pregunta-dato">{haceCuanto(p.ultimaActividad, ahora)}</span>
                    </span>
                    {oculta && (
                      <span className="dp-pregunta-motivo">
                        {p.motivo ? `La moderación la ocultó: ${p.motivo}` : "La moderación la ocultó. Solo la ves tú."}
                      </span>
                    )}
                  </>
                );
                return (
                  <li key={p.id}>
                    {/* Una pregunta oculta ya no tiene página pública: se explica aquí, sin enlace. */}
                    {oculta ? (
                      <div className="dp-pregunta is-oculta">{cuerpo}</div>
                    ) : (
                      <Link href={`/foro/${p.id}-${p.slug}`} className={`dp-pregunta${p.resuelta ? " is-resuelta" : ""}`}>
                        {cuerpo}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      {/* ── Sus guías: las guardadas y las completadas ── */}
      <section className="pn-hoja dp-guias" aria-labelledby="dp-guias-titulo">
        <header className="pn-hoja-cab">
          <div>
            <span className="pn-etiqueta dp-etiqueta tono-cielo"><BookOpenCheck size={14} aria-hidden="true" /> Guías</span>
            <h2 id="dp-guias-titulo" className="pn-h2">
              {sinGuias ? "Por dónde empezar" : "Tus guías"}
            </h2>
            {!sinGuias && (
              <p className="pn-sub">
                {savedGuidesList.length} {savedGuidesList.length === 1 ? "guardada" : "guardadas"} · {guiasHechas.length} {guiasHechas.length === 1 ? "completada" : "completadas"}
              </p>
            )}
          </div>
          <Tecla href="/guias" color="cielo" tamano="peq">Ver todas <ArrowRight size={14} aria-hidden="true" /></Tecla>
        </header>

        {sinGuias ? (
          <div className="dh-guias">
            {GUIDES_NEWEST_FIRST.slice(0, 3).map((guide) => (
              <Link key={guide.slug} href={`/guias/${guide.slug}`} className="dh-guia">
                <span className="dh-guia-portada">
                  <GuiaPortada guia={guide} sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 360px" />
                </span>
                <span className="dh-guia-cuerpo">
                  <span className="dh-guia-meta">
                    {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
                    <span aria-hidden="true">·</span>
                    <Clock size={12} aria-hidden="true" /> {guide.readTime}
                  </span>
                  <span className="dh-guia-titulo">{guide.title}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <>
            {savedGuidesList.length > 0 && (
              <>
                <p className="pn-etiqueta dp-subtitulo">Guardadas para leer</p>
                <DashboardSavedGuides initialGuides={savedGuidesList} />
              </>
            )}
            {guiasHechas.length > 0 && (
              <>
                <p className="pn-etiqueta dp-subtitulo">Completadas</p>
                <ul className="dp-hechas">
                  {guiasHechas.map((g) => (
                    <li key={g.slug}>
                      <Link href={`/guias/${g.slug}`} className="dp-hecha">
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                        {g.shortTitle}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>

      {/* ── Sus logros: los últimos que ha conseguido ── */}
      <section className="pn-hoja dh-logros" aria-labelledby="dh-logros-titulo">
        {/* La copa, en la esquina como la pegatina del foro: solo en el móvil. */}
        <Image src="/cuaderno/copa-pegatina.webp" alt="" width={240} height={250} className="dp-logros-copa" draggable={false} />
        <header className="pn-hoja-cab">
          <div>
            <span className="pn-etiqueta dp-etiqueta tono-amarillo"><Trophy size={14} aria-hidden="true" /> Logros</span>
            <h2 id="dh-logros-titulo" className="pn-h2">
              {conseguidos.length ? "Tus últimos logros" : "Tus primeros logros"}
            </h2>
            <p className="pn-sub">
              {conseguidos.length === 0
                ? "Completa el quiz de una guía o entra unos días seguidos para conseguir el primero."
                : `${conseguidos.length} de ${logrosTotales} desbloqueados`}
            </p>
          </div>
          <Tecla href="/dashboard/logros" color="amarillo" tamano="peq">
            Ver todos <ArrowRight size={14} aria-hidden="true" />
          </Tecla>
        </header>

        <div className="pn-progreso">
          <span
            className="pn-barra tono-amarillo"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={badgesPct}
            aria-label="Progreso de logros"
          >
            <i style={{ width: `${badgesPct}%` }} />
          </span>
          <b>{badgesPct} %</b>
        </div>

        <ul className={`dh-logros-rejilla${conseguidos.length ? "" : " is-proximos"}`}>
          {(conseguidos.length ? ultimosLogros : proximosLogros).map((badge, i) => {
            const unlocked = conseguidos.length > 0;
            return (
              <li key={badge.id} className={`dh-logro pgl-anfitrion${unlocked ? " is-conseguido" : ""}`}>
                <PegatinaLogro
                  icono={badge.icon}
                  color={colorDeLogro(badge)}
                  conseguida={unlocked}
                  indice={i}
                  tamano="peq"
                  especial={badge.special}
                />
                <span className="dh-logro-nombre">
                  {badge.label}
                  <span className="sr-only">{unlocked ? " (conseguido)" : " (sin conseguir)"}</span>
                </span>
                <span className="dh-logro-pista">
                  <span>{badge.condition}</span>
                  {badge.diario && (
                    <span className="dh-logro-premio">★ Nivel {diarioLevel(earnedBadgeIds, badge)} de {badge.diario.levels}</span>
                  )}
                  {badge.reward && <span className="dh-logro-premio">★ {badge.reward}</span>}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Sus certificados, solo si tiene alguno ── */}
      {certificados.length > 0 && (
        <VitrinaCertificados certificados={certificados} forma="estante" nombre={name} ejemplo={null} />
      )}

      {/* ── Su diccionario, solo si ha guardado algún término ── */}
      {savedTermsList.length > 0 && (
        <section className="dh-bloque" aria-labelledby="dh-terminos-titulo">
          <header className="pn-hoja-cab">
            <h2 id="dh-terminos-titulo" className="pn-h2">
              Tu diccionario
              <span className="pn-cuenta tono-amarillo">{savedTermsList.length}</span>
            </h2>
            <Tecla href="/glosario" color="blanca" tamano="peq">Ver diccionario <ArrowRight size={14} aria-hidden="true" /></Tecla>
          </header>
          <DashboardSavedTerms initialTerms={savedTermsList} />
        </section>
      )}

      {/* ── Premium (solo a quien no lo tiene): el bloque de tinta ── */}
      {!isPremium && (
        <section className="dh-premium" aria-labelledby="dh-premium-titulo">
          <div className="dh-premium-texto">
            <span className="pn-chip tono-naranja"><Crown size={13} aria-hidden="true" /> Premium</span>
            <h2 id="dh-premium-titulo" className="dh-premium-titulo">Opera con <span className="fluor">método</span>, no de memoria</h2>
            <ul className="dh-premium-lista">
              <li><span className="tono-azul"><NotebookPen size={16} aria-hidden="true" /></span>Diario de Trading con diez estadísticas</li>
              <li><span className="tono-menta"><Wallet size={16} aria-hidden="true" /></span>Portfolio Adelin: mi cartera real, en vivo</li>
              <li><span className="tono-lila"><GraduationCap size={16} aria-hidden="true" /></span>Cursos con examen y certificado</li>
            </ul>
          </div>
          <div className="dh-premium-compra">
            <p className="dh-premium-precio">{PREMIUM_PRICE_EUR.toFixed(2).replace(".", ",")} €<small>/mes</small></p>
            <TeclaPremium href="/premium" tamano="grande" />
            <p className="dh-premium-nota">Sin permanencia · Cancela cuando quieras</p>
          </div>
        </section>
      )}

      {/* ── Lo demás de su cuenta, a mano y sin ocupar sitio ── */}
      <nav className="dp-accesos" aria-label="Tu cuenta">
        <Tecla href="/dashboard/perfil" color="blanca" tamano="peq">
          <UserRound size={14} strokeWidth={2.6} aria-hidden="true" /> Mi perfil
        </Tecla>
        {/* Mi perfil, Diccionario y Calculadora (pedido por el admin el 23-11-2026;
            los cursos ya tienen su sección arriba):
            logros y certificados ya tienen su tecla en su propia sección. En el
            móvil son tres teclas pastel en fila (dashboard.css). */}
        <Tecla href="/glosario" color="blanca" tamano="peq">
          <BookA size={14} strokeWidth={2.6} aria-hidden="true" /> Diccionario
        </Tecla>
        <Tecla href="/calculadora" color="blanca" tamano="peq">
          <Calculator size={14} strokeWidth={2.6} aria-hidden="true" /> Calculadora
        </Tecla>
      </nav>

    </main>
  );
}
