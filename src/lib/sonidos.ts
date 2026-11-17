/**
 * Los sonidos de la web (estilo «Cuaderno de estudio», ESTILO.md → «Los sonidos»).
 *
 * Un sistema único: cualquier pieza llama a `sonar("tecla")`, `sonar("girar")`…
 * y aquí se decide cómo suena. Reglas que no se tocan:
 *  · Vienen ENCENDIDOS por defecto (decidido por el admin el 17-11-2026); quien
 *    los silencia, queda silenciado (`localStorage`, clave `sonido`).
 *  · Web Audio API y no `<audio>`: suena al instante, también en iOS.
 *  · Un solo `AudioContext`, creado o reanudado dentro del gesto de la persona
 *    (los navegadores no dejan sonar nada antes de que toque la página).
 *  · Sintetizados aquí mismo: sin archivos que descargar ni licencias de terceros.
 *  · Cortos y a volumen bajo, con una variación mínima de tono en cada
 *    pulsación, como un teclado real.
 *  · Nunca son la única respuesta: lo que suena también se ve.
 *
 * Solo se usa en el navegador (componentes de cliente).
 */

export type Sonido =
  | "tecla"
  | "soltar"
  | "girar"
  | "acierto"
  | "fallo"
  | "avance"
  | "logro"
  | "racha"
  | "guardado"
  | "error"
  | "interruptor"
  | "encender"
  | "apagar"
  | "abrir"
  | "cerrar";

const CLAVE = "sonido";
const EVENTO = "sonido-cambia";
const VOLUMEN = 0.16;

let contexto: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!contexto) {
    const Ctor = window.AudioContext;
    if (!Ctor) return null;
    contexto = new Ctor();
  }
  if (contexto.state === "suspended") void contexto.resume();
  return contexto;
}

/** ¿Está el sonido encendido? Por defecto, sí. */
export function sonidoActivo(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(CLAVE) !== "off";
  } catch {
    return true;
  }
}

/** Enciende o apaga el sonido de toda la web y avisa a quien escuche. */
export function fijarSonido(activo: boolean) {
  try {
    window.localStorage.setItem(CLAVE, activo ? "on" : "off");
  } catch {
    // Sin almacenamiento (modo privado estricto): vale solo para esta página.
  }
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: activo }));
}

/** Para enterarse de los cambios (el interruptor de la barra). Devuelve cómo dejar de escuchar. */
export function alCambiarSonido(fn: (activo: boolean) => void): () => void {
  const oyente = (e: Event) => fn((e as CustomEvent<boolean>).detail);
  window.addEventListener(EVENTO, oyente);
  return () => window.removeEventListener(EVENTO, oyente);
}

/** Un poco de variación para que dos pulsaciones no suenen idénticas. */
function variar(base: number, margen = 0.06): number {
  return base * (1 + (Math.random() * 2 - 1) * margen);
}

/**
 * El clic de una tecla mecánica al BAJAR: un golpe grave muy corto, el cuerpo
 * sordo de la tecla tocando fondo (lo que hace que suene «llena» y no a
 * plástico) y un chasquido encima. La otra mitad, al soltarla, es `soltar`.
 */
function tecla(ctx: AudioContext) {
  const t = ctx.currentTime;

  // El fondo: una onda grave que cae, casi más sentida que oída.
  const fondo = ctx.createOscillator();
  const gFondo = ctx.createGain();
  fondo.type = "sine";
  fondo.frequency.setValueAtTime(variar(150), t);
  fondo.frequency.exponentialRampToValueAtTime(55, t + 0.09);
  gFondo.gain.setValueAtTime(VOLUMEN * 0.9, t);
  gFondo.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
  fondo.connect(gFondo).connect(ctx.destination);
  fondo.start(t);
  fondo.stop(t + 0.12);

  const golpe = ctx.createOscillator();
  const gGolpe = ctx.createGain();
  golpe.type = "triangle";
  golpe.frequency.setValueAtTime(variar(280), t);
  golpe.frequency.exponentialRampToValueAtTime(70, t + 0.06);
  gGolpe.gain.setValueAtTime(VOLUMEN, t);
  gGolpe.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  golpe.connect(gGolpe).connect(ctx.destination);
  golpe.start(t);
  golpe.stop(t + 0.08);

  // El chasquido: ruido filtrado de 15 ms.
  const largo = Math.floor(ctx.sampleRate * 0.015);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / largo);
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "highpass";
  filtro.frequency.value = variar(2600, 0.1);
  const gRuido = ctx.createGain();
  gRuido.gain.value = VOLUMEN * 0.55;
  ruido.connect(filtro).connect(gRuido).connect(ctx.destination);
  ruido.start(t);
}

/**
 * La tecla al SUBIR: el chasquido del muelle, más agudo y más flojo que el de
 * bajar. Un teclado de verdad suena dos veces por pulsación, y es la segunda
 * la que remata la sensación.
 */
function soltar(ctx: AudioContext) {
  const t = ctx.currentTime;

  const largo = Math.floor(ctx.sampleRate * 0.012);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = (Math.random() * 2 - 1) * (1 - i / largo);
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "highpass";
  filtro.frequency.value = variar(3600, 0.1);
  const gRuido = ctx.createGain();
  gRuido.gain.value = VOLUMEN * 0.32;
  ruido.connect(filtro).connect(gRuido).connect(ctx.destination);
  ruido.start(t);

  const toque = ctx.createOscillator();
  const gToque = ctx.createGain();
  toque.type = "triangle";
  toque.frequency.setValueAtTime(variar(520), t);
  toque.frequency.exponentialRampToValueAtTime(260, t + 0.03);
  gToque.gain.setValueAtTime(VOLUMEN * 0.3, t);
  gToque.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  toque.connect(gToque).connect(ctx.destination);
  toque.start(t);
  toque.stop(t + 0.05);
}

/** Girar una tarjeta: un roce de papel que sube y, al caer en la mesa, un toque sordo. */
function girar(ctx: AudioContext) {
  const t = ctx.currentTime;
  const dur = 0.16;
  const largo = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 1.2;
  filtro.frequency.setValueAtTime(variar(900), t);
  filtro.frequency.exponentialRampToValueAtTime(variar(3200), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.7, t + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  ruido.connect(filtro).connect(g).connect(ctx.destination);
  ruido.start(t);

  // La tarjeta asienta (giro.css: la animación toca la mesa hacia los 0,5 s).
  const cae = t + 0.5;
  const golpe = ctx.createOscillator();
  const gGolpe = ctx.createGain();
  golpe.type = "sine";
  golpe.frequency.setValueAtTime(variar(170), cae);
  golpe.frequency.exponentialRampToValueAtTime(70, cae + 0.07);
  gGolpe.gain.setValueAtTime(0.0001, t);
  gGolpe.gain.setValueAtTime(VOLUMEN * 0.6, cae);
  gGolpe.gain.exponentialRampToValueAtTime(0.0001, cae + 0.09);
  golpe.connect(gGolpe).connect(ctx.destination);
  golpe.start(cae);
  golpe.stop(cae + 0.1);
}

/**
 * Una nota suave: sube rápido y se apaga sola. La base de los sonidos con
 * tono (acierto, logro, avance…). `cuando` es el retraso en segundos.
 */
function nota(
  ctx: AudioContext,
  frecuencia: number,
  cuando: number,
  duracion: number,
  { tipo = "triangle", volumen = VOLUMEN }: { tipo?: OscillatorType; volumen?: number } = {},
) {
  const t = ctx.currentTime + cuando;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volumen, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duracion + 0.02);
}

/** Acertar: dos notas que suben (do–sol), alegre y corto. */
function acierto(ctx: AudioContext) {
  nota(ctx, 523.25, 0, 0.16);
  nota(ctx, 783.99, 0.09, 0.24);
}

/** Fallar: una nota grave y suave que baja. Nunca un pitido de castigo. */
function fallo(ctx: AudioContext) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(150, t + 0.22);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.9, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

/** Avanzar (lección hecha, paso del camino): tres notas en escalera. */
function avance(ctx: AudioContext) {
  [523.25, 659.25, 783.99].forEach((f, i) => nota(ctx, f, i * 0.07, 0.18, { volumen: VOLUMEN * 0.85 }));
}

/** Logro (examen aprobado, guía terminada): una fanfarria corta, junto al confeti. */
function logro(ctx: AudioContext) {
  [523.25, 659.25, 783.99].forEach((f, i) => nota(ctx, f, i * 0.09, 0.2));
  nota(ctx, 1046.5, 0.3, 0.55, { volumen: VOLUMEN * 1.1 });
  nota(ctx, 783.99, 0.3, 0.55, { tipo: "sine", volumen: VOLUMEN * 0.6 });
}

/** Racha: una chispa breve y aguda. */
function racha(ctx: AudioContext) {
  nota(ctx, variar(1318.5, 0.02), 0, 0.12, { tipo: "sine" });
  nota(ctx, variar(1975.5, 0.02), 0.06, 0.16, { tipo: "sine", volumen: VOLUMEN * 0.7 });
}

/** Guardado: un «clac» satisfactorio, la tecla con una nota encima. */
function guardado(ctx: AudioContext) {
  tecla(ctx);
  nota(ctx, 880, 0.04, 0.14, { tipo: "sine", volumen: VOLUMEN * 0.6 });
}

/** Error al guardar o validar: un golpe sordo y corto. */
function error(ctx: AudioContext) {
  nota(ctx, 160, 0, 0.12, { tipo: "square", volumen: VOLUMEN * 0.35 });
  nota(ctx, 130, 0.1, 0.14, { tipo: "square", volumen: VOLUMEN * 0.3 });
}

/** Interruptor: un clic doble. */
function interruptor(ctx: AudioContext) {
  tecla(ctx);
  window.setTimeout(() => tecla(ctx), 55);
}

/**
 * Encender el sonido de la web: un «clic» y dos notas que suben (sol–re),
 * claras y cortas, como algo que se despierta. Es lo primero que se oye tras
 * activarlo, así que confirma que ya suena.
 */
function encender(ctx: AudioContext) {
  tecla(ctx);
  nota(ctx, 783.99, 0.03, 0.12, { tipo: "sine", volumen: VOLUMEN * 0.9 });
  nota(ctx, 1174.66, 0.1, 0.2, { tipo: "sine", volumen: VOLUMEN * 0.8 });
}

/**
 * Apagarlo: el mismo «clic» y una sola nota que baja y se apaga, como una
 * radio que se queda en silencio. Suena ANTES de silenciar (InterruptorSonido).
 */
function apagar(ctx: AudioContext) {
  tecla(ctx);
  const t = ctx.currentTime + 0.03;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(660, t);
  osc.frequency.exponentialRampToValueAtTime(260, t + 0.22);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.8, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(g).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.28);
}

/** Abrir (menú, ventana, panel): un soplido que sube, muy sutil. */
function abrir(ctx: AudioContext) {
  barrido(ctx, 500, 1800, 0.12, 0.5);
}

/** Cerrar: el mismo soplido, bajando. */
function cerrar(ctx: AudioContext) {
  barrido(ctx, 1800, 500, 0.11, 0.45);
}

/** Ruido filtrado que barre de una frecuencia a otra (abrir y cerrar). */
function barrido(ctx: AudioContext, desde: number, hasta: number, dur: number, fuerza: number) {
  const t = ctx.currentTime;
  const largo = Math.floor(ctx.sampleRate * dur);
  const buffer = ctx.createBuffer(1, largo, ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < largo; i++) datos[i] = Math.random() * 2 - 1;
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 2;
  filtro.frequency.setValueAtTime(desde, t);
  filtro.frequency.exponentialRampToValueAtTime(hasta, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * fuerza, t + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  ruido.connect(filtro).connect(g).connect(ctx.destination);
  ruido.start(t);
}

const CATALOGO: Record<Sonido, (ctx: AudioContext) => void> = {
  tecla,
  soltar,
  girar,
  acierto,
  fallo,
  avance,
  logro,
  racha,
  guardado,
  error,
  interruptor,
  encender,
  apagar,
  abrir,
  cerrar,
};

/** Hace sonar un sonido del catálogo, si el sonido está encendido. */
export function sonar(nombre: Sonido) {
  if (!sonidoActivo()) return;
  const ctx = audio();
  if (!ctx) return;
  try {
    CATALOGO[nombre](ctx);
  } catch {
    // Un sonido que falla nunca rompe lo que la persona estaba haciendo.
  }
}
