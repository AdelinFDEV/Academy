"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Tecla, { type ColorTecla } from "@/components/cuaderno/Tecla";
import { sonar } from "@/lib/sonidos";

type Role = "free" | "premium" | "admin";

/**
 * El rol de un usuario en la tabla de /admin. Pulsarlo lo pasa entre gratuito
 * y Premium; el admin no se edita. Es una tecla: blanca si es gratuito,
 * naranja (el color de Premium) si es Premium y gris, quieta, si es admin.
 *
 * Es un conmutador: el cambio suena `interruptor` y solo se pinta cuando el
 * servidor lo confirma; si falla, suena `error` y se queda como estaba.
 */
export default function UserRoleButton({ userId, role }: { userId: string; role: Role }) {
  const [current, setCurrent] = useState<Role>(role);
  const [loading, setLoading] = useState(false);
  const [fallo, setFallo] = useState(false);
  const router = useRouter();

  async function cycleRole() {
    if (current === "admin") return;
    const next: Role = current === "free" ? "premium" : "free";
    setLoading(true);
    setFallo(false);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) throw new Error(String(res.status));
      sonar("interruptor");
      setCurrent(next);
      router.refresh();
    } catch {
      sonar("error");
      setFallo(true);
    }
    setLoading(false);
  }

  const label = current === "admin" ? "Admin" : current === "premium" ? "Premium" : "Free";
  const color: ColorTecla = current === "premium" ? "naranja" : "blanca";

  return (
    <span className="admin-rol">
      <Tecla
        color={color}
        tamano="peq"
        onClick={cycleRole}
        disabled={loading || current === "admin"}
        title={current === "admin" ? "No editable" : "Cambiar rol"}
        aria-label={current === "admin" ? "Rol: Admin" : `Rol: ${label}. Pulsa para pasar a ${current === "premium" ? "Free" : "Premium"}`}
      >
        {loading ? "…" : label}
      </Tecla>
      {fallo && <span className="admin-fallo" role="alert">No se pudo cambiar</span>}
    </span>
  );
}
