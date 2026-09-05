/**
 * El horario del trading en directo — fuente única.
 *
 * Estaba escrito a mano dentro de `trading-en-directo/page.tsx`, y en cuanto un
 * segundo sitio necesitó la próxima sesión (la tarjeta del dashboard) tocaba
 * repetirlo. Ya sabemos cómo acaba eso aquí: cuatro listas de herramientas
 * discrepando entre sí.
 *
 * ── Ojo con las fechas ─────────────────────────────────────────────────────
 *
 * La hora se calcula con `Intl.DateTimeFormat().formatToParts()` y `Date.UTC`,
 * NUNCA con `new Date(fecha.toLocaleString(...))`. Ese atajo escribe la fecha
 * como texto y deja que `new Date` la relea **en la zona de la máquina**, no en
 * la pedida — y es traicionero porque en UTC da bien, que es justo donde corre
 * el servidor. Ya pasó en el Radar, con el PCE saliendo tres horas desplazado.
 */

/** Zona en la que se anuncian las sesiones al público. */
const ZONA = "Europe/Madrid";

/** Lunes, miércoles y viernes (0 = domingo, como `Date.getUTCDay()`). */
const DIAS_SESION = [1, 3, 5];

/** Hora peninsular de inicio y fin. */
const INICIO = 17;
const FIN = 19;

/**
 * ⚠️ Las horas se escriben tal cual, **no se convierten a la zona del
 * visitante**. Alguien mirando desde México o Argentina vería «17:00» y
 * entendería las 17:00 suyas, que no son las mismas: llegaría tarde o no
 * llegaría. Por eso `franjaEs` lleva la coletilla incorporada y es la que hay
 * que usar; `horaEs` a secas solo vale donde el texto de alrededor ya dice de
 * qué país se habla.
 */
export const HORARIO_DIRECTO = {
  dias: "Lunes, miércoles y viernes",
  horaEs: "17:00 a 19:00",
  horaRo: "18:00 a 20:00",
  /** La forma correcta de enseñar la hora en cualquier sitio. */
  franjaEs: "17:00 a 19:00 (hora de España)",
  /** Para cuando la hora ya está escrita aparte. */
  zonaEs: "hora de España",
  /** Desde dónde se emite, que es lo que explica el desfase. */
  franjaRo: "18:00 a 20:00 (hora de Rumanía)",
} as const;

const DIA_CORTO: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** El calendario y la hora de pared en España, sin pasar por texto releído. */
function ahoraEnEspana(momento: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(momento);

  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return {
    anio: Number(valor("year")),
    mes: Number(valor("month")),
    dia: Number(valor("day")),
    // A las 24:00 algunos entornos devuelven "24" en vez de "00".
    hora: Number(valor("hour")) % 24,
    diaSemana: DIA_CORTO[valor("weekday")] ?? 0,
  };
}

export type ProximaSesion = {
  /** «lunes 8 de septiembre». */
  cuando: string;
  /** «hoy» y «mañana» se dicen así, que es como habla la gente. */
  relativo: "hoy" | "mañana" | null;
  /** Ahora mismo hay sesión en marcha. */
  enCurso: boolean;
  /** Días de diferencia con hoy: 0 hoy, 1 mañana… */
  enDias: number;
};

/**
 * Cuándo es la siguiente sesión, mirado desde España.
 *
 * Un día de sesión cuenta como «hoy» hasta que termina: a las 18:00 de un lunes
 * la próxima sesión sigue siendo la de ese lunes, en curso, no la del miércoles.
 */
export function proximaSesion(momento: Date = new Date()): ProximaSesion {
  const { anio, mes, dia, hora, diaSemana } = ahoraEnEspana(momento);

  for (let salto = 0; salto <= 7; salto++) {
    const diaDeLaSemana = (diaSemana + salto) % 7;
    if (!DIAS_SESION.includes(diaDeLaSemana)) continue;
    // Hoy solo vale mientras la sesión no haya terminado.
    if (salto === 0 && hora >= FIN) continue;

    // Aritmética en UTC sobre la fecha de pared española: sumar días a un
    // instante de medianoche UTC es exacto y no lo toca ningún cambio de hora.
    const fecha = new Date(Date.UTC(anio, mes - 1, dia + salto));
    const cuando = new Intl.DateTimeFormat("es-ES", {
      timeZone: "UTC",
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(fecha);

    return {
      cuando,
      relativo: salto === 0 ? "hoy" : salto === 1 ? "mañana" : null,
      enCurso: salto === 0 && hora >= INICIO && hora < FIN,
      enDias: salto,
    };
  }

  // Inalcanzable con tres días por semana, pero devolver algo coherente es
  // mejor que dejar que la tarjeta reviente si alguien toca DIAS_SESION.
  return { cuando: HORARIO_DIRECTO.dias, relativo: null, enCurso: false, enDias: 0 };
}
