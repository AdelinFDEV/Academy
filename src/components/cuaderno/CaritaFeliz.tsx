import TrazoVisible from "./TrazoVisible";
import "./carita.css";

/**
 * La carita feliz del cuaderno: un emoji dibujado a mano, no un emoji de
 * verdad (la web no los usa, ESTILO.md). Cara amarilla con contorno naranja,
 * ojos sonrientes, mofletes y sonrisa. Aparece con un saltito cuando se ve de
 * verdad (TrazoVisible + alVerse) y después se mece despacio.
 *
 * Es un gesto de calidez, no una marca de estudio: como mucho UNA por
 * pantalla, y solo en momentos amables (una bienvenida, una pista, algo bien
 * hecho). Nunca junto a un riesgo, un error o una advertencia. Decoración:
 * `aria-hidden`, sin texto.
 */
export default function CaritaFeliz({
  tamano = 42,
  retraso = 0,
  className,
}: {
  /** Lado en px. */
  tamano?: number;
  /** Milisegundos de espera tras verse, antes del saltito. */
  retraso?: number;
  className?: string;
}) {
  return (
    <TrazoVisible className={["carita", className].filter(Boolean).join(" ")} retraso={retraso}>
      <svg viewBox="0 0 48 48" width={tamano} height={tamano} focusable="false">
        <path className="carita-cara" d="M24 4.5c10.6-.3 19.4 8.2 19.3 19.6-.1 10.9-8.7 19.6-19.5 19.4C13 43.3 4.3 34.6 4.6 23.8 4.9 13 13.3 4.8 24 4.5z" />
        <path className="carita-linea" d="M14.5 21.5c1.4-2.6 4.3-2.7 5.8-.1M27.8 21.3c1.5-2.5 4.4-2.4 5.8.2" />
        <ellipse className="carita-moflete" cx="13" cy="28" rx="3.6" ry="2.3" />
        <ellipse className="carita-moflete" cx="35" cy="28" rx="3.6" ry="2.3" />
        <path className="carita-linea" d="M17.5 29.5c3.6 4.8 9.6 4.9 13.1.1" />
      </svg>
    </TrazoVisible>
  );
}
