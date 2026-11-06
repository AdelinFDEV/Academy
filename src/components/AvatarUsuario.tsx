import { Bitcoin, Gem, ShieldCheck, TrendingUp } from "lucide-react";
import { avatarPorId, type VarianteAvatar } from "@/lib/perfilPublico";

const ICONO: Record<VarianteAvatar["icono"], typeof Bitcoin> = {
  bitcoin: Bitcoin,
  grafica: TrendingUp,
  escudo: ShieldCheck,
  diamante: Gem,
};

/**
 * La foto de perfil de un usuario, la misma en la barra, el dashboard y,
 * cuando exista, el foro.
 *
 * Tres casos, en este orden: la imagen de su variante, si ya existe; la
 * baldosa de reserva de esa variante (su color y su icono), mientras el admin
 * no haya hecho la imagen; y su inicial, si no ha elegido ninguna.
 *
 * Sin estado ni efectos a propósito: sirve igual en componentes de servidor
 * que de cliente. El tamaño y la forma los pone quien lo usa, con su clase.
 */
export default function AvatarUsuario({
  avatar,
  inicial,
  className = "",
}: {
  avatar: string | null | undefined;
  inicial: string;
  className?: string;
}) {
  const v = avatarPorId(avatar);
  if (!v) {
    return <span className={`avatar-usuario ${className}`}>{inicial}</span>;
  }
  const Icono = ICONO[v.icono];
  return (
    <span
      className={`avatar-usuario is-variante ${className}`}
      style={{ "--av-c": v.color, "--av-c2": v.color2 } as React.CSSProperties}
    >
      {v.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- estático, ~256 px, ya optimizado a mano
        <img src={v.src} alt="" width={256} height={256} className="avatar-usuario-img" />
      ) : (
        <Icono className="avatar-usuario-icono" strokeWidth={2.2} aria-hidden="true" />
      )}
    </span>
  );
}
