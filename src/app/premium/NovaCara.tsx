"use client";

import { useMotionValue } from "framer-motion";
import NovaHead from "@/components/trading/NovaHead";

/**
 * Nova de verdad en la tarjeta del Diario de `/premium` (08-11-2026), en lugar
 * de un icono genérico: la misma cabeza que sale en el Diario y en la barra de
 * la web, de frente, contenta y siguiendo el cursor con los ojos. Es cliente
 * porque NovaHead gira con un `MotionValue`; aquí se queda quieta de frente.
 */
export default function NovaCara() {
  const theta = useMotionValue(0);
  return <NovaHead theta={theta} face="happy" activity="none" flying={false} joy={false} talking={false} track />;
}
