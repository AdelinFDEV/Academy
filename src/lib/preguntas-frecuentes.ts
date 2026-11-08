/**
 * Las preguntas frecuentes de Premium. **Fuente única** para /premium y para
 * la sección final de la portada (`PremiumHome`).
 *
 * Hasta el 08-11-2026 había una segunda lista en un popup flotante
 * (`DudasInstagram`) que decía cosas distintas —«cancela en 1 clic», ya
 * retirado de /premium por no ser verdad—. El popup se quitó y sus preguntas
 * viven aquí: si cambia una respuesta, cambia en todas partes a la vez.
 *
 * Cada respuesta tiene que poder comprobarse en el código. `portada` marca las
 * que salen también en la portada, donde caben menos.
 */
export interface PreguntaFrecuente {
  q: string;
  a: string;
  portada?: boolean;
  /** Solo para la portada: en /premium ya se ve en la tabla de arriba. */
  soloPortada?: boolean;
}

export const PREGUNTAS_FRECUENTES: PreguntaFrecuente[] = [
  {
    q: "¿Las guías son gratis?",
    a: "Sí, todas. Se leen enteras sin registrarte. Solo el quiz final pide una cuenta gratuita, porque guarda tu resultado y te da su logro.",
    portada: true,
    soloPortada: true,
  },
  {
    q: "¿Qué incluye Premium?",
    a: "El Diario de Trading con Nova, el Portfolio Adelin con la cartera spot y el DCA de bitcoin, y todos los cursos con examen y certificado. Lo que se añada después entra sin pagar más.",
    portada: true,
    soloPortada: true,
  },
  {
    q: "¿Puedo cancelar cuando quiera?",
    a: "Sí, sin permanencia ni preguntas. Cancelas desde «Mi perfil», en el portal seguro de Stripe, y mantienes el acceso hasta el final del periodo que ya has pagado.",
    portada: true,
  },
  {
    q: "¿Los cursos se pagan aparte?",
    a: "No. Todos los cursos van incluidos en la suscripción, también los que se publiquen más adelante. Sin compras sueltas.",
    portada: true,
  },
  {
    q: "Si cancelo, ¿pierdo mis certificados?",
    a: "No. Los certificados que hayas ganado se quedan en la vitrina de tu panel y puedes descargarlos siempre, aunque ya no seas Premium. Cualquiera puede verificarlos con su código.",
    portada: true,
  },
  {
    q: "¿El precio me subirá más adelante?",
    a: "A ti no. El precio al que te suscribes queda fijado mientras mantengas la suscripción activa, aunque suba para quien entre después. Si cancelas y vuelves más adelante, entrarías con la tarifa que haya entonces.",
  },
  {
    q: "¿Qué es Nova?",
    a: "La asistente de tu Diario de Trading. Lee lo que apuntas —operaciones, emociones y capital— y te avisa de lo importante: riesgo, rachas, si cierras las ganadoras antes de tiempo o si operas por revancha. Son reglas sobre tus datos: no inventa nada ni te da señales.",
  },
  {
    q: "¿Mi diario lo ve alguien más?",
    a: "No. Tu diario es privado: solo lo ves tú. Ni otros usuarios ni la academia lo enseñan en ninguna parte.",
    portada: true,
  },
  {
    q: "¿Cómo se paga?",
    a: "Con tarjeta, a través de Stripe. El pago va cifrado y nosotros nunca vemos los datos de tu tarjeta.",
  },
  {
    q: "¿Esto es asesoramiento financiero?",
    a: "No. Es formación y herramientas para que tomes tus propias decisiones con criterio. Nadie puede garantizarte rentabilidad: quien lo haga, te está mintiendo.",
    portada: true,
  },
];
