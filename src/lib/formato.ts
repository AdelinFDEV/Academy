/**
 * Número en formato español, siempre con punto de miles: `Intl` en «es-ES»
 * no agrupa los de cuatro cifras (1234 → «1234») salvo que se le pida.
 */
export function formatoES(n: number, opciones: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat("es-ES", { ...opciones, useGrouping: "always" } as Intl.NumberFormatOptions).format(n);
}
