/**
 * Lo que el foro enseña al navegador, campo a campo (FORO.md §6.0, regla 3).
 *
 * NADA sale del servidor sin ser uno de estos tipos, y `datos/` los construye
 * a mano, sin `select *` ni `...fila`. Por eso aquí NO HAY, ni habrá:
 *   · ningún id de usuario (`autor_id`, `usuario_id`…): sin perfiles visitables
 *     no hace falta, y con él se podría cruzar la actividad de alguien;
 *   · huellas, motivos internos, reportes ni nada de moderación.
 * Si un tipo de aquí necesita un campo nuevo, se añade aquí primero y luego
 * en su lectura: el día que la tabla gane una columna privada, no sale sola.
 *
 * Es uno de los dos archivos del módulo que puede importar el navegador.
 */
import type { EtiquetaId } from "./limites";

/** Quien firma un mensaje. `null` = la cuenta ya no existe («usuario eliminado»). */
export type AutorForo = {
  alias: string;
  /** Id de la foto en `AVATARES` (`src/lib/perfilPublico.ts`), o null. */
  avatar: string | null;
  nivel: string;
  esAdmin: boolean;
} | null;

/** El resultado de cualquier acción del foro, tal cual llega al navegador. */
export type ResultadoForo<T extends Record<string, unknown> = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; mensaje: string };

/** Lo que el propio usuario ha hecho en un hilo. Se pide aparte y nunca se cachea. */
export type MioEnHilo = {
  /** Puede participar ahora mismo; si no, por qué (código de `errores.ts`). */
  puede: boolean;
  motivo: string | null;
  esAutorDeLaPregunta: boolean;
  /** Ids de las respuestas y réplicas con su me gusta. */
  meGusta: string[];
  etiquetas: EtiquetaId[];
  /** Ids de los mensajes suyos en el hilo (para editar o borrar). */
  mios: string[];
  /** Lo que ya ha reportado: "pregunta" o el id de la respuesta. */
  reportados: string[];
  /** Sigue este hilo: le avisan de cada respuesta nueva (23-11-2026). */
  sigue: boolean;
};

export type AvisoForo = {
  id: string;
  tipo: string;
  cuantos: number;
  leido: boolean;
  /** Solo en los de moderación: el motivo que ve el afectado. */
  motivo: string;
  fecha: string;
  /** A dónde lleva. null si el hilo ya no existe. */
  hilo: { id: number; slug: string; titulo: string } | null;
  respuestaId: string | null;
};

/**
 * La frase de un aviso. Los de valoraciones van agrupados («5 personas…»).
 * Vive aquí, junto a su tipo, porque la usan «Lo mío» y el dashboard.
 */
export function fraseDeAviso(a: AvisoForo): string {
  const n = a.cuantos;
  const personas = n === 1 ? "Una persona" : `${n} personas`;
  switch (a.tipo) {
    case "respuesta": return n === 1 ? "Nueva respuesta en tu pregunta" : `${n} respuestas nuevas en tu pregunta`;
    case "replica": return n === 1 ? "Nueva réplica en un hilo donde participas" : `${n} réplicas nuevas en un hilo donde participas`;
    case "me_gusta": return `${personas} ${n === 1 ? "ha dado" : "han dado"} me gusta a tu mensaje`;
    case "interesante": return `${personas} ${n === 1 ? "ha marcado" : "han marcado"} «Interesante» en tu pregunta`;
    case "gracias": return `${personas} ${n === 1 ? "ha marcado" : "han marcado"} «Gracias» en tu pregunta`;
    case "yo_tambien": return `${personas} ${n === 1 ? "tiene" : "tienen"} tu misma duda`;
    case "ganadora": return "Han elegido tu respuesta";
    case "elige_ganadora": return "Tu pregunta tiene respuestas: ya puedes elegir la que te ha servido";
    case "ganadora_retirada": return "La respuesta que elegiste se ha retirado: puedes elegir otra";
    case "retirado": return "Un mensaje tuyo se ha retirado";
    case "restaurado": return "Un mensaje tuyo vuelve a estar publicado";
    case "sancion": return "Has recibido una sanción en el foro";
    case "seguido": return n === 1 ? "Nueva respuesta en un hilo que sigues" : `${n} respuestas nuevas en un hilo que sigues`;
    case "mencion": return n === 1 ? "Te han mencionado en un mensaje" : `Te han mencionado ${n} veces en un hilo`;
    default: return "Tienes una novedad en el foro";
  }
}

// ── El panel de moderación (/admin/foro) ────────────────────────────────────
// Tampoco aquí hay ids de usuario: el admin sanciona AL AUTOR DE UN MENSAJE y
// el servidor busca quién es (`acciones/moderar.ts`).

export type AutorEnModeracion = {
  /** null = la cuenta ya no existe. */
  alias: string | null;
  puntos: number;
  /** Sanciones que ha tenido (cualquiera, vigentes o no). */
  sanciones: number;
  /** Mensajes suyos ocultados o borrados por moderación. */
  retirados: number;
  /** Lleva menos de 7 días en el foro. */
  nuevo: boolean;
};

export type MensajeModerado = {
  /** Para React: "p:12" o "r:<uuid>". */
  clave: string;
  preguntaId: number;
  respuestaId: string | null;
  clase: "pregunta" | "respuesta" | "replica";
  hilo: { slug: string; titulo: string };
  texto: string;
  estado: string;
  fecha: string;
  imagenes: number;
  autor: AutorEnModeracion;
  /** Los reportes ABIERTOS sobre este mensaje. */
  reportes: { motivo: string; detalle: string; fecha: string }[];
};

export type SancionForo = {
  id: string;
  alias: string | null;
  tipo: string;
  hasta: string | null;
  motivo: string;
  fecha: string;
};

export type EntradaRegistro = {
  id: number;
  fecha: string;
  /** El alias de quien lo hizo, o «Sistema». */
  actor: string;
  accion: string;
  motivo: string;
  hilo: { id: number; titulo: string } | null;
  /** Sobre quién, si aplica. */
  sobre: string | null;
};

export type AlertaDeVotos = { de: string; a: string; votos: number };

export type PanelModeracion = {
  modo: string;
  cifras: { preguntas: number; respuestas: number; reportesAbiertos: number; ocultos: number; participantes: number };
  /** Mensajes con reportes abiertos: los de «estafa» primero. */
  cola: MensajeModerado[];
  /** Mensajes ocultos sin reportes abiertos (ocultados por el admin). */
  ocultos: MensajeModerado[];
  sanciones: SancionForo[];
  registro: EntradaRegistro[];
  alertas: AlertaDeVotos[];
};

// ── El ranking (/foro/ranking) ──────────────────────────────────────────────

/** Una fila del ranking. Sin enlace a ningún perfil: no los hay. */
export type FilaRanking = {
  posicion: number;
  alias: string;
  avatar: string | null;
  nivel: string;
  cifra: number;
};

export type RankingForo = {
  /** Se reinicia cada mes: alguien nuevo puede ganar en su primer mes. */
  puntosDelMes: FilaRanking[];
  puntosDeSiempre: FilaRanking[];
  ganadoras: FilaRanking[];
  gracias: FilaRanking[];
};

// ── El texto de un mensaje, listo para pintar ───────────────────────────────
// El mensaje se guarda como texto plano; el servidor lo convierte en esta
// estructura (`texto/formato.ts`) y el navegador la pinta con elementos de
// React (`TextoBloques`). Nunca viaja HTML.

/** Un trozo de una línea. Un enlace solo existe si su dominio está permitido. */
export type TrozoForo =
  | { tipo: "texto"; texto: string; negrita: boolean }
  | { tipo: "enlace"; texto: string; url: string; negrita: boolean }
  /** `texto` es «@alias», tal cual se escribió. Sin enlace: no hay perfiles. */
  | { tipo: "mencion"; texto: string; negrita: boolean };

export type BloqueForo =
  | { tipo: "parrafo"; trozos: TrozoForo[] }
  | { tipo: "lista"; numerada: boolean; puntos: TrozoForo[][] };

// ── Lo público: el listado y el hilo ────────────────────────────────────────

export type CategoriaForo = { slug: string; nombre: string; descripcion: string; hilos: number };

/** Una pregunta en el listado. */
export type HiloEnListado = {
  id: number;
  slug: string;
  titulo: string;
  categoria: { slug: string; nombre: string };
  /** Las primeras líneas de la pregunta, para el listado. */
  extracto: string;
  autor: AutorForo;
  fecha: string;
  ultimaActividad: string;
  respuestas: number;
  /** Tiene respuesta ganadora. */
  resuelto: boolean;
  fijado: boolean;
  yoTambien: number;
  /** Solo en el buscador: el título partido, con lo que coincide marcado. */
  tituloMarcado?: { texto: string; marca: boolean }[];
};

/** Lo que devuelve el buscador del foro (`/foro/buscar`). */
export type BusquedaForo = {
  /** Lo buscado, ya limpio (lo que se enseña en la caja). */
  consulta: string;
  /** Las palabras que se han buscado de verdad. Vacío = no había nada que buscar. */
  palabras: string[];
  hilos: HiloEnListado[];
};

/** Un hilo en una lista corta: sugerencias del buscador y «¿es alguna de estas?». */
export type HiloSugerido = {
  id: number;
  slug: string;
  titulo: string;
  categoria: { slug: string; nombre: string };
  respuestas: number;
  resuelto: boolean;
};

export type ListadoForo = {
  categorias: CategoriaForo[];
  /** La categoría que se está viendo, o null si son todas. */
  categoria: CategoriaForo | null;
  hilos: HiloEnListado[];
  pagina: number;
  paginas: number;
  total: number;
  /** Las cifras de todo el foro, para la cabecera. */
  cifras: { preguntas: number; respuestas: number; resueltas: number };
};

/** Una respuesta o una réplica, tal como se pinta. */
export type MensajeForo = {
  id: string;
  texto: string;
  fecha: string;
  editado: boolean;
  editadoPorModeracion: boolean;
  autor: AutorForo;
  meGusta: number;
  esGanadora: boolean;
  /** En una réplica que contesta a otra: el alias de a quién. */
  citado: string | null;
  /** Solo en las respuestas: sus réplicas, por orden de llegada. */
  replicas: MensajeForo[];
  /** Sus imágenes (23-11-2026), como mucho 2. */
  imagenes: ImagenForo[];
};

export type ImagenForo = { url: string; ancho: number; alto: number };

export type HiloForo = {
  id: number;
  slug: string;
  titulo: string;
  texto: string;
  categoria: { slug: string; nombre: string };
  autor: AutorForo;
  fecha: string;
  editado: boolean;
  editadoPorModeracion: boolean;
  /** Resuelto o cerrado por el admin: no admite más respuestas. */
  cerrado: boolean;
  fijado: boolean;
  etiquetas: { interesante: number; gracias: number; yoTambien: number };
  imagenes: ImagenForo[];
  /** Ordenadas ya: la ganadora primero (FORO.md §9.1). */
  respuestas: MensajeForo[];
  /** Cuántas respuestas publicadas hay (sin contar réplicas). */
  totalRespuestas: number;
  /** Si Google puede indexarlo (FORO.md §12). */
  indexable: boolean;
  /** Los alias mencionados en el hilo que existen, en minúsculas (23-11-2026). */
  menciones: string[];
};

// ── Lo mío en el foro (/foro/mio) ───────────────────────────────────────────

/** Un mensaje propio, con su estado. Solo lo ve su autor. */
export type MensajeMio = {
  preguntaId: number;
  respuestaId: string | null;
  clase: "pregunta" | "respuesta" | "replica";
  /** El título del hilo. */
  titulo: string;
  slug: string;
  /** Las primeras palabras de lo que escribió. */
  extracto: string;
  estado: string;
  /** Si se ocultó o se retiró: el motivo que dio la moderación. */
  motivo: string;
  fecha: string;
};

/**
 * Una pregunta del propio usuario con su estado, para su dashboard
 * (23-11-2026). Solo la ve él: sale de `misPreguntas`, con su sesión.
 */
export type PreguntaMia = {
  id: number;
  slug: string;
  titulo: string;
  /** «publicada» u «oculta» (las borradas no salen). */
  estado: string;
  /** Si se ocultó: el motivo que dio la moderación. */
  motivo: string;
  respuestas: number;
  /** Tiene respuesta ganadora. */
  resuelta: boolean;
  fecha: string;
  ultimaActividad: string;
};

export type LoMio = {
  alias: string | null;
  puntos: number;
  puntosDelMes: number;
  nivel: string;
  ganadoras: number;
  gracias: number;
  logros: string[];
  fueraDelRanking: boolean;
  /** Sanciones en vigor, con el motivo que ve el sancionado. */
  sanciones: { tipo: string; hasta: string | null; motivo: string; fecha: string }[];
  avisos: AvisoForo[];
  sinLeer: number;
  mensajes: MensajeMio[];
  /** Los hilos que sigue, los últimos primero (23-11-2026). */
  seguidos: HiloSugerido[];
};
