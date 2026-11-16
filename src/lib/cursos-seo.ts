/**
 * Lo que la ficha pública de un curso añade para Google y para quien llega
 * desde él, sin tocar los datos del curso en Supabase.
 *
 * El nombre del curso sale en el certificado, en la tarjeta de /cursos y en el
 * aula, y tiene que ser corto: «Fiscalidad cripto en España». Lo que la gente
 * escribe en Google es otra cosa: «curso de fiscalidad sobre criptomonedas».
 * Aquí va lo segundo, sin tocar lo primero.
 *
 * Sin entrada, la ficha usa el título y el subtítulo del curso, como siempre,
 * y no pinta las secciones opcionales.
 */

export interface CursoSeo {
  /** El title, sin la marca: la añade el layout («%s | AdelinBTC»). Máximo 48 caracteres. */
  title: string;
  /** La description de Google: 110-160 caracteres, con la consulta. */
  description: string;
  /**
   * El <h1> de la ficha, si debe decir algo más que el nombre del curso.
   * Va con la misma consulta que el title: Google los compara.
   */
  h1?: string;
  /**
   * Regla del diccionario: cada término técnico, enlazado a su ficha en su
   * PRIMERA aparición en la página (entradilla, «Para quién es» y objetivos,
   * en ese orden). Texto exacto tal como sale escrito → slug del glosario,
   * que tiene que existir y tener `extended`.
   */
  terminos?: Record<string, string>;
  /** «Para quién es»: a quién le sirve y a quién no. El panel de SEO lo pide en toda ficha de curso. */
  para?: { si: string[]; no: string[] };
  /**
   * Preguntas frecuentes, visibles en la página. Sin FAQPage en el JSON-LD a
   * propósito: Google retiró ese resultado el 07-05-2026 y no se añade a
   * páginas nuevas (/admin/seo-instrucciones, «Datos estructurados»).
   */
  faq?: { q: string; a: string; enlace?: { href: string; texto: string } }[];
  /**
   * «Al día»: lo reciente que el temario ya recoge, con su fecha en el <h2>.
   * Es lo que separa este curso de los que salen junto a él en Google, que
   * son de 2022 a 2025. **Se revisa antes de cada campaña de la renta**, junto
   * con el año del `title`: una fecha vieja aquí miente, y en YMYL eso pesa.
   */
  alDia?: { fecha: string; puntos: string[] };
}

export const CURSO_SEO: Record<string, CursoSeo> = {
  "fiscalidad-cripto-espana": {
    // El año va en el title porque es lo que distingue este curso de los
    // que salen a su lado (de 2022 a 2025). Se cambia con `alDia`, cada campaña.
    title: "Curso de fiscalidad de criptomonedas 2026",
    description:
      "Curso de fiscalidad de criptomonedas en España revisado en noviembre de 2026: temario completo, de la primera compra a la Renta Web. FIFO, staking, DeFi y 721.",
    h1: "Curso de fiscalidad cripto en España",
    terminos: {
      FIFO: "fifo",
      staking: "staking",
      airdrops: "airdrop",
      DeFi: "defi",
      "regla de la recompra": "regla-de-la-recompra",
      permutas: "permuta",
      stablecoins: "stablecoin",
      IRPF: "irpf",
      lending: "lending",
      "pool de liquidez": "liquidity-pool",
      "Compensar pérdidas": "compensacion-de-perdidas",
      "modelo 721": "modelo-721",
      "Impuesto sobre el Patrimonio": "impuesto-sobre-el-patrimonio",
      "requerimiento de Hacienda": "requerimiento-de-hacienda",
      DAC8: "dac8",
    },
    para: {
      si: [
        "Compras, vendes o cambias criptomonedas y declaras tus impuestos en España.",
        "Has hecho staking, has recibido airdrops o usas DeFi, y no sabes dónde va cada cosa en la Renta.",
        "Quieres hacer tu declaración tú, o entender la que te prepara tu asesor antes de firmarla.",
        "Tienes pérdidas y quieres aprovecharlas sin caer en la regla de la recompra.",
      ],
      no: [
        "Buscas que alguien revise tu caso concreto: eso es trabajo de un asesor fiscal, y el curso te dice cuándo hace falta.",
        "Declaras en otro país: todo el curso es normativa española de territorio común.",
      ],
    },
    // Cada punto sale del informe del curso (informes/curso-fiscalidad-cripto-espana.md,
    // «Decisiones tomadas»), no de memoria.
    alDia: {
      fecha: "noviembre de 2026",
      puntos: [
        "DAC8 tal como está hoy: en vigor en la Unión Europea y sin transponer en España, porque el proyecto de ley caducó al disolverse las Cortes en octubre de 2026. Y lo que Hacienda ya sabe por los modelos 172, 173 y 721.",
        "Las consultas de la Dirección General de Tributos de 2024 a 2026 sobre staking, lending, airdrops y DeFi, y lo que todavía no ha aclarado.",
        "La sentencia del TSJ del País Vasco de enero de 2025 sobre el FIFO, y por qué en territorio común se sigue aplicando.",
        "La regla de la recompra en criptomonedas, que no tiene consulta de la DGT: qué está claro y cuál es la lectura prudente.",
        "La autoliquidación rectificativa, la vía para corregir una declaración desde la Renta 2024.",
        "La campaña de la Renta 2026, la que se presenta en 2027: quién está obligado a declarar y el calendario.",
      ],
    },
    faq: [
      {
        q: "¿Sirve para la declaración de la renta de este año?",
        a: "Sí. El curso se revisó por última vez en la fecha que ves arriba, y explica la campaña de la renta que se presenta en 2027, sobre lo que hayas operado en 2026. Los tipos, los umbrales y los plazos se repasan antes de cada campaña.",
      },
      {
        q: "¿Necesito saber de impuestos para seguirlo?",
        a: "No. Empieza por qué grava el impuesto y por qué hay dos bases con escalas distintas. Es de nivel intermedio porque da por hecho que ya compras o vendes criptomonedas, no que sepas de fiscalidad.",
      },
      {
        q: "¿El certificado es un título oficial?",
        a: "No. Es un certificado de aprovechamiento de AdelinBTC Academy, con tu nombre, tu nota y un código que cualquiera puede comprobar en su página pública. No es un título homologado ni habilita para ejercer como asesor fiscal.",
      },
      {
        q: "¿Sustituye a un asesor fiscal?",
        a: "No. Te enseña a entender y preparar tu declaración, y a reconocer los casos que necesitan a un profesional: una actividad económica, un robo que quieres declarar, un patrimonio grande o una carta de Hacienda que no sabes contestar.",
      },
      {
        q: "¿Cuánto cuesta el curso?",
        a: "Está incluido en la suscripción Premium, junto con el resto de cursos y las herramientas de la academia. No se paga aparte.",
        enlace: { href: "/premium", texto: "Ver qué incluye Premium" },
      },
      {
        q: "¿Hay algo gratis para empezar?",
        a: "Sí. La guía gratuita de fiscalidad cripto en España resume lo esencial: qué tributa, el método FIFO, el staking y el modelo 721. El curso va más allá, con un caso práctico de un año entero, la Renta Web operación a operación y qué hacer si Hacienda te escribe.",
        enlace: { href: "/guias/fiscalidad-cripto-espana", texto: "Leer la guía de fiscalidad cripto" },
      },
    ],
  },
};
