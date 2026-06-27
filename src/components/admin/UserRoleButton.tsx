"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "free" | "premium" | "admin";

export default function UserRoleButton({ userId, role }: { userId: string; role: Role }) {
  const [current, setCurrent] = useState<Role>(role);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function cycleRole() {
    if (current === "admin") return;
    const next: Role = current === "free" ? "premium" : "free";
    setLoading(true);
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    });
    setCurrent(next);
    setLoading(false);
    router.refresh();
  }

  const label = current === "admin" ? "Admin" : current === "premium" ? "Premium" : "Free";
  const cls =
    current === "admin"
      ? "role-toggle admin-role"
      : current === "premium"
      ? "role-toggle premium-role"
      : "role-toggle free-role";

  return (
    <button className={cls} onClick={cycleRole} disabled={loading || current === "admin"} title={current === "admin" ? "No editable" : "Cambiar rol"}>
      {loading ? "..." : label}
    </button>
  );
}
