import { createClient } from "@/lib/supabase/server";
import UserRoleButton from "@/components/admin/UserRoleButton";
import Icon from "@/components/Icon";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const [{ data: users }, { data: readRows }, { data: badgeRows }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, role, current_streak, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_posts").select("user_id").not("read_at", "is", null),
    supabase.from("user_badges").select("user_id"),
  ]);

  // Count reads and badges per user
  const readMap: Record<string, number> = {};
  (readRows ?? []).forEach((r) => { readMap[r.user_id] = (readMap[r.user_id] ?? 0) + 1; });

  const badgeMap: Record<string, number> = {};
  (badgeRows ?? []).forEach((b) => { badgeMap[b.user_id] = (badgeMap[b.user_id] ?? 0) + 1; });

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
              <th>Rol</th>
              <th>Artículos leídos</th>
              <th>Logros</th>
              <th>Racha</th>
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
                <td>
                  <UserRoleButton userId={u.id} role={u.role as "free" | "premium" | "admin"} />
                </td>
                <td className="users-table-num">
                  {readMap[u.id] ? (
                    <span className="users-reads">{readMap[u.id]}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td className="users-table-num">
                  {badgeMap[u.id] ? (
                    <span className="users-badges">{badgeMap[u.id]}</span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )}
                </td>
                <td className="users-table-num">
                  {u.current_streak > 0 ? (
                    <span className="users-streak">{u.current_streak}d</span>
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
