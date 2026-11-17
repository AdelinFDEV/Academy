import confetti from "canvas-confetti";
import { sonar } from "@/lib/sonidos";

/** Los colores del cuaderno: el confeti es de la casa, no dorado (como el del quiz de las guías). */
const COLORES = ["#2fbff5", "#ff8a1f", "#2fc488", "#ffd23f", "#8f7cff", "#ff6b81"];

/**
 * El logro del foro: elegir la respuesta que resolvió la duda. Fanfarria y
 * confeti a la vez, y solo tras el «sí» del servidor (ESTILO.md: solo en
 * momentos ganados). Con «reducir movimiento», sin confeti.
 */
export function celebrarGanadora() {
  sonar("logro");
  const base = { colors: COLORES, zIndex: 20000, disableForReducedMotion: true };
  void confetti({ ...base, particleCount: 70, spread: 100, startVelocity: 50, origin: { x: 0.5, y: 0.5 } });
  void confetti({ ...base, particleCount: 40, spread: 120, startVelocity: 44, origin: { x: 0.15, y: 0.65 } });
  void confetti({ ...base, particleCount: 40, spread: 120, startVelocity: 44, origin: { x: 0.85, y: 0.65 } });
}
