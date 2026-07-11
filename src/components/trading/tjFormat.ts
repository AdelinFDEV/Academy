export function pnlStr(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}$`;
}
