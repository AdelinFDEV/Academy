"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Tecla, { type ColorTecla, type TamanoTecla } from "@/components/cuaderno/Tecla";

/**
 * Cerrar sesión. Sale en sitios que no se parecen en nada —el menú del móvil,
 * el desplegable del nombre en la barra, «Mi perfil», el panel del admin, el
 * 2FA al entrar—, y duplicar el `signOut` en cada uno es como se acaba con
 * tres formas distintas de cerrar sesión y una que no limpia bien.
 *
 * Dos trajes:
 *  · con `tecla`, es una <Tecla> de verdad (suena y se hunde como todas);
 *  · sin ella, un botón con la clase que le pase quien lo envuelva (las
 *    filas de los menús, que no tienen forma de tecla).
 */
export default function LogoutButton({
  className,
  children,
  onDone,
  tecla,
}: {
  className?: string;
  children?: React.ReactNode;
  /** Para que quien lo envuelva pueda cerrarse a sí mismo (un menú, un modal). */
  onDone?: () => void;
  /** Vestirlo de tecla: su color, su tamaño y si ocupa todo el ancho. */
  tecla?: { color?: ColorTecla; tamano?: TamanoTecla; ancho?: boolean };
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    onDone?.();
    router.push("/login");
    router.refresh();
  }

  if (tecla) {
    return (
      <Tecla color={tecla.color ?? "blanca"} tamano={tecla.tamano} ancho={tecla.ancho} className={className} onClick={handleLogout}>
        {children ?? "Cerrar sesión"}
      </Tecla>
    );
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      {children ?? "Cerrar sesión"}
    </button>
  );
}
