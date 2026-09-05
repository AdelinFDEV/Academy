/**
 * Todas las pantallas del bot de Telegram, en un solo sitio.
 *
 * El webhook (src/app/api/telegram/webhook/route.ts) se limita a enrutar: lee
 * quién escribe, pide aquí la pantalla que toca y la pinta. Los textos, los
 * botones y las reglas de "qué ve cada plan" viven aquí.
 *
 * ── Regla de seguridad, la única que no se puede relajar ───────────────────
 * Este módulo NO da acceso a nada: solo escribe texto y enlaces. El único
 * enlace sensible es el de invitación al canal privado, y sale por una sola
 * puerta — `botonCanal()` — que devuelve null a quien no sea premium/admin.
 * Aun así, tener el enlace no basta para entrar: el canal exige aprobación y
 * quien aprueba es handleJoinRequest, que vuelve a comprobar el rol en la base
 * de datos. Son dos cierres independientes, y este es el menos importante.
 *
 * Igual con la web: los enlaces a secciones Premium apuntan a /premium cuando
 * quien mira no lo es, porque cada una de esas páginas ya redirige por su
 * cuenta en el servidor. El bot no puede abrir nada que la web no abra.
 */

import { PREMIUM_PRICE_EUR, precioEur } from "@/lib/stripe";
import {
  getAdminChatUrl,
  getChannelInviteLink,
  getCuentaUrl,
  getFreeChannelUrl,
  getPremiumUrl,
  getSiteUrl,
  type Boton,
} from "@/lib/telegram";

/** Perfil con lo que necesitan el menú y la ficha de estado. */
export type PerfilBot = {
  role: string | null;
  full_name: string | null;
  telegram_username: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean | null;
  premium_since: string | null;
};

export const CAMPOS_PERFIL_BOT =
  "role, full_name, telegram_username, subscription_status, " +
  "subscription_current_period_end, subscription_cancel_at_period_end, premium_since";

/** Una pantalla del menú: el texto y su botonera. */
export type Pantalla = { texto: string; botones: Boton[][] };

/**
 * Única definición de "tiene Premium" en todo el bot.
 *
 * Admin cuenta como premium a efectos de lo que ve, pero NO a efectos de lo
 * que paga: la ficha de estado lo distingue.
 */
export function tienePremium(perfil: { role: string | null } | null | undefined): boolean {
  return perfil?.role === "premium" || perfil?.role === "admin";
}

// ── Utilidades de formato ───────────────────────────────────────────────────

/** El precio sale de la constante comun, nunca escrito a mano. */
function precioMes(): string {
  return precioEur(PREMIUM_PRICE_EUR);
}

/** Lo que cuesta al día, para que el precio se compare con un café y no con
 *  una factura. Ojo al cambiar PREMIUM_PRICE_EUR: hay textos que comparan esta
 *  cifra con algo, y a 49,99€ es un café al día, no uno a la semana. */
function precioDia(): string {
  return `${(PREMIUM_PRICE_EUR / 30).toFixed(2).replace(".", ",")}€`;
}

function url(ruta: string): string {
  return `${getSiteUrl()}${ruta}`;
}

export function formatearFecha(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function diasHasta(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

// ── Botones reutilizados ────────────────────────────────────────────────────

const VOLVER_INICIO: Boton = { text: "🏠 Menú principal", data: "m:inicio" };
const VOLVER_VENTAJAS: Boton = { text: "⬅️ Volver a las ventajas", data: "m:premium" };
const VOLVER_FAQ: Boton = { text: "⬅️ Volver a las dudas", data: "m:faq" };
const HABLAR: Boton = { text: "💬 Hablar con Adelin", url: getAdminChatUrl() };

function botonSuscribirse(): Boton {
  return { text: `💎 Hazte Premium · ${precioMes()}/mes`, url: getPremiumUrl() };
}

/**
 * ÚNICA puerta por la que sale el enlace del canal privado.
 *
 * A quien no sea premium/admin le devuelve null, y `construirTeclado` descarta
 * los botones de enlace sin URL, así que el botón simplemente no aparece. No
 * hay ninguna otra referencia a getChannelInviteLink() en este módulo: si algún
 * día hace falta otra, tiene que pasar por aquí.
 */
function botonCanal(perfil: PerfilBot | null, texto = "🚀 Entrar al canal privado"): Boton {
  return { text: texto, url: tienePremium(perfil) ? getChannelInviteLink() : null };
}

/**
 * Enlace a una sección Premium de la web.
 *
 * A quien no es Premium se le manda a /premium en vez de a la sección: la
 * página redirigiría igualmente (lo hace en el servidor), pero unas veces a
 * /premium y otras al dashboard, y aterrizar en un sitio que no pediste es
 * peor experiencia que un enlace honesto.
 */
function enlacePremium(perfil: PerfilBot | null, ruta: string, texto: string): Boton {
  return { text: texto, url: tienePremium(perfil) ? url(ruta) : getPremiumUrl() };
}

// ── Menú principal ──────────────────────────────────────────────────────────

/** Botonera del inicio. Cambia según el plan para que nadie vea botones que no
 *  le sirven: al Premium no se le ofrece pagar, al free no se le ofrece el
 *  canal al que todavía no puede entrar. */
export function menuPara(perfil: PerfilBot | null): Boton[][] {
  if (!perfil) {
    return [
      [{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }],
      [
        { text: "💎 Qué incluye Premium", data: "m:premium" },
        { text: "💳 Precio y pago", data: "m:precio" },
      ],
      [{ text: "🎁 Lo que ya tienes gratis", data: "m:gratis" }],
      [
        { text: "🧭 La Academy por dentro", data: "m:web" },
        { text: "❓ Dudas frecuentes", data: "m:faq" },
      ],
      [HABLAR, { text: "🆘 Ayuda", data: "m:ayuda" }],
    ];
  }

  if (!tienePremium(perfil)) {
    return [
      [{ text: "💎 Qué incluye Premium", data: "m:premium" }],
      [
        { text: "💳 Precio y pago", data: "m:precio" },
        { text: "📊 Mi estado", data: "m:estado" },
      ],
      [{ text: "🎁 Lo que ya tienes gratis", data: "m:gratis" }],
      [
        { text: "🧭 La Academy por dentro", data: "m:web" },
        { text: "❓ Dudas frecuentes", data: "m:faq" },
      ],
      [botonSuscribirse()],
      [HABLAR, { text: "🆘 Ayuda", data: "m:ayuda" }],
    ];
  }

  return [
    [botonCanal(perfil)],
    [
      { text: "📊 Mi Premium", data: "m:estado" },
      { text: "⚙️ Mi suscripción", url: getCuentaUrl() },
    ],
    [{ text: "💎 Todo lo que tienes", data: "m:premium" }],
    [
      { text: "🧭 La Academy por dentro", data: "m:web" },
      { text: "❓ Dudas frecuentes", data: "m:faq" },
    ],
    [HABLAR, { text: "🆘 Ayuda", data: "m:ayuda" }],
  ];
}

/** Texto de bienvenida del inicio. */
export function textoInicio(perfil: PerfilBot | null, nombre?: string | null): string {
  const saludo = `¡Hola${nombre ? `, ${nombre}` : ""}! 👋`;

  if (!perfil) {
    return (
      `${saludo}\n\n` +
      "Bienvenido a AdelinBTC Academy 🚀\n\n" +
      "Aquí se aprende cripto sin humo:\n" +
      "📚 Guías interactivas\n" +
      "📈 Análisis y noticias que importan\n" +
      "🛠 Herramientas de trading de verdad\n\n" +
      "Vincula tu cuenta y me encargo de todo: te abro el canal privado en cuanto seas Premium 🔓\n\n" +
      "Echa un vistazo, sin prisa 👇"
    );
  }

  if (perfil.role === "admin") {
    return (
      `${saludo}\n\n` +
      "Eres administrador 👑\n\n" +
      "Acceso completo y permanente. Aquí tienes el mismo menú que ve todo el mundo 👇"
    );
  }

  if (!tienePremium(perfil)) {
    return (
      `${saludo}\n\n` +
      "Tu cuenta ya está vinculada ✅\n\n" +
      "Te falta el paso bueno: con Premium 💎 entras al canal privado (te abro yo la puerta, " +
      "automáticamente), desbloqueas todas las herramientas y puedes escribirme cuando quieras.\n\n" +
      "Mira sin compromiso qué incluye 👇"
    );
  }

  return (
    `${saludo}\n\n` +
    "Eres Premium 💎\n\n" +
    "Tienes el canal privado abierto, todas las herramientas desbloqueadas y a mí al otro lado.\n\n" +
    "Escríbeme por aquí lo que necesites — te leo yo, en persona 👇"
  );
}

// ── Ficha de estado ─────────────────────────────────────────────────────────

/** Se resuelve dentro de Telegram, sin mandar a nadie a la web solo para ver
 *  cuánto le queda. */
export function fichaEstado(perfil: PerfilBot | null): string {
  if (!perfil) {
    return (
      "🔍 Tu cuenta todavía no está vinculada\n\n" +
      "Por eso no puedo contarte nada de tu plan.\n\n" +
      "Vincúlala y aquí verás tu Premium, lo que te queda y el acceso al canal 👇"
    );
  }

  if (perfil.role === "admin") {
    return (
      "👑 Eres administrador\n\n" +
      "Acceso completo y permanente, sin suscripción de por medio."
    );
  }

  if (!tienePremium(perfil)) {
    return (
      "🆓 Estás en el plan gratuito\n\n" +
      "Tienes los artículos, las guías básicas, la watchlist, la calculadora de riesgo y los logros.\n\n" +
      `Con Premium 💎 (${precioMes()}/mes) se abren el canal privado, el diario de trading, ` +
      "el portfolio en tiempo real, las liberaciones de tokens y todas las guías.\n\n" +
      "Mira el detalle, una por una 👇"
    );
  }

  const fin = perfil.subscription_current_period_end;
  const cancelada = !!perfil.subscription_cancel_at_period_end;
  const lineas = ["💎 Tu Premium", ""];

  lineas.push(cancelada ? "⚠️ Cancelada — no se renovará" : "✅ Activa y al día");

  if (fin) {
    const dias = diasHasta(fin);
    lineas.push(`${cancelada ? "📅 Acceso hasta el" : "🔄 Se renueva el"} ${formatearFecha(fin)}`);
    lineas.push(`⏳ Te ${dias === 1 ? "queda 1 día" : `quedan ${dias} días`}`);
  }

  if (perfil.premium_since) {
    lineas.push(`🗓 Miembro desde el ${formatearFecha(perfil.premium_since)}`);
  }

  if (!cancelada) {
    lineas.push("", `💶 ${precioMes()}/mes · sin permanencia · cancelas cuando quieras`);
  } else {
    lineas.push(
      "",
      "Cuando termine el periodo saldrás del canal automáticamente.",
      "Aún estás a tiempo de reactivarla 👇"
    );
  }

  return lineas.join("\n");
}

function botonesEstado(perfil: PerfilBot | null): Boton[][] {
  if (!perfil) {
    return [
      [{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }],
      [{ text: "💎 Qué incluye Premium", data: "m:premium" }],
      [VOLVER_INICIO],
    ];
  }

  if (!tienePremium(perfil)) {
    return [
      [{ text: "💎 Ver las ventajas una a una", data: "m:premium" }],
      [botonSuscribirse()],
      [VOLVER_INICIO],
    ];
  }

  return [
    [botonCanal(perfil)],
    [{ text: "⚙️ Gestionar mi suscripción", url: getCuentaUrl() }],
    [{ text: "❌ Cómo cancelar", data: "m:cancelar" }],
    [VOLVER_INICIO],
  ];
}

// ── Ventajas Premium, una a una ─────────────────────────────────────────────

/**
 * Cada ventaja es una ficha corta: qué es, para qué sirve y dónde está.
 *
 * `ruta` es su sección de la web; `enlacePremium` decide si se enlaza directa
 * (Premium) o a /premium (todos los demás). Las que no tienen ruta propia
 * todavía —el canal y el trading en directo— la resuelven a mano.
 */
type Ventaja = {
  id: string;
  boton: string;
  titulo: string;
  texto: string;
  ruta?: string;
  textoEnlace?: string;
};

const VENTAJAS: Ventaja[] = [
  {
    id: "diario",
    boton: "📓 Diario de Trading",
    titulo: "📓 Diario de Trading",
    texto:
      "Apunta cada operación y deja de operar de memoria.\n\n" +
      "• Registro de entradas, salidas y resultado\n" +
      "• Estadísticas reales: aciertos, ratio, racha\n" +
      "• Retos y niveles, próximamente\n\n" +
      "Es la herramienta que más gente dice que le cambió la operativa: verlo escrito " +
      "enseña más que cualquier vídeo.",
    ruta: "/dashboard/trading",
    textoEnlace: "📓 Abrir mi diario",
  },
  {
    id: "portfolio",
    boton: "💼 Portfolio Adelin",
    titulo: "💼 Mi Portfolio Adelin, en tiempo real",
    texto:
      "Mi cartera de spot, actualizada al momento y a la vista.\n\n" +
      "• Qué llevo y en qué peso\n" +
      "• Precio medio de entrada y cómo va\n" +
      "• Cambios en cuanto los hago\n\n" +
      "No es una señal para copiar a ciegas: es ver, con números, cómo se construye " +
      "una cartera y se aguanta.",
    ruta: "/portfolio",
    textoEnlace: "💼 Ver el portfolio",
  },
  {
    id: "liberaciones",
    boton: "🔓 Liberaciones",
    titulo: "🔓 Liberaciones de tokens",
    texto:
      "El calendario de desbloqueos, en tiempo real.\n\n" +
      "• Qué proyectos liberan tokens y cuándo\n" +
      "• Cuánta oferta entra al mercado\n" +
      "• Aviso de lo que viene en los próximos días\n\n" +
      "Sirve para lo más aburrido y más rentable que hay: no comprar justo antes de " +
      "que caiga una avalancha de oferta.",
    ruta: "/herramientas/liberaciones",
    textoEnlace: "🔓 Ver liberaciones",
  },
  {
    id: "radar",
    boton: "📡 Radar Diario",
    titulo: "📡 Radar Diario",
    texto:
      "El repaso del mercado cada día, sin tener que rastrearlo tú.\n\n" +
      "• Lo que se mueve y por qué\n" +
      "• Niveles y datos que merecen atención hoy\n" +
      "• En un par de minutos de lectura\n\n" +
      "Para llegar al mercado sabiendo qué está pasando, no enterándote a media tarde.",
    ruta: "/herramientas/radar",
    textoEnlace: "📡 Abrir el radar",
  },
  {
    id: "guias",
    boton: "📚 Todas las guías",
    titulo: "📚 Todas las guías, desbloqueadas",
    texto:
      "En gratis tienes las guías básicas. Con Premium se abren todas.\n\n" +
      "• Guías interactivas, con quiz y logros\n" +
      "• De blockchain y ciclos de Bitcoin a fiscalidad en España\n" +
      "• Escritas para entenderse, no para presumir\n\n" +
      "Y se añaden nuevas: lo que entre después ya lo tienes incluido.",
    ruta: "/guias",
    textoEnlace: "📚 Ver las guías",
  },
  {
    id: "canal",
    boton: "🚀 Canal privado",
    titulo: "🚀 Canal privado de Telegram",
    texto:
      "El canal donde va lo que no publico fuera.\n\n" +
      "• Análisis y avisos en el momento\n" +
      "• Mis entradas en spot cuando las hago\n" +
      "• Comunidad pequeña, de gente que va en serio\n\n" +
      "La puerta la abro yo, automáticamente: en cuanto eres Premium y tienes la cuenta " +
      "vinculada, pides entrar y te acepto al instante.",
  },
  {
    id: "chat",
    boton: "💬 Hablar conmigo",
    titulo: "💬 Escribirme por Telegram",
    texto:
      "Siendo Premium, me escribes por aquí mismo y te leo yo, en persona.\n\n" +
      "• Escribes al bot, me llega a mí\n" +
      "• Te contesto por este mismo chat\n" +
      "• Sin formularios ni tickets\n\n" +
      "Dudas de una guía, una operación que no ves clara o algo de la web: lo que sea.",
  },
  {
    id: "soporte",
    boton: "⭐ Soporte prioritario",
    titulo: "⭐ Soporte prioritario",
    texto:
      "Los mensajes de Premium van los primeros de la cola.\n\n" +
      "• Se responden antes que el resto\n" +
      "• Cualquier problema de cuenta o de pago, directo a mí\n" +
      "• Sin repetir tu caso tres veces\n\n" +
      "Cuando algo se atasca, esto es lo que se agradece.",
  },
  {
    id: "directo",
    boton: "🔴 Trading en directo",
    titulo: "🔴 Trading en directo (próximamente)",
    texto:
      "Sesiones en directo operando el mercado, comentando cada decisión.\n\n" +
      "• Por qué entro y por qué no\n" +
      "• Dónde pongo el stop y cuánto arriesgo\n" +
      "• Preguntas en el momento\n\n" +
      "Todavía no está abierto. Cuando lo esté, va incluido en Premium sin pagar nada más.",
  },
];

function pantallaVentajas(perfil: PerfilBot | null): Pantalla {
  const esPremium = tienePremium(perfil);

  const texto = esPremium
    ? "💎 Todo lo que tienes con Premium\n\n" +
      "Pulsa cualquiera para ver el detalle y abrirlo 👇"
    : `💎 Qué incluye Premium · ${precioMes()}/mes\n\n` +
      "Nueve cosas, y cada una en su ficha para que veas exactamente qué es.\n\n" +
      "Pulsa la que te interese 👇";

  // De dos en dos: en una columna de nueve, el menú no cabe en pantalla.
  const filas: Boton[][] = [];
  for (let i = 0; i < VENTAJAS.length; i += 2) {
    filas.push(
      VENTAJAS.slice(i, i + 2).map((v) => ({ text: v.boton, data: `v:${v.id}` }))
    );
  }

  filas.push([
    { text: "💳 Precio y pago", data: "m:precio" },
    { text: "❌ Cómo cancelar", data: "m:cancelar" },
  ]);
  filas.push([esPremium ? botonCanal(perfil) : botonSuscribirse()]);
  filas.push([VOLVER_INICIO]);

  return { texto, botones: filas };
}

function pantallaVentaja(v: Ventaja, perfil: PerfilBot | null): Pantalla {
  const esPremium = tienePremium(perfil);
  const botones: Boton[][] = [];

  if (v.id === "canal") {
    // El único enlace sensible del bot. Sale por botonCanal(), que lo omite a
    // quien no es Premium — y el canal exige aprobación de todas formas.
    botones.push([botonCanal(perfil)]);
  } else if (v.id === "chat") {
    botones.push([HABLAR]);
  } else if (v.ruta) {
    botones.push([enlacePremium(perfil, v.ruta, v.textoEnlace ?? "🔎 Abrir en la web")]);
  }

  if (!esPremium) botones.push([botonSuscribirse()]);
  botones.push([VOLVER_VENTAJAS, VOLVER_INICIO]);

  const cierre = esPremium
    ? "\n\n✅ Lo tienes incluido."
    : `\n\n🔒 Se desbloquea con Premium · ${precioMes()}/mes`;

  return { texto: `${v.titulo}\n\n${v.texto}${cierre}`, botones };
}

// ── Resto de pantallas ──────────────────────────────────────────────────────

function pantallaGratis(perfil: PerfilBot | null): Pantalla {
  return {
    texto:
      "🎁 Lo que tienes sin pagar nada\n\n" +
      "La Academy no es un muro de pago con una demo detrás. Gratis ya tienes:\n\n" +
      "📰 Artículos y análisis semanales\n" +
      "📚 Las guías básicas, con quiz y logros\n" +
      "👀 Watchlist y predicción de precio\n" +
      "🧮 Calculadora de riesgo\n" +
      "🏆 Logros y rachas\n" +
      "📖 Glosario cripto de la A a la Z\n" +
      "📣 Canal gratuito de Telegram, con noticias y vídeos\n\n" +
      "Para la watchlist, la calculadora y los logros necesitas una cuenta gratuita — nada más.",
    botones: [
      [
        { text: "📚 Guías", url: url("/guias") },
        { text: "📰 Artículos", url: url("/articulos") },
      ],
      [
        { text: "🧮 Calculadora", url: url("/calculadora") },
        { text: "📖 Glosario", url: url("/glosario") },
      ],
      [{ text: "📣 Canal gratuito de Telegram", url: getFreeChannelUrl() }],
      [
        {
          text: tienePremium(perfil) ? "💎 Todo lo que tienes" : "💎 Qué añade Premium",
          data: "m:premium",
        },
      ],
      [VOLVER_INICIO],
    ],
  };
}

function pantallaPrecio(perfil: PerfilBot | null): Pantalla {
  const esPremium = tienePremium(perfil);

  const texto =
    "💳 Precio y formas de pago\n\n" +
    `💎 Premium: ${precioMes()} al mes\n` +
    `☕ ${precioDia()} al día — lo que un café\n\n` +
    "Cómo se paga:\n" +
    "• Con tarjeta, a través de Stripe (la misma pasarela que usan Amazon o Shopify)\n" +
    "• El pago va encriptado y los datos de tu tarjeta no los vemos nunca\n" +
    "• Se renueva solo cada mes, hasta que tú digas basta\n\n" +
    "Condiciones:\n" +
    "• Sin permanencia — cancelas en un clic, cuando quieras\n" +
    "• Al cancelar conservas el acceso hasta el final del mes que ya pagaste\n" +
    "• El precio al que entras queda fijado: mientras no canceles, es tuyo aunque suba";

  const botones: Boton[][] = [];
  if (esPremium) {
    botones.push([{ text: "⚙️ Gestionar mi suscripción", url: getCuentaUrl() }]);
  } else {
    botones.push([botonSuscribirse()]);
  }
  botones.push([
    { text: "❌ Cómo cancelar", data: "m:cancelar" },
    { text: "💎 Ver las ventajas", data: "m:premium" },
  ]);
  botones.push([HABLAR]);
  botones.push([VOLVER_INICIO]);

  return { texto, botones };
}

function pantallaCancelar(perfil: PerfilBot | null): Pantalla {
  return {
    texto:
      "❌ Cancelar la suscripción\n\n" +
      "Se hace en un clic y sin dar explicaciones:\n\n" +
      "1️⃣ Entra en tu cuenta en la web\n" +
      "2️⃣ Pulsa «Cancelar suscripción»\n" +
      "3️⃣ Ya está — no hay llamadas ni formularios\n\n" +
      "Qué pasa después:\n\n" +
      "✅ Conservas todo el acceso hasta el final del periodo que ya has pagado\n" +
      "📅 Aquí mismo, en «Mi Premium», ves hasta qué día llegas\n" +
      "🚪 Cuando termine, te saco del canal privado automáticamente\n" +
      "🔄 Puedes volver cuando quieras, y te reabro la puerta igual de rápido\n\n" +
      "Sin permanencia y sin letra pequeña. Si algo no te ha encajado, cuéntamelo — " +
      "me sirve más que el dinero de un mes.",
    botones: [
      [{ text: "⚙️ Ir a mi cuenta", url: getCuentaUrl() }],
      [HABLAR],
      [
        { text: "💳 Precio y pago", data: "m:precio" },
        ...(tienePremium(perfil)
          ? [{ text: "📊 Mi Premium", data: "m:estado" } as Boton]
          : []),
      ],
      [VOLVER_INICIO],
    ],
  };
}

/** Las dudas frecuentes, cada una en su ficha. Los textos van alineados con la
 *  FAQ de /premium: si allí cambia una respuesta, cambia aquí también. */
const DUDAS: { id: string; boton: string; titulo: string; texto: string; botones?: Boton[][] }[] = [
  {
    id: "vincular",
    boton: "🔗 ¿Por qué vincular la cuenta?",
    titulo: "🔗 ¿Por qué tengo que vincular mi cuenta?",
    texto:
      "Porque si no, no sé quién eres.\n\n" +
      "Telegram y la Academy son dos mundos distintos: aquí solo veo un usuario de Telegram, " +
      "y para saber si eres Premium tengo que poder mirarlo en tu cuenta.\n\n" +
      "Vincular sirve para:\n" +
      "🚪 Abrirte el canal privado en cuanto pagas, sin que pidas nada\n" +
      "📊 Enseñarte aquí tu plan y lo que te queda\n" +
      "💬 Saber quién me escribe cuando me escribes\n\n" +
      "Se hace una vez, desde tu cuenta en la web, y tarda un minuto.",
    botones: [[{ text: "🔗 Vincular mi cuenta", url: getCuentaUrl() }]],
  },
  {
    id: "canal",
    boton: "🚪 ¿Cómo entro al canal?",
    titulo: "🚪 ¿Cómo entro al canal privado?",
    texto:
      "Tres condiciones, y las tres se comprueban solas:\n\n" +
      "1️⃣ Tener Premium activo\n" +
      "2️⃣ Tener este Telegram vinculado a tu cuenta\n" +
      "3️⃣ Pulsar el botón de entrar y pedir acceso\n\n" +
      "Si las tres se cumplen, te acepto al instante — no hay nadie mirando solicitudes a mano.\n\n" +
      "Si te falta alguna, te lo digo en el momento y te explico qué falta. Y si dejas de ser " +
      "Premium, salgo yo a cerrarte la puerta: el canal es solo de quien lo paga.",
  },
  {
    id: "cancelar",
    boton: "❌ ¿Puedo cancelar?",
    titulo: "❌ ¿Puedo cancelar cuando quiera?",
    texto:
      "Sí, en un clic desde tu cuenta y sin preguntas.\n\n" +
      "Sin permanencia. Mantienes el acceso hasta el final del periodo que ya has pagado.\n\n" +
      "Te lo cuento entero en la ficha de cancelación 👇",
    botones: [[{ text: "❌ Cómo cancelar, paso a paso", data: "m:cancelar" }]],
  },
  {
    id: "pago",
    boton: "💳 ¿Cómo se paga?",
    titulo: "💳 ¿Cómo se realiza el pago?",
    texto:
      "Con tarjeta, a través de Stripe — la misma plataforma que usan Amazon o Shopify.\n\n" +
      "🔒 El pago va encriptado de punta a punta\n" +
      "👁 Los datos de tu tarjeta no los vemos nunca: los guarda Stripe, no nosotros\n" +
      "🔄 La renovación es automática cada mes, hasta que canceles\n" +
      "🧾 Las facturas y el método de pago los gestionas desde tu cuenta\n\n" +
      `El importe es ${precioMes()} al mes. Ni altas, ni matrículas, ni extras.`,
    botones: [[{ text: "💳 Ver precio y condiciones", data: "m:precio" }]],
  },
  {
    id: "precio",
    boton: "📈 ¿Me subirá el precio?",
    titulo: "📈 ¿El precio me subirá más adelante?",
    texto:
      `No.\n\n` +
      `El precio al que te suscribes queda fijado: mientras mantengas tu ` +
      "suscripción activa lo conservas, aunque suba para los que entren después.\n\n" +
      "La única forma de perderlo es cancelar y volver más adelante: entonces entrarías con la " +
      "tarifa que haya en ese momento.",
  },
  {
    id: "asesoramiento",
    boton: "⚖️ ¿Es asesoramiento?",
    titulo: "⚖️ ¿Esto es asesoramiento financiero?",
    texto:
      "No, y es importante que quede claro.\n\n" +
      "Esto es formación y herramientas para que tomes tus propias decisiones con criterio. " +
      "Nada de lo que veas aquí es una recomendación de inversión.\n\n" +
      "Nadie puede garantizarte rentabilidad — quien lo haga, te está mintiendo.\n\n" +
      "Invertir en cripto tiene riesgo real de perder dinero. Arriesga solo lo que puedas permitirte perder.",
    botones: [[{ text: "📄 Aviso legal", url: url("/aviso-legal") }]],
  },
  {
    id: "datos",
    boton: "🔐 ¿Y mis datos?",
    titulo: "🔐 ¿Qué se hace con mis datos?",
    texto:
      "Lo mínimo imprescindible para que esto funcione.\n\n" +
      "De Telegram guardo tu identificador y tu @, y solo para saber quién eres cuando escribes " +
      "y para poder abrirte o cerrarte el canal.\n\n" +
      "No se venden ni se ceden a nadie, y puedes desvincular tu Telegram cuando quieras desde " +
      "tu cuenta: se borra la conexión y aquí dejo de reconocerte.",
    botones: [
      [
        { text: "🔐 Privacidad", url: url("/privacidad") },
        { text: "📄 Términos", url: url("/terminos") },
      ],
    ],
  },
];

function pantallaFaq(): Pantalla {
  const filas: Boton[][] = DUDAS.map((d) => [{ text: d.boton, data: `q:${d.id}` }]);
  filas.push([HABLAR]);
  filas.push([VOLVER_INICIO]);

  return {
    texto:
      "❓ Dudas frecuentes\n\n" +
      "Las que más me llegan, contestadas sin rodeos.\n\n" +
      "Pulsa la tuya 👇 Y si no está, escríbeme y te la contesto yo.",
    botones: filas,
  };
}

function pantallaWeb(): Pantalla {
  return {
    texto:
      "🧭 La Academy por dentro\n\n" +
      "📚 Guías — interactivas, con quiz y logros\n" +
      "📰 Artículos — análisis y noticias, sin humo\n" +
      "🧮 Calculadora de riesgo — cuánto arriesgar en cada entrada\n" +
      "📖 Glosario — el vocabulario cripto explicado en cristiano\n" +
      "📊 Dashboard — tu watchlist, tus logros y tus herramientas\n" +
      "⚙️ Mi cuenta — tu plan, tu suscripción y tu Telegram\n\n" +
      "Pulsa donde quieras entrar 👇",
    botones: [
      [
        { text: "📚 Guías", url: url("/guias") },
        { text: "📰 Artículos", url: url("/articulos") },
      ],
      [
        { text: "🧮 Calculadora", url: url("/calculadora") },
        { text: "📖 Glosario", url: url("/glosario") },
      ],
      [
        { text: "📊 Dashboard", url: url("/dashboard") },
        { text: "⚙️ Mi cuenta", url: getCuentaUrl() },
      ],
      [{ text: "🌐 Ir a la Academy", url: getSiteUrl() }],
      [VOLVER_INICIO],
    ],
  };
}

function pantallaAyuda(perfil: PerfilBot | null): Pantalla {
  const esPremium = tienePremium(perfil);

  const escribir = esPremium
    ? "✍️ Escríbeme aquí lo que sea: me llega a mí y te contesto por este mismo chat."
    : perfil
      ? "✍️ Escribirme por aquí es una ventaja Premium. Mientras tanto, tienes el botón de hablar " +
        "conmigo directamente, que también funciona."
      : "✍️ Vincula tu cuenta y podré atenderte sabiendo quién eres.";

  return {
    texto:
      "🆘 Cómo funciona este bot\n\n" +
      "Soy el bot de AdelinBTC Academy. Hago tres cosas:\n\n" +
      "🚪 Te abro el canal privado en cuanto eres Premium, automáticamente\n" +
      "📊 Te enseño tu plan y lo que te queda, sin entrar en la web\n" +
      "💬 Te paso mensajes conmigo y te traigo la respuesta\n\n" +
      "Comandos:\n" +
      "/menu — el menú principal\n" +
      "/premium — qué incluye Premium\n" +
      "/precio — precio y formas de pago\n" +
      "/cancelar — cómo cancelar\n" +
      "/estado — mi plan y lo que me queda\n" +
      "/gratis — lo que ya tienes sin pagar\n" +
      "/faq — dudas frecuentes\n" +
      "/canal — el canal privado\n" +
      "/web — la Academy por dentro\n" +
      "/ayuda — esta pantalla\n\n" +
      escribir,
    botones: [
      [HABLAR],
      [
        { text: "❓ Dudas frecuentes", data: "m:faq" },
        { text: "🧭 La Academy", data: "m:web" },
      ],
      [VOLVER_INICIO],
    ],
  };
}

function pantallaCanal(perfil: PerfilBot | null): Pantalla {
  const ventaja = VENTAJAS.find((v) => v.id === "canal");
  if (!ventaja) throw new Error("Falta la ventaja del canal");
  return pantallaVentaja(ventaja, perfil);
}

// ── Enrutador de pantallas ──────────────────────────────────────────────────

/**
 * Devuelve la pantalla pedida, o null si el identificador no existe.
 *
 * `perfil` siempre se lee de la base de datos justo antes de llamar aquí: la
 * pulsación de un botón NO puede traer el plan, solo la pantalla que se quiere
 * ver. Así, un mensaje viejo guardado por un usuario que ya no es Premium se
 * repinta con lo que le corresponde hoy, no con lo que le correspondía cuando
 * se envió.
 */
export function pantalla(
  id: string,
  perfil: PerfilBot | null,
  nombre?: string | null
): Pantalla | null {
  if (id === "m:inicio") {
    return { texto: textoInicio(perfil, nombre), botones: menuPara(perfil) };
  }
  if (id === "m:estado") {
    return { texto: fichaEstado(perfil), botones: botonesEstado(perfil) };
  }
  if (id === "m:premium") return pantallaVentajas(perfil);
  if (id === "m:gratis") return pantallaGratis(perfil);
  if (id === "m:precio") return pantallaPrecio(perfil);
  if (id === "m:cancelar") return pantallaCancelar(perfil);
  if (id === "m:faq") return pantallaFaq();
  if (id === "m:web") return pantallaWeb();
  if (id === "m:ayuda") return pantallaAyuda(perfil);
  if (id === "m:canal") return pantallaCanal(perfil);

  if (id.startsWith("v:")) {
    const ventaja = VENTAJAS.find((v) => v.id === id.slice(2));
    return ventaja ? pantallaVentaja(ventaja, perfil) : null;
  }

  if (id.startsWith("q:")) {
    const duda = DUDAS.find((d) => d.id === id.slice(2));
    if (!duda) return null;
    return {
      texto: `${duda.titulo}\n\n${duda.texto}`,
      botones: [...(duda.botones ?? []), [VOLVER_FAQ, VOLVER_INICIO]],
    };
  }

  return null;
}

/** Los comandos que se publican en el botón «/» de Telegram. Se usa desde
 *  scripts/telegram-doctor.mjs, que no puede importar TypeScript: si se toca
 *  esta lista, hay que tocar también la de allí. */
export const COMANDOS_PUBLICOS: Record<string, string> = {
  "/menu": "m:inicio",
  "/premium": "m:premium",
  "/precio": "m:precio",
  "/cancelar": "m:cancelar",
  "/estado": "m:estado",
  "/gratis": "m:gratis",
  "/faq": "m:faq",
  "/canal": "m:canal",
  "/web": "m:web",
  "/ayuda": "m:ayuda",
};

