import Link from "next/link";

/**
 * Lo que ve quien pulsa un botón de participar y no puede (FORO.md §3).
 *
 * El botón se ve igual que para un Premium —así se entiende qué se gana—, y
 * al pulsarlo sale esto en vez de hacer la acción: por qué no puede y cuál es
 * el paso siguiente. Es la puerta de venta; la barrera de verdad está en el
 * servidor, que rechaza la acción aunque se salte esto.
 */
const CASOS: Record<string, { texto: string; enlace?: { href: string; nombre: string } }> = {
  sin_sesion: {
    texto: "Para participar en el foro necesitas una cuenta Premium. Leer es libre.",
    enlace: { href: "/login?next=/foro", nombre: "Iniciar sesión" },
  },
  no_premium: {
    texto: "Preguntar, responder y valorar es parte de Premium, junto con el Diario de Trading, el Portfolio y los Cursos.",
    enlace: { href: "/premium", nombre: "Ver Premium" },
  },
  sin_alias: {
    texto: "Antes de participar, elige el alias con el que firmarás en el foro. Nunca se enseña tu nombre ni tu email.",
    enlace: { href: "/dashboard/perfil", nombre: "Elegir mi alias" },
  },
  sin_normas: {
    texto: "Antes de tu primera participación tienes que leer y aceptar las normas de la comunidad.",
    enlace: { href: "/foro/normas", nombre: "Leer las normas" },
  },
  falta_2fa: {
    texto: "Tu cuenta tiene la verificación en dos pasos activada: complétala para poder participar.",
    enlace: { href: "/mfa-challenge?next=/foro", nombre: "Completar la verificación" },
  },
  sancionado: { texto: "Ahora mismo no puedes participar en el foro. El motivo está en tus avisos." },
  solo_lectura: { texto: "El foro está en modo de solo lectura en este momento. Vuelve a intentarlo más tarde." },
  foro_cerrado: { texto: "El foro no está abierto todavía." },
};

export default function Invitacion({ motivo, onCerrar }: { motivo: string | null; onCerrar?: () => void }) {
  const caso = CASOS[motivo ?? ""] ?? { texto: "Ahora mismo no se puede completar. Inténtalo de nuevo en unos minutos." };
  return (
    <div className="fp-invitacion" role="status">
      <p>{caso.texto}</p>
      <div className="fp-fila">
        {caso.enlace && <Link href={caso.enlace.href} className="fp-btn fp-btn--firme">{caso.enlace.nombre}</Link>}
        {onCerrar && <button type="button" className="fp-btn" onClick={onCerrar}>Cerrar</button>}
      </div>
    </div>
  );
}
