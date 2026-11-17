/**
 * EL INTERRUPTOR DE NOVA (17-11-2026).
 *
 * El admin, al rediseñar el Diario con el estilo «Cuaderno de estudio»: «a Nova
 * no la elimines pero ocúltala, más adelante crearemos la mascota» (ESTILO.md,
 * «La mascota sustituye a Nova»). Así que Nova sigue entera —su cabeza, su sala,
 * su vuelo, sus avisos (tjNova.ts)—, pero no se pinta en ningún sitio que lea
 * este valor. Lo leen:
 *   · el Diario (TradingJournal) y la barra (NavPrincipal);
 *   · /premium (src/app/premium/page.tsx);
 *   · la ficha /herramientas/diario (src/app/herramientas/diario/page.tsx);
 *   · el cierre de la portada (src/components/PremiumHome.tsx);
 *   · el anuncio de la guía del diario (GuiaDiarioCta).
 *
 * Volver a enseñarla es cambiar `false` por `true`. Nada más. Los TEXTOS que la
 * nombran (venta de Premium, fichas, preguntas frecuentes) no dependen de esto:
 * los decide el admin.
 */
export const MOSTRAR_NOVA = false;
