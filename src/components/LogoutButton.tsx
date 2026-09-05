"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Cerrar sesión. La clase se puede cambiar porque el botón sale en sitios que
 * no se parecen en nada —el menú del móvil, la página de cuenta, el
 * desplegable del nombre en la barra—, y duplicar el `signOut` en cada uno es
 * como se acaba con tres formas distintas de cerrar sesión y una que no limpia
 * bien.
 */
export default function LogoutButton({
  className = "btn-logout",
  children,
  onDone,
}: {
  className?: string;
  children?: React.ReactNode;
  /** Para que quien lo envuelva pueda cerrarse a sí mismo (un menú, un modal). */
  onDone?: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    onDone?.();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className={className}>
      {children ?? "Cerrar sesión"}
    </button>
  );
}
