/**
 * Los números y las listas cerradas del foro (FORO.md §4, §7.2 y §8).
 *
 * Es uno de los DOS archivos de `src/lib/foro/` que puede importar el
 * navegador (el otro es `tipos.ts`): el formulario y la API leen de aquí los
 * mismos límites. No lleva lógica ni toca nada del servidor.
 *
 * Las restricciones `check` de `scripts/create-foro.sql` repiten los máximos
 * como última barrera: si cambias un número aquí, cámbialo también allí.
 */

export const LIMITES = {
  titulo: { min: 15, max: 150 },
  pregunta: { min: 30, max: 5000 },
  respuesta: { min: 20, max: 3000 },
  replica: { min: 5, max: 1000 },
  detalleReporte: { max: 500 },
  imagenesPorPregunta: 4,
  /** Saltos de línea como mucho en un mensaje: más es un muro o un dibujo. */
  saltos: 80,
  /** Lo que puede pesar el cuerpo de una petición a la API del foro. */
  peticionBytes: 16 * 1024,
  /** Minutos durante los que se puede editar lo propio. */
  minutosParaEditar: 30,
} as const;

/** Las tres etiquetas de una pregunta. El orden es el de los botones. */
export const ETIQUETAS = [
  { id: "interesante", nombre: "Interesante", ayuda: "Esta pregunta aporta" },
  { id: "gracias", nombre: "Gracias", ayuda: "Me ha servido leer esto" },
  { id: "yo_tambien", nombre: "Yo también", ayuda: "Tengo la misma duda" },
] as const;
export type EtiquetaId = (typeof ETIQUETAS)[number]["id"];
export const ETIQUETA_IDS = ETIQUETAS.map((e) => e.id) as [EtiquetaId, ...EtiquetaId[]];

/** Por qué se reporta un mensaje. Lista cerrada: la misma del `check` de la tabla. */
export const MOTIVOS_REPORTE = [
  { id: "estafa", nombre: "Estafa o spam" },
  { id: "insulto", nombre: "Insulto o falta de respeto" },
  { id: "datos_personales", nombre: "Datos personales de alguien" },
  { id: "consejo_peligroso", nombre: "Consejo peligroso" },
  { id: "fuera_de_tema", nombre: "Fuera de tema" },
  { id: "otro", nombre: "Otro motivo" },
] as const;
export type MotivoReporteId = (typeof MOTIVOS_REPORTE)[number]["id"];
export const MOTIVO_REPORTE_IDS = MOTIVOS_REPORTE.map((m) => m.id) as [MotivoReporteId, ...MotivoReporteId[]];

/** Los niveles salen de los puntos de siempre (FORO.md §10.3). Solo estatus. */
export const NIVELES = [
  { desde: 1000, nombre: "Referente" },
  { desde: 250, nombre: "Experto" },
  { desde: 50, nombre: "Colaborador" },
  { desde: 0, nombre: "Nuevo" },
] as const;

export function nivelDe(puntos: number): string {
  return (NIVELES.find((n) => puntos >= n.desde) ?? NIVELES[NIVELES.length - 1]).nombre;
}
