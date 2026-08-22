import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import CuentaPasswordBtn from "@/components/CuentaPasswordBtn";
import CuentaDeleteAccountBtn from "@/components/CuentaDeleteAccountBtn";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import CuentaTelegramCard from "@/components/CuentaTelegramCard";
import { Crown, CreditCard, Calendar, ShieldCheck, ArrowRight, Gem, User, Lock } from "lucide-react";

export const metadata: Metadata = {
  title: "Mi cuenta",
  description: "Gestiona tu suscripción y datos de cuenta.",
};

function statusLabel(status: string | null, willCancel: boolean): string {
  if (willCancel) return "Cancelada";
  switch (status) {
    case "active":    return "Activa";
    case "trialing":  return "En prueba";
    case "past_due":  return "Pago pendiente";
    case "canceled":  return "Cancelada";
    case "unpaid":    return "Impagada";
    default:          return "—";
  }
}

function statusColor(status: string | null, willCancel: boolean): string {
  if (willCancel) return "var(--text-muted)";
  switch (status) {
    case "active":
    case "trialing":  return "var(--accent-orange)";
    case "past_due":
    case "unpaid":    return "#f59e0b";
    case "canceled":  return "var(--text-muted)";
    default:          return "var(--text-muted)";
  }
}

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ portal_error?: string }>;
}) {
  const { portal_error } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/cuenta");

  // Igual que en /dashboard/trading: `subscription_status`, `stripe_customer_id`,
  // etc. no tienen GRANT SELECT para `authenticated` (y no deberían, ya que la
  // policy de profiles es USING(true) — dárselo expondría los datos de Stripe
  // de todos los usuarios a cualquier autenticado). Se leen con el cliente
  // admin, ya verificada la identidad arriba con el cliente normal.
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role, subscription_status, subscription_current_period_end, subscription_cancel_at_period_end, premium_since, stripe_customer_id, telegram_username, telegram_linked_at")
    .eq("id", user.id)
    .single();

  const willCancel = !!profile?.subscription_cancel_at_period_end && profile?.subscription_status === "active";

  const role = profile?.role ?? "free";
  const isPremium = role === "premium" || role === "admin";
  const isAdmin = role === "admin";
  const name = profile?.full_name || user.email?.split("@")[0] || "Usuario";
  const planLabel = isAdmin ? "Admin" : isPremium ? "Premium" : "Free";

  const periodEnd = profile?.subscription_current_period_end
    ? new Date(profile.subscription_current_period_end).toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const daysLeft = profile?.subscription_current_period_end && profile?.subscription_status === "active"
    ? Math.max(0, Math.ceil(
        (new Date(profile.subscription_current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ))
    : null;
  const cycleTotal = 31;
  const daysUsed = daysLeft !== null ? Math.min(cycleTotal, cycleTotal - daysLeft) : null;
  const fillPct = daysLeft !== null ? Math.max(2, Math.round(((cycleTotal - daysLeft) / cycleTotal) * 100)) : null;

  const premiumSince = profile?.premium_since
    ? new Date(profile.premium_since).toLocaleDateString("es-ES", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const hasStripe = !!profile?.stripe_customer_id;

  return (
    <div className="blog-page">
      <div className="bg-ambient" />

      <SiteNav user={true} isPremium={isPremium} userName={name} isAdmin={isAdmin} />

      <main className="blog-main">
        <div className="cuenta-page">

          <div className="cuenta-header">
            <h1 className="cuenta-title">Mi cuenta</h1>
            <p className="cuenta-subtitle">Gestiona tu plan y datos de acceso</p>
          </div>

          {portal_error && (
            <p className="cuenta-portal-error">
              No se pudo conectar con el portal de pagos. Inténtalo de nuevo en unos minutos.
            </p>
          )}

          <div className="cuenta-grid">

            {/* — Perfil — */}
            <div className="cuenta-card">
              <div className="cuenta-card-header">
                <User size={18} />
                <h2>Perfil</h2>
              </div>
              <div className="cuenta-info-list">
                <div className="cuenta-info-row">
                  <span className="cuenta-info-label">Nombre</span>
                  <span className="cuenta-info-value">{name}</span>
                </div>
                <div className="cuenta-info-row">
                  <span className="cuenta-info-label">Email</span>
                  <span className="cuenta-info-value">{user.email}</span>
                </div>
                <div className="cuenta-info-row">
                  <span className="cuenta-info-label">Plan</span>
                  <span
                    className="cuenta-info-value"
                    style={{ color: isPremium ? "var(--accent-orange)" : "inherit", fontWeight: 600 }}
                  >
                    {isPremium && <Gem size={14} style={{ display: "inline", marginBottom: "-2px", marginRight: "4px" }} />}
                    {planLabel}
                  </span>
                </div>
                {premiumSince && (
                  <div className="cuenta-info-row">
                    <span className="cuenta-info-label">Miembro desde</span>
                    <span className="cuenta-info-value">{premiumSince}</span>
                  </div>
                )}
              </div>
              <CuentaPasswordBtn />
            </div>

            {/* — Suscripción — */}
            <div className="cuenta-card">
              <div className="cuenta-card-header">
                <CreditCard size={18} />
                <h2>Suscripción</h2>
              </div>

              {isPremium && hasStripe ? (
                <>
                  <div className="cuenta-info-list">
                    <div className="cuenta-info-row">
                      <span className="cuenta-info-label">Estado</span>
                      <span
                        className="cuenta-info-value"
                        style={{ color: statusColor(profile?.subscription_status ?? null, willCancel), fontWeight: 600 }}
                      >
                        {statusLabel(profile?.subscription_status ?? null, willCancel)}
                      </span>
                    </div>
                    {periodEnd && (
                      <div className="cuenta-info-row">
                        <span className="cuenta-info-label">
                          <Calendar size={13} style={{ display: "inline", marginBottom: "-2px", marginRight: "4px" }} />
                          {profile?.subscription_status === "canceled" || willCancel ? "Acceso hasta" : "Próxima renovación"}
                        </span>
                        <span className="cuenta-info-value">{periodEnd}</span>
                      </div>
                    )}
                    {daysLeft !== null && fillPct !== null && (
                      <div className="cuenta-days-bar">
                        <div className="cuenta-days-meta">
                          <span>{daysUsed} días usados</span>
                          <span>{daysLeft} días restantes</span>
                        </div>
                        <div className="cuenta-days-track">
                          <div className="cuenta-days-fill" style={{ width: `${fillPct}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="cuenta-info-row">
                      <span className="cuenta-info-label">Importe</span>
                      <span className="cuenta-info-value">19,99€ / mes</span>
                    </div>
                  </div>

                  {willCancel && (
                    <p className="cuenta-cancel-notice">
                      Tu suscripción está cancelada y no se renovará. Conservas el acceso Premium
                      hasta el {periodEnd}.
                    </p>
                  )}

                  <a href="/api/stripe/portal" className="cuenta-btn-manage">
                    <CreditCard size={15} />
                    Gestionar suscripción
                    <ArrowRight size={15} className="cuenta-btn-arrow" />
                  </a>
                  <p className="cuenta-manage-hint">
                    <ShieldCheck size={13} style={{ display: "inline", marginBottom: "-2px", marginRight: "4px" }} />
                    {willCancel
                      ? "Puedes reactivar la renovación automática desde el portal seguro de Stripe."
                      : "Cambia método de pago, descarga facturas o cancela desde el portal seguro de Stripe."}
                  </p>
                </>
              ) : isPremium && isAdmin ? (
                <div className="cuenta-info-list">
                  <div className="cuenta-info-row">
                    <span className="cuenta-info-label">Acceso</span>
                    <span className="cuenta-info-value" style={{ color: "var(--accent-orange)", fontWeight: 600 }}>
                      <Crown size={14} style={{ display: "inline", marginBottom: "-2px", marginRight: "4px" }} />
                      Administrador
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <p className="cuenta-no-plan">
                    Actualmente estás en el plan gratuito. Hazte Premium para acceder a todas las herramientas y contenido exclusivo.
                  </p>
                  <Link href="/premium" className="cuenta-btn-manage">
                    <Gem size={15} />
                    Ver planes Premium
                    <ArrowRight size={15} className="cuenta-btn-arrow" />
                  </Link>
                </>
              )}
            </div>

            {/* — Comunidad en Telegram — */}
            {/* El enlace solo se envía si es Premium. CuentaTelegramCard es un
                componente de cliente, así que sus props viajan serializadas en
                el HTML: pasarlo siempre y ocultar el botón al renderizar dejaba
                el enlace a la vista de cualquiera en el código fuente. */}
            <CuentaTelegramCard
              initialLinked={!!profile?.telegram_linked_at}
              initialUsername={profile?.telegram_username ?? null}
              isPremium={isPremium}
              inviteLink={isPremium ? process.env.TELEGRAM_CHANNEL_INVITE_LINK ?? null : null}
            />

            {/* — Seguridad — */}
            <div className="cuenta-card cuenta-card--full" id="seguridad">
              <div className="cuenta-card-header">
                <Lock size={18} />
                <h2>Seguridad</h2>
              </div>
              <TwoFactorSettings />
            </div>

          </div>

          {!isAdmin && (
            <div className="cuenta-danger-zone">
              <div className="cuenta-danger-zone-text">
                <h3>Eliminar cuenta</h3>
                <p>
                  Borra tu perfil, progreso y datos guardados de forma permanente
                  {isPremium ? " y cancela tu suscripción al instante" : ""}. No se puede deshacer.
                </p>
              </div>
              <CuentaDeleteAccountBtn isPremium={isPremium} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
