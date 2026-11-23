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
 * 🔴 NADA SUENA DOS VECES (18-11-2026, pedido por el admin). Un gesto, un
 * sonido con sentido. Lo garantiza `sonar`, no cada componente:
 *  · Una pulsación es `tecla` al bajar y UNA cosa al subir: `soltar` si el
 *    botón no hace nada que suene, o el sonido de lo que hace (`abrir`,
 *    `guardado`, `elegir`…), nunca los dos.
 *  · Los sonidos que llevan su propio clic (`guardado`, `encender`, `apagar`)
 *    lo callan si la tecla acaba de sonar.
 *  · El mismo sonido no se repite hasta que pasa su reposo (`REPOSO`): dos
 *    piezas que celebran lo mismo dan una sola fanfarria.
 *  · Si en el mismo instante piden sonar dos cosas, suena la que más importa.
 *
 * Solo se usa en el navegador (componentes de cliente).
 */

export type Sonido =
  | "tecla"
  | "soltar"
  | "girar"
  | "elegir"
  | "pestana"
  | "acierto"
  | "fallo"
  | "avance"
  | "logro"
  | "racha"
  | "guardado"
  | "borrar"
  | "error"
  | "interruptor"
  | "encender"
  | "apagar"
  | "abrir"
  | "cerrar"
  | "escribir";

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

// ─────────────────────────── Las piezas de un clic ───────────────────────────

/** Cuándo sonó por última vez el clic de bajar una tecla (`performance.now()`). */
let ultimaTecla = -1e9;
/** Con la tecla recién pulsada, lo que suene después no repite su clic. */
const teclaReciente = () => performance.now() - ultimaTecla < 450;

/**
 * Por donde salen los clics: un filtro que les quita el siseo agudo, que es lo
 * que hace que un clic sintetizado suene a plástico barato. Lo demás (el giro
 * de las tarjetas, las notas) sale directo, como siempre.
 */
let suave: { ctx: AudioContext; nodo: AudioNode } | null = null;
function salida(ctx: AudioContext): AudioNode {
  if (suave?.ctx === ctx) return suave.nodo;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "lowpass";
  filtro.frequency.value = 7200;
  filtro.Q.value = 0.4;
  filtro.connect(ctx.destination);
  suave = { ctx, nodo: filtro };
  return filtro;
}

/** Medio segundo de ruido blanco, creado una vez: cada chasquido toma un trozo distinto. */
let ruidoBlanco: { ctx: AudioContext; buffer: AudioBuffer } | null = null;
function ruido(ctx: AudioContext): AudioBuffer {
  if (ruidoBlanco?.ctx === ctx) return ruidoBlanco.buffer;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
  const datos = buffer.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  ruidoBlanco = { ctx, buffer };
  return buffer;
}

/**
 * Un «modo»: una nota casi fija que se apaga sola, como la madera o el
 * plástico al recibir un golpe. Con dos o tres a la vez sale el «toc» de una
 * tecla. La clave es que el tono apenas cae: si barre mucho, suena a muelle de
 * dibujos animados y no a teclado.
 */
function modo(ctx: AudioContext, t: number, frecuencia: number, apagado: number, volumen: number, tipo: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, t);
  osc.frequency.exponentialRampToValueAtTime(frecuencia * 0.86, t + apagado);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(volumen, t + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + apagado);
  osc.connect(g).connect(salida(ctx));
  osc.start(t);
  osc.stop(t + apagado + 0.01);
}

/** El roce del golpe: unos milisegundos de ruido alrededor de una frecuencia. */
function chasquido(ctx: AudioContext, t: number, frecuencia: number, dur: number, volumen: number) {
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruido(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = frecuencia;
  filtro.Q.value = 1.1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(volumen, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  fuente.connect(filtro).connect(g).connect(salida(ctx));
  fuente.start(t, Math.random() * 0.4, dur + 0.01);
}

/**
 * La tecla al BAJAR (rehecha el 18-11-2026: «el toc de los vídeos de ASMR»).
 * Es el sonido de un teclado mecánico lubricado: grave, redondo y seco. Cuatro
 * modos casi fijos (el golpe de fondo, que se siente más que se oye, el
 * cuerpo, la caja y la tapa de la tecla) y un roce muy corto, ya sin siseo.
 * `tono` lo afina: las teclas grandes suenan más graves, como una barra
 * espaciadora, y las pequeñas más agudas.
 */
function tecla(ctx: AudioContext, tono = 1) {
  const t = ctx.currentTime;
  const k = tono * variar(1, 0.045);
  modo(ctx, t, 92 * k, 0.07, VOLUMEN * 0.8);
  modo(ctx, t, 188 * k, 0.085, VOLUMEN * 1.05);
  modo(ctx, t, 356 * k, 0.05, VOLUMEN * 0.42);
  modo(ctx, t, 742 * k, 0.022, VOLUMEN * 0.13, "triangle");
  chasquido(ctx, t, variar(1900, 0.12) * k, 0.007, VOLUMEN * 0.5);
}

/**
 * La tecla al SUBIR: el mismo «toc», más agudo, más corto y bastante más
 * flojo. Es el remate de la pulsación cuando el botón no hace nada que suene.
 */
function soltar(ctx: AudioContext, tono = 1) {
  const t = ctx.currentTime;
  const k = tono * variar(1, 0.05);
  modo(ctx, t, 310 * k, 0.04, VOLUMEN * 0.34);
  modo(ctx, t, 585 * k, 0.026, VOLUMEN * 0.17);
  chasquido(ctx, t, variar(2700, 0.12) * k, 0.005, VOLUMEN * 0.24);
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
 * Elegir una opción (un ánimo, largo o corto, cómo acabó): un «pop» de burbuja,
 * corto y hacia arriba. Más ligero que una tecla: no es una acción, es marcar.
 */
function elegir(ctx: AudioContext, tono = 1) {
  const t = ctx.currentTime;
  const f = variar(540, 0.04) * tono;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(f, t);
  osc.frequency.exponentialRampToValueAtTime(f * 1.75, t + 0.05);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.6, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);
  osc.connect(g).connect(salida(ctx));
  osc.start(t);
  osc.stop(t + 0.09);
}

/** Pasar de pestaña, de mes o de paso: una hoja que se pasa, un roce rápido que sube. */
function pestana(ctx: AudioContext) {
  const t = ctx.currentTime;
  const dur = 0.075;
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruido(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 0.9;
  filtro.frequency.setValueAtTime(variar(1100), t);
  filtro.frequency.exponentialRampToValueAtTime(variar(3600), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.5, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  fuente.connect(filtro).connect(g).connect(salida(ctx));
  fuente.start(t, Math.random() * 0.4, dur + 0.01);
  modo(ctx, t + 0.055, variar(240), 0.035, VOLUMEN * 0.3);
}

/**
 * Borrar (una operación, una captura, el diario entero): el papel que se
 * arruga hacia abajo y cae a la papelera con un golpe sordo. Ni alegre ni de
 * castigo: algo que se va.
 */
function borrar(ctx: AudioContext) {
  const t = ctx.currentTime;
  const dur = 0.15;
  const fuente = ctx.createBufferSource();
  fuente.buffer = ruido(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 1.4;
  filtro.frequency.setValueAtTime(variar(2600), t);
  filtro.frequency.exponentialRampToValueAtTime(variar(520), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.55, t + 0.015);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.2, t + 0.05);
  g.gain.exponentialRampToValueAtTime(VOLUMEN * 0.45, t + 0.075);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  fuente.connect(filtro).connect(g).connect(salida(ctx));
  fuente.start(t, Math.random() * 0.3, dur + 0.01);
  modo(ctx, t + 0.13, variar(120), 0.09, VOLUMEN * 0.75);
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
function logro(ctx: AudioContext, tono = 1) {
  // Rehecho el 23-11-2026 (pedido por el admin: «mejora muchísimo el sonido»).
  // Va al compás de la animación del aviso (badge-notifier.css):
  //  1) 0,00 s · un soplo que sube mientras la pegatina cae;
  //  2) 0,42 s · el «¡toc!» grave de la pegatina al estamparse;
  //  3) 0,50 s · el arpegio do–mi–sol–do que sube;
  //  4) 0,86 s · el acorde final, cálido, con un brillo de campanitas encima.
  // Con `tono` > 1 (un logro especial) el acorde dura más y suena una octava
  // de campanitas más.
  const especial = tono > 1;
  const t = ctx.currentTime;

  // 1) El soplo: ruido filtrado cuyo filtro sube, flojo.
  const soplo = ctx.createBufferSource();
  soplo.buffer = ruido(ctx);
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.Q.value = 0.9;
  filtro.frequency.setValueAtTime(500, t);
  filtro.frequency.exponentialRampToValueAtTime(4200, t + 0.38);
  const gs = ctx.createGain();
  gs.gain.setValueAtTime(0.0001, t);
  gs.gain.exponentialRampToValueAtTime(VOLUMEN * 0.5, t + 0.26);
  gs.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  soplo.connect(filtro).connect(gs).connect(salida(ctx));
  soplo.start(t, 0, 0.45);

  // 2) El toc de la pegatina: un golpe grave y redondo con su chasquido de papel.
  modo(ctx, t + 0.42, 95, 0.22, VOLUMEN * 1.6);
  modo(ctx, t + 0.42, 190, 0.12, VOLUMEN * 0.7);
  chasquido(ctx, t + 0.42, 1800, 0.05, VOLUMEN * 0.5);

  // 3) El arpegio que sube.
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(ctx, f, 0.5 + i * 0.075, 0.22, { volumen: VOLUMEN * 0.9 }));

  // 4) El acorde final y su brillo.
  const largo = especial ? 1.5 : 1.05;
  [523.25, 659.25, 783.99].forEach((f) => nota(ctx, f, 0.86, largo, { tipo: "sine", volumen: VOLUMEN * 0.55 }));
  nota(ctx, 1046.5, 0.86, largo, { volumen: VOLUMEN * 0.8 });
  const brillo = especial ? [2093, 2637, 3136, 4186, 3136, 4186] : [2093, 2637, 3136, 4186];
  brillo.forEach((f, i) => nota(ctx, f, 0.92 + i * 0.07, 0.3, { tipo: "sine", volumen: VOLUMEN * 0.28 }));
}

/** Racha: una chispa breve y aguda. */
function racha(ctx: AudioContext) {
  nota(ctx, variar(1318.5, 0.02), 0, 0.12, { tipo: "sine" });
  nota(ctx, variar(1975.5, 0.02), 0.06, 0.16, { tipo: "sine", volumen: VOLUMEN * 0.7 });
}

/**
 * Guardado: un «clac» satisfactorio, el toc de la tecla con dos notas claras
 * encima. Si la tecla acaba de sonar (lo normal: se guarda pulsando un botón),
 * el toc no se repite y quedan solo las notas.
 */
function guardado(ctx: AudioContext) {
  const conClic = !teclaReciente();
  if (conClic) tecla(ctx);
  const d = conClic ? 0.04 : 0;
  nota(ctx, 880, d, 0.14, { tipo: "sine", volumen: VOLUMEN * 0.6 });
  nota(ctx, 1318.5, d + 0.06, 0.16, { tipo: "sine", volumen: VOLUMEN * 0.32 });
}

/** Error al guardar o validar: un golpe sordo y corto. */
function error(ctx: AudioContext) {
  nota(ctx, 160, 0, 0.12, { tipo: "square", volumen: VOLUMEN * 0.35 });
  nota(ctx, 130, 0.1, 0.14, { tipo: "square", volumen: VOLUMEN * 0.3 });
}

/**
 * Interruptor (un me gusta, una casilla, un modo): un «tic-tac» de dos toques
 * ligeros, el segundo más agudo. Antes eran dos clics de tecla enteros, que
 * sumados al de la propia tecla sonaban a tres golpes.
 */
function interruptor(ctx: AudioContext) {
  const t = ctx.currentTime;
  const k = variar(1, 0.04);
  modo(ctx, t, 420 * k, 0.035, VOLUMEN * 0.4);
  chasquido(ctx, t, 2400 * k, 0.005, VOLUMEN * 0.22);
  modo(ctx, t + 0.06, 630 * k, 0.04, VOLUMEN * 0.45);
  chasquido(ctx, t + 0.06, 3000 * k, 0.005, VOLUMEN * 0.2);
}

/**
 * Encender el sonido de la web: un «clic» y dos notas que suben (sol–re),
 * claras y cortas, como algo que se despierta. Es lo primero que se oye tras
 * activarlo, así que confirma que ya suena.
 */
function encender(ctx: AudioContext) {
  if (!teclaReciente()) tecla(ctx);
  nota(ctx, 783.99, 0.03, 0.12, { tipo: "sine", volumen: VOLUMEN * 0.9 });
  nota(ctx, 1174.66, 0.1, 0.2, { tipo: "sine", volumen: VOLUMEN * 0.8 });
}

/**
 * Apagarlo: el mismo «clic» y una sola nota que baja y se apaga, como una
 * radio que se queda en silencio. Suena ANTES de silenciar (InterruptorSonido).
 */
function apagar(ctx: AudioContext) {
  if (!teclaReciente()) tecla(ctx);
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

/**
 * Escribir (23-11-2026, pedido por el admin: «un sonido al escribir, muy
 * ASMR, muy placentero»). Una tecla de teclado mecánico con las piezas
 * lubricadas, oída de cerca y bajito: un «toc» grave y redondo, sin clic
 * agudo. Es la mitad de fuerte que la tecla de un botón, porque suena con
 * cada letra y no puede cansar. Cada pulsación varía un poco de tono, como
 * las teclas de verdad; el espacio y el intro, más graves (`tono`).
 */
function escribir(ctx: AudioContext, tono = 1) {
  const t = ctx.currentTime;
  const k = tono * variar(1, 0.085);
  modo(ctx, t, 118 * k, 0.06, VOLUMEN * 0.36);
  modo(ctx, t, 236 * k, 0.07, VOLUMEN * 0.5);
  modo(ctx, t, 468 * k, 0.034, VOLUMEN * 0.17);
  chasquido(ctx, t, variar(1350, 0.16) * k, 0.006, VOLUMEN * 0.17);
}

const CATALOGO: Record<Sonido, (ctx: AudioContext, tono?: number) => void> = {
  tecla,
  soltar,
  girar,
  elegir,
  pestana,
  acierto,
  fallo,
  avance,
  logro,
  racha,
  guardado,
  borrar,
  error,
  interruptor,
  encender,
  apagar,
  abrir,
  cerrar,
  escribir,
};

// ─────────────────────────── Quién suena y quién calla ───────────────────────────

/**
 * Cuánto tiene que pasar, en milisegundos, para que el MISMO sonido vuelva a
 * sonar. Lo corto evita el eco de dos llamadas seguidas; lo largo, que dos
 * piezas celebren lo mismo (el quiz y el aviso del logro, por ejemplo).
 */
const REPOSO: Partial<Record<Sonido, number>> = { logro: 2500, racha: 900, avance: 350, acierto: 250, fallo: 250, girar: 0, tecla: 30, escribir: 26 };
const REPOSO_NORMAL = 90;

/** Si dos sonidos piden sonar a la vez, gana el que más cuenta. */
const PESO: Partial<Record<Sonido, number>> = {
  logro: 6, racha: 5, acierto: 4, fallo: 4, error: 4, avance: 3, guardado: 3, borrar: 3, interruptor: 2, girar: 2,
};
const PESO_NORMAL = 1;

/** Lo que tarda en decidirse quién suena: imperceptible, y da tiempo a que lleguen los dos. */
const ESPERA = 22;
/** El `soltar` espera algo más: a veces lo que hace el botón suena un par de fotogramas después. */
const ESPERA_SOLTAR = 50;
/** Tras un sonido con sentido, el `soltar` de esa pulsación ya no suena. */
const CALLA_SOLTAR = 260;

const ultimaVez = new Map<Sonido, number>();
/** Cuándo se pidió sonar algo por última vez, lo que fuera (`performance.now()`). */
let ultimaPeticion = -1e9;

/**
 * ¿Acaba de sonar (o de pedirse) algo? Lo usa `SonidosGlobales` para no
 * repetir: si la pieza pulsada ya ha hecho su sonido, el genérico calla.
 */
export function acabaDeSonar(ms = 70): boolean {
  return performance.now() - ultimaPeticion < ms;
}
let ultimoConSentido = -1e9;
let soltarEnEspera = 0;
let enEspera: { nombre: Sonido; tono: number; reloj: number } | null = null;

function tocar(nombre: Sonido, tono: number) {
  const ctx = audio();
  if (!ctx) return;
  ultimaVez.set(nombre, performance.now());
  try {
    CATALOGO[nombre](ctx, tono);
  } catch {
    // Un sonido que falla nunca rompe lo que la persona estaba haciendo.
  }
}

/**
 * Hace sonar un sonido del catálogo, si el sonido está encendido. `tono`
 * afina los clics (más de 1, más agudo): lo usan las teclas según su tamaño.
 */
export function sonar(nombre: Sonido, tono = 1) {
  if (typeof window === "undefined" || !sonidoActivo()) return;
  // El contexto se crea o se despierta AQUÍ, dentro del gesto de la persona.
  if (!audio()) return;
  const ahora = performance.now();
  if (ahora - (ultimaVez.get(nombre) ?? -1e9) < (REPOSO[nombre] ?? REPOSO_NORMAL)) return;

  // Escribir: una letra, un «toc», al instante. No es un botón: ni cuenta
  // como tecla pulsada ni calla ni espera a nadie.
  if (nombre === "escribir") {
    tocar(nombre, tono);
    return;
  }
  ultimaPeticion = ahora;

  // El clic de bajar: al instante, sin esperas. Es lo que se nota bajo el dedo.
  if (nombre === "tecla") {
    ultimaTecla = ahora;
    tocar(nombre, tono);
    return;
  }

  // El de subir espera un instante: si el botón hace algo que suena, calla.
  if (nombre === "soltar") {
    if (ahora - ultimoConSentido < CALLA_SOLTAR || enEspera) return;
    window.clearTimeout(soltarEnEspera);
    soltarEnEspera = window.setTimeout(() => tocar("soltar", tono), ESPERA_SOLTAR);
    return;
  }

  // El giro de una tarjeta va con su animación: suena al instante, como siempre.
  if (nombre === "girar") {
    window.clearTimeout(soltarEnEspera);
    ultimoConSentido = ahora;
    tocar(nombre, tono);
    return;
  }

  // Un sonido con sentido: calla el `soltar` pendiente y, si llega otro a la vez, gana el de más peso.
  window.clearTimeout(soltarEnEspera);
  ultimoConSentido = ahora;
  if (enEspera) {
    if ((PESO[nombre] ?? PESO_NORMAL) <= (PESO[enEspera.nombre] ?? PESO_NORMAL)) return;
    window.clearTimeout(enEspera.reloj);
  }
  const reloj = window.setTimeout(() => {
    enEspera = null;
    ultimoConSentido = performance.now();
    tocar(nombre, tono);
  }, ESPERA);
  enEspera = { nombre, tono, reloj };
}
