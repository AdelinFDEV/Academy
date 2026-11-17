import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft, ArrowRight, Check, Crown, Eye, Lock, MessageCircleQuestion, MessagesSquare, BellRing,
  ShieldCheck, ShieldAlert, CalendarDays, AtSign, CreditCard, Flame, Trophy,
  NotebookPen, PieChart, UserRound, LifeBuoy,
} from "lucide-react";
import { getEffectiveStreak } from "@/lib/streak";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALIAS_DIAS_ENTRE_CAMBIOS } from "@/lib/perfilPublico";
import { INSTAGRAM_DM_URL } from "@/lib/contacto";
import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import PerfilEditor from "@/components/PerfilEditor";
import AvatarUsuario from "@/components/AvatarUsuario";
import { Fila2FA, FilaEliminar, FilaPassword, FilaSesion } from "@/components/PerfilAcciones";
import { InstagramIcon } from "@/components/SocialLinks";
import Tecla from "@/components/cuaderno/Tecla";
import "./perfil.css";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false, follow: false },
};

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días que faltan para poder cambiar otra vez el alias (0 = ya puede).
 *  Fuera del componente: `Date.now()` no puede ir en el render. */
function diasParaCambiar(cambiadoAt: string | null, esAdmin: boolean): number {
  if (!cambiadoAt || esAdmin) return 0;
  const pasado = Date.now() - new Date(cambiadoAt).getTime();
  return Math.max(0, Math.ceil((ALIAS_DIAS_ENTRE_CAMBIOS * DIA_MS - pasado) / DIA_MS));
}

/** Días que quedan hasta una fecha, sin bajar de 0. Fuera del render por lo mismo. */
function diasHasta(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / DIA_MS));
}

function mesYAnio(iso: string | null | undefined): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
}

function fechaLarga(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function estadoSuscripcion(status: string | null, seCancela: boolean): { texto: string; tono: "verde" | "aviso" | "tenue" } {
  if (seCancela) return { texto: "No se renovará", tono: "tenue" };
  switch (status) {
    case "active": return { texto: "Activa", tono: "verde" };
    case "trialing": return { texto: "En prueba", tono: "verde" };
    case "past_due": return { texto: "Pago pendiente", tono: "aviso" };
    case "unpaid": return { texto: "Impagada", tono: "aviso" };
    case "canceled": return { texto: "Cancelada", tono: "tenue" };
    default: return { texto: "—", tono: "tenue" };
  }
}

/** Un permiso del foro: sí o no, con su icono y su frase. */
function Permiso({ si, icono, titulo, texto }: { si: boolean; icono: React.ReactNode; titulo: string; texto: string }) {
  return (
    <li className={`mp-permiso${si ? " is-si" : " is-no"}`}>
      <span className="mp-permiso-icono" aria-hidden="true">{icono}</span>
      <span className="mp-permiso-texto">
        <strong>{titulo}</strong>
        <span>{texto}</span>
      </span>
      <span className={`pn-chip ${si ? "tono-menta" : "tono-gris"}`}>
        {si
          ? <><Check size={13} strokeWidth={3} aria-hidden="true" /> Incluido</>
          : <><Lock size={12} strokeWidth={2.6} aria-hidden="true" /> Premium</>}
      </span>
    </li>
  );
}

/**
 * «Mi perfil»: TODO lo del usuario en una página. Su identidad pública, su
 * plan, su seguridad, el foro, el soporte y borrar la cuenta.
 *
 * Creada el 06-11-2026 para el foro (FORO.md): el foro solo enseñará de cada
 * autor lo que se elige aquí, el alias y la foto, nunca el nombre de la cuenta
 * ni el email. El mismo día absorbió /cuenta, que ahora redirige aquí: dos
 * páginas personales («Mi cuenta» y «Mi perfil») eran dos sitios donde buscar
 * lo mismo. Tiene forma de página de ajustes: cada bloque con su título a la
 * izquierda y su contenido a la derecha. Desde el 17-11-2026, con el estilo
 * «Cuaderno de estudio»: hojas de papel, chips, barra de progreso y teclas.
 *
 * La verificación en dos pasos se destaca, con suavidad, SOLO si no está
 * activada; activada, sale como confirmada y nada más. El estado se lee en el
 * servidor (factores TOTP verificados), así que no parpadea al cargar.
 *
 * Los datos de Stripe no tienen GRANT de lectura para `authenticated` (la
 * policy de `profiles` es pública), así que se leen con la clave de servicio
 * una vez comprobada la sesión: igual que hacía /cuenta.
 */
export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{ portal_error?: string }>;
}) {
  const { portal_error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/perfil");

  const admin = createAdminClient();
  const [{ data: profile }, { data: publico, error: errPublico }, { data: factores }, { count: numLogros }] = await Promise.all([
    admin
      .from("profiles")
      .select("full_name, role, premium_since, created_at, current_streak, last_seen, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end, stripe_customer_id")
      .eq("id", user.id)
      .single(),
    // Aparte: si las columnas del perfil público aún no existen, esta falla
    // sola y la página lo dice, en vez de quedarse sin plan ni nombre.
    admin.from("profiles").select("alias, avatar, alias_cambiado_at").eq("id", user.id).maybeSingle(),
    admin.auth.admin.mfa.listFactors({ userId: user.id }),
    supabase.from("user_badges").select("badge_id", { count: "exact", head: true }).eq("user_id", user.id),
  ]);

  const role = profile?.role ?? "free";
  const esAdmin = role === "admin";
  const esPremium = role === "premium" || esAdmin;
  const nombre = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const inicial = (nombre.trim().charAt(0) || "U").toUpperCase();
  const listo = !errPublico;
  const alias = publico?.alias ?? null;
  const con2fa = (factores?.factors ?? []).some((f) => f.factor_type === "totp" && f.status === "verified");

  const premiumDesde = esPremium ? mesYAnio(profile?.premium_since) : null;
  const miembroDesde = mesYAnio(profile?.created_at ?? user.created_at);
  const planTexto = esAdmin ? "Admin" : esPremium ? "Premium" : "Plan gratuito";
  const racha = getEffectiveStreak(profile?.current_streak, profile?.last_seen);
  const logros = numLogros ?? 0;

  // Los pasos para completar el perfil. Solo lo que depende del usuario y
  // tiene sitio en esta página: la foto, el alias y el segundo paso.
  const pasos = [
    { texto: "Foto de perfil", hecho: !!publico?.avatar, href: "#perfil-publico" },
    { texto: "Alias para el foro", hecho: !!alias, href: "#perfil-publico" },
    { texto: "Verificación en dos pasos", hecho: con2fa, href: "#seguridad" },
  ];
  const completado = pasos.filter((x) => x.hecho).length;
  const pctPerfil = Math.round((completado / pasos.length) * 100);

  // ── La suscripción ──
  const conStripe = esPremium && !esAdmin && !!profile?.stripe_customer_id;
  const status = profile?.subscription_status ?? null;
  const seCancela = !!profile?.subscription_cancel_at_period_end && status === "active";
  const estado = estadoSuscripcion(status, seCancela);
  const finPeriodo = profile?.subscription_current_period_end ?? null;
  const diasRestantes = finPeriodo && status === "active" ? diasHasta(finPeriodo) : null;
  const CICLO = 31;
  const pctCiclo = diasRestantes !== null ? Math.min(100, Math.max(3, Math.round(((CICLO - diasRestantes) / CICLO) * 100))) : null;

  return (
    <main className="dashboard-main mp">
      <header className="pn-cab tono-naranja">
        <Tecla href="/dashboard" color="blanca" tamano="peq" className="pn-volver">
          <ArrowLeft size={14} strokeWidth={2.6} aria-hidden="true" /> Mi panel
        </Tecla>
      </header>

      {/* ── Cabecera: quién eres aquí ── */}
      <section className={`pn-hoja mp-hero${esPremium ? " is-premium" : ""}`} aria-label="Tu perfil">
        <div className="mp-hero-identidad">
          <span className="mp-hero-anillo">
            <AvatarUsuario avatar={publico?.avatar} inicial={inicial} className="mp-hero-foto" />
            {esPremium && <span className="mp-hero-corona" aria-hidden="true"><Crown size={14} strokeWidth={2.6} /></span>}
          </span>
          <div className="mp-hero-texto">
            <p className="pn-mano">mi perfil</p>
            <h1 className="mp-hero-nombre">{alias ? <>@{alias}</> : nombre}</h1>
            <p className="mp-hero-sub">
              {alias
                ? <>{nombre} · {user.email}</>
                : <Link href="#perfil-publico" className="mp-hero-enlace"><AtSign size={14} aria-hidden="true" /> Elige tu alias para el foro</Link>}
            </p>
            <div className="mp-hero-chips">
              <span className={`pn-chip ${esPremium ? "tono-naranja" : "tono-gris"}`}>
                {esPremium && <Crown size={12} aria-hidden="true" />}
                {planTexto}
              </span>
              {con2fa && <span className="pn-chip tono-menta"><ShieldCheck size={12} aria-hidden="true" /> Cuenta protegida</span>}
            </div>
          </div>
        </div>

        {/* Lo que le falta al perfil, con su barra. Completo, se queda como
            un sello; incompleto, cada paso lleva a su sitio. */}
        <div className={`mp-progreso${completado === pasos.length ? " is-completo" : ""}`}>
          <div className="mp-progreso-cab">
            <strong>{completado === pasos.length ? "Perfil completo" : "Completa tu perfil"}</strong>
            <b>{pctPerfil} %</b>
          </div>
          <span
            className="pn-barra tono-menta"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pctPerfil}
            aria-label="Perfil completado"
          >
            <i style={{ width: `${pctPerfil}%` }} />
          </span>
          <ul className="mp-pasos">
            {pasos.map((p) => (
              <li key={p.texto} className={p.hecho ? "is-hecho" : ""}>
                {p.hecho ? (
                  <><span className="mp-paso-marca" aria-hidden="true"><Check size={12} strokeWidth={3.4} /></span> {p.texto}</>
                ) : (
                  <Link href={p.href}><span className="mp-paso-marca" aria-hidden="true" /> {p.texto}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mp-hero-datos">
          <div className="mp-dato tono-naranja">
            <span className="mp-dato-icono" aria-hidden="true"><Flame size={18} /></span>
            <span className="mp-dato-valor">{racha}<small>{racha === 1 ? " día" : " días"}</small></span>
            <span className="mp-dato-texto">de racha</span>
          </div>
          <div className="mp-dato tono-amarillo">
            <span className="mp-dato-icono" aria-hidden="true"><Trophy size={18} /></span>
            <span className="mp-dato-valor">{logros}</span>
            <span className="mp-dato-texto">{logros === 1 ? "logro conseguido" : "logros conseguidos"}</span>
          </div>
          <div className="mp-dato tono-cielo">
            <span className="mp-dato-icono" aria-hidden="true"><CalendarDays size={18} /></span>
            <span className="mp-dato-valor mp-dato-valor--texto">{miembroDesde ? miembroDesde.charAt(0).toUpperCase() + miembroDesde.slice(1) : "—"}</span>
            <span className="mp-dato-texto">en la academia</span>
          </div>
        </div>
      </section>

      {portal_error && (
        <p className="pn-aviso tono-coral" role="alert">
          <span className="pn-aviso-ic" aria-hidden="true">×</span>
          <span className="pn-aviso-texto">No se pudo abrir el portal de pagos. Inténtalo de nuevo en unos minutos.</span>
        </p>
      )}
      {!listo && (
        <p className="pn-aviso tono-cielo" role="status">
          <span className="pn-aviso-ic" aria-hidden="true">i</span>
          <span className="pn-aviso-texto">El perfil público aún no está activado. Vuelve en un rato.</span>
        </p>
      )}

      {/* ── Perfil público ── */}
      <section className="mp-seccion" id="perfil-publico" aria-labelledby="mp-s1">
        <header className="mp-seccion-cab">
          <span className="mp-seccion-icono tono-naranja" aria-hidden="true"><UserRound size={20} /></span>
          <h2 id="mp-s1" className="pn-h2">Perfil público</h2>
          <p>Lo único que verán los demás en el foro. Tu nombre y tu email no salen nunca.</p>
        </header>
        <PerfilEditor
          inicial={inicial}
          aliasInicial={alias ?? ""}
          avatarInicial={publico?.avatar ?? null}
          diasParaCambiar={diasParaCambiar(publico?.alias_cambiado_at ?? null, esAdmin)}
          tieneAlias={!!alias}
          esPremium={esPremium}
          esAdmin={esAdmin}
          premiumDesde={premiumDesde}
          activo={listo}
        />
      </section>

      {/* ── Plan y suscripción ── */}
      <section className="mp-seccion" id="suscripcion" aria-labelledby="mp-s2">
        <header className="mp-seccion-cab">
          <span className="mp-seccion-icono tono-naranja" aria-hidden="true"><Crown size={20} /></span>
          <h2 id="mp-s2" className="pn-h2">Plan</h2>
          <p>
            {conStripe
              ? "Tu suscripción. Los pagos los gestiona Stripe: aquí no se guarda ninguna tarjeta."
              : esAdmin ? "Tu acceso a la academia." : "Lo que incluye tu cuenta y lo que suma Premium."}
          </p>
        </header>

        {conStripe ? (
          <div className="pn-hoja mp-plan">
            <div className="mp-fila is-estatica">
              <span className="mp-fila-icono tono-naranja" aria-hidden="true"><Crown size={18} /></span>
              <span className="mp-fila-texto">
                <strong>Premium <span className={`pn-chip ${estado.tono === "verde" ? "tono-menta" : estado.tono === "aviso" ? "tono-amarillo" : "tono-gris"}`}>{estado.texto}</span></strong>
                <span>{precioEur(PREMIUM_PRICE_EUR)} al mes{premiumDesde ? ` · Premium desde ${premiumDesde}` : ""}</span>
              </span>
            </div>

            {finPeriodo && (
              <dl className="mp-plan-datos">
                <div>
                  <dt>{status === "canceled" || seCancela ? "Acceso hasta" : "Próxima renovación"}</dt>
                  <dd>{fechaLarga(finPeriodo)}</dd>
                </div>
                {diasRestantes !== null && (
                  <div>
                    <dt>Quedan</dt>
                    <dd>{diasRestantes} {diasRestantes === 1 ? "día" : "días"}</dd>
                  </div>
                )}
              </dl>
            )}
            {pctCiclo !== null && (
              <span className="pn-barra tono-naranja" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pctCiclo} aria-label="Periodo actual consumido">
                <i style={{ width: `${pctCiclo}%` }} />
              </span>
            )}

            {seCancela && finPeriodo && (
              <p className="mp-plan-nota">
                Cancelaste la renovación. Conservas Premium hasta el {fechaLarga(finPeriodo)}; puedes reactivarla desde el portal.
              </p>
            )}

            <div className="mp-plan-pie">
              <span><ShieldCheck size={14} aria-hidden="true" /> Facturas, método de pago y cancelación, en el portal seguro de Stripe.</span>
              <Tecla href="/api/stripe/portal" prefetch={false} color="blanca" tamano="peq">
                <CreditCard size={15} aria-hidden="true" /> Gestionar suscripción
              </Tecla>
            </div>
          </div>
        ) : esAdmin ? (
          <div className="pn-hoja mp-lista">
            <div className="mp-fila is-estatica">
              <span className="mp-fila-icono tono-naranja" aria-hidden="true"><Crown size={18} /></span>
              <span className="mp-fila-texto">
                <strong>Administrador</strong>
                <span>Acceso completo a toda la academia, sin suscripción.</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="mp-premium">
            <div className="mp-premium-cab">
              <span className="pn-chip tono-naranja"><Crown size={12} aria-hidden="true" /> Ahora: plan gratuito</span>
              <h3 className="mp-premium-titulo">Pásate a <span className="fluor">Premium</span></h3>
              <p>Guías, diccionario, Predicción de Precio y Logros ya son tuyos. Premium suma las herramientas para operar con método.</p>
            </div>
            <ul className="mp-premium-lista">
              <li>
                <span className="mp-premium-icono tono-azul" aria-hidden="true"><NotebookPen size={18} /></span>
                <span><strong>Diario de Trading</strong>Registra y analiza cada operación</span>
              </li>
              <li>
                <span className="mp-premium-icono tono-menta" aria-hidden="true"><PieChart size={18} /></span>
                <span><strong>Portfolio Adelin</strong>Sigue las compras de AdelinBTC</span>
              </li>
              <li>
                <span className="mp-premium-icono tono-coral" aria-hidden="true"><MessagesSquare size={18} /></span>
                <span><strong>Publicar en el foro</strong>Preguntar y responder</span>
              </li>
            </ul>
            <div className="mp-premium-pie">
              <span className="mp-premium-precio">{precioEur(PREMIUM_PRICE_EUR)}<small>/mes</small></span>
              <Tecla href="/premium" tamano="grande">
                Hazte Premium <ArrowRight size={17} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>
          </div>
        )}
      </section>

      {/* ── Seguridad ── */}
      <section className="mp-seccion" id="seguridad" aria-labelledby="mp-s3">
        <header className="mp-seccion-cab">
          <span className={`mp-seccion-icono ${con2fa ? "tono-menta" : "tono-amarillo"}`} aria-hidden="true">{con2fa ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}</span>
          <h2 id="mp-s3" className="pn-h2">Seguridad</h2>
          <p>Cómo entras en tu cuenta. Una contraseña sola se puede filtrar; con el segundo paso, no basta con ella.</p>
        </header>
        <div className="pn-hoja mp-lista">
          <Fila2FA activada={con2fa} />
          <FilaPassword email={user.email ?? ""} />
        </div>
      </section>

      {/* ── El foro ── */}
      <section className="mp-seccion" aria-labelledby="mp-s4">
        <header className="mp-seccion-cab">
          <span className="mp-seccion-icono tono-coral" aria-hidden="true"><MessagesSquare size={20} /></span>
          <h2 id="mp-s4" className="pn-h2">Foro</h2>
          <p>Preguntas y respuestas de la comunidad. Leer es para todos; publicar, para Premium.</p>
        </header>
        <div className={`pn-hoja mp-foro${esPremium ? " is-premium" : ""}`}>
          <div className="mp-fila is-estatica">
            <span className="mp-fila-icono tono-coral" aria-hidden="true"><MessagesSquare size={18} /></span>
            <span className="mp-fila-texto">
              <strong>{esPremium ? "Tienes acceso completo" : "Puedes leerlo todo"}</strong>
              <span>{esPremium ? "Preguntar, responder y recibir avisos, con tu Premium." : "Para preguntar y responder, hace falta Premium."}</span>
            </span>
          </div>
          <ul className="mp-permisos">
            <Permiso si icono={<Eye size={17} />} titulo="Leer" texto="Todas las preguntas y respuestas" />
            <Permiso si={esPremium} icono={<MessageCircleQuestion size={17} />} titulo="Preguntar" texto="Lo que no encuentres en las guías" />
            <Permiso si={esPremium} icono={<MessagesSquare size={17} />} titulo="Responder" texto="Y ayudar a otros miembros" />
            <Permiso si={esPremium} icono={<BellRing size={17} />} titulo="Avisos" texto="Cuando alguien responda a lo tuyo" />
          </ul>
        </div>
      </section>

      {/* ── Soporte y cuenta ── */}
      <section className="mp-seccion" aria-labelledby="mp-s5">
        <header className="mp-seccion-cab">
          <span className="mp-seccion-icono tono-cielo" aria-hidden="true"><LifeBuoy size={20} /></span>
          <h2 id="mp-s5" className="pn-h2">Ayuda y cuenta</h2>
          <p>Si algo no va bien, escríbenos. Aquí también cierras sesión o, si quieres irte, lo borras todo.</p>
        </header>
        <div className="pn-hoja mp-lista">
          <div className="mp-fila">
            <span className="mp-fila-icono tono-cielo" aria-hidden="true"><InstagramIcon size={18} /></span>
            <span className="mp-fila-texto">
              <strong>Soporte</strong>
              <span>Escríbenos por Instagram con tu duda.</span>
            </span>
            <Tecla href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" color="blanca" tamano="peq" className="mp-fila-accion">
              Escribir <ArrowRight size={14} aria-hidden="true" />
            </Tecla>
          </div>
          <FilaSesion />
          {!esAdmin && <FilaEliminar esPremium={esPremium} />}
        </div>
      </section>
    </main>
  );
}
