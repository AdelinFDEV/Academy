import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import UserRoleButton from "@/components/admin/UserRoleButton";
import AdminMfaResetButton from "@/components/admin/AdminMfaResetButton";
import Icon from "@/components/Icon";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [{ data: users }, { data: badgeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_badges").select("user_id"),
  ]);

  // Logros por usuario
  const badgeMap: Record<string, number> = {};
  (badgeRows ?? []).forEach((b) => { badgeMap[b.user_id] = (badgeMap[b.user_id] ?? 0) + 1; });

  // El email vive en auth.users (Supabase), no en profiles — hace falta la
  // service role key para leerlo. Si no está configurada (p.ej. en local sin
  // la key), no rompemos la página: simplemente no se muestra el email.
  const emailMap: Record<string, string> = {};
  const mfaMap: Record<string, boolean> = {};
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data: authData, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      (authData?.users ?? []).forEach((u) => {
        if (u.email) emailMap[u.id] = u.email;
      });

      // listUsers() no incluye los factores de 2FA (siempre vienen undefined) —
      // hay que pedirlos aparte, uno por usuario.
      const mfaResults = await Promise.all(
        (authData?.users ?? []).map((u) => admin.auth.admin.mfa.listFactors({ userId: u.id }))
      );
      (authData?.users ?? []).forEach((u, i) => {
        const factors = mfaResults[i].data?.factors ?? [];
        mfaMap[u.id] = factors.some((f) => f.status === "verified");
      });
    } catch (err) {
      console.error("[admin/users] no se pudieron cargar los emails:", err);
    }
  }

  const total    = users?.length ?? 0;
  const premium  = (users ?? []).filter((u) => u.role === "premium").length;
  const admins   = (users ?? []).filter((u) => u.role === "admin").length;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Usuarios</h1>
          <p className="admin-page-subtitle">
            {total} registrados · {premium} premium · {admins} admin
          </p>
        </div>
      </div>

      {/* Mini stats */}
      <div className="admin-users-stats">
        <div className="admin-users-stat">
          <Icon name="users" size={16} />
          <span>{total} total</span>
        </div>
        <div className="admin-users-stat premium">
          <Icon name="crown" size={16} />
          <span>{premium} premium</span>
        </div>
        <div className="admin-users-stat conversion">
          <Icon name="trending" size={16} />
          <span>{total > 0 ? Math.round((premium / total) * 100) : 0}% conversión</span>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Logros</th>
              <th>2FA</th>
              <th>Registrado</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">No hay usuarios</td>
              </tr>
            )}
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="users-table-name">
                  <div className="users-avatar">
                    {(u.full_name ?? "?")[0].toUpperCase()}
                  </div>
                  <span>{u.full_name ?? <span style={{ color: "var(--text-muted)" }}>Sin nombre</span>}</span>
                </td>
                <td className="users-table-email">
                  {emailMap[u.id] ?? <span style={{ color: "var(--text-muted)" }}>—</span>}
                </td>
                <td>
                  <UserRoleButton userId={u.id} role={u.role as "free" | "premium" | "admin"} />
                </td>
                <td className="users-table-num">
                  {badgeMap[u.id] ? (
                    <span className="users-badges">{badgeMap[u.id]}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td className="users-table-num">
                  {mfaMap[u.id] ? (
                    <AdminMfaResetButton userId={u.id} />
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td className="users-table-date">
                  {new Date(u.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
