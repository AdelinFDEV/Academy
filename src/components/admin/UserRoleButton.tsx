"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Role = "free" | "premium" | "admin";

export default function UserRoleButton({ userId, role }: { userId: string; role: Role }) {
  const [current, setCurrent] = useState<Role>(role);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function cycleRole() {
    if (current === "admin") return;
    const next: Role = current === "free" ? "premium" : "free";
    setLoading(true);
    await supabase.from("profiles").update({ role: next }).eq("id", userId);
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
