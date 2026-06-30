import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Footer from "@/components/Footer";
import BlogMobileMenu from "@/components/BlogMobileMenu";
import NavArticulosDropdown from "@/components/NavArticulosDropdown";
import NavEducacionDropdown from "@/components/NavEducacionDropdown";
import NavHerramientasDropdown from "@/components/NavHerramientasDropdown";
import LogoutButton from "@/components/LogoutButton";
import LiveCounter from "@/components/LiveCounter";
import CuentaPasswordBtn from "@/components/CuentaPasswordBtn";
import { Crown, CreditCard, Calendar, ShieldCheck, ArrowRight, Gem, User } from "lucide-react";

export const metadata: Metadata = {
  title: "Mi cuenta | AdelinBTC Academy",
  description: "Gestiona tu suscripción y datos de cuenta.",
};

function statusLabel(status: string | null): string {
  switch (status) {
    case "active":    return "Activa";
    case "trialing":  return "En prueba";
    case "past_due":  return "Pago pendiente";
    case "canceled":  return "Cancelada";
    case "unpaid":    return "Impagada";
    default:          return "—";
  }
}

function statusColor(status: string | null): string {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, subscription_status, subscription_current_period_end, premium_since, stripe_customer_id")
    .eq("id", user.id)
    .single();

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

      <nav className="blog-nav">
        <Link href="/" className="blog-brand">adelin<span>btc</span></Link>
        <LiveCounter />
        <div className="blog-nav-links">
          <NavArticulosDropdown />
          <NavEducacionDropdown />
          <NavHerramientasDropdown user={true} isPremium={isPremium} />
          <Link href="/dashboard" className="btn-nav-cta">Mi academia →</Link>
          <LogoutButton />
        </div>
        <BlogMobileMenu user={true} isPremium={isPremium} userName={name} isAdmin={isAdmin} />
      </nav>

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
                        style={{ color: statusColor(profile?.subscription_status ?? null), fontWeight: 600 }}
                      >
                        {statusLabel(profile?.subscription_status ?? null)}
                      </span>
                    </div>
                    {periodEnd && (
                      <div className="cuenta-info-row">
                        <span className="cuenta-info-label">
                          <Calendar size={13} style={{ display: "inline", marginBottom: "-2px", marginRight: "4px" }} />
                          {profile?.subscription_status === "canceled" ? "Acceso hasta" : "Próxima renovación"}
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

                  <a href="/api/stripe/portal" className="cuenta-btn-manage">
                    <CreditCard size={15} />
                    Gestionar suscripción
                    <ArrowRight size={15} className="cuenta-btn-arrow" />
                  </a>
                  <p className="cuenta-manage-hint">
                    <ShieldCheck size={13} style={{ display: "inline", marginBottom: "-2px", marginRight: "4px" }} />
                    Cambia método de pago, descarga facturas o cancela desde el portal seguro de Stripe.
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

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
