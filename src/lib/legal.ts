/**
 * Datos identificativos del titular y metadatos legales compartidos por las
 * páginas legales (aviso legal, privacidad, cookies) y el footer.
 *
 * ⚠️  IMPORTANTE — completa TITULAR_NOMBRE antes de publicar en producción.
 * La LSSI (art. 10) obliga a identificar al titular del sitio con su nombre
 * real y un medio de contacto. Mientras operes como particular basta con
 * nombre y apellidos + email; si te das de alta como autónomo o constituyes
 * una sociedad, añade también NIF/CIF y domicilio a efectos de notificaciones.
 */
export const LEGAL = {
  /** Nombre y apellidos del titular (persona física). COMPLETAR. */
  titularNombre: "[Nombre y apellidos del titular]",
  /** Nombre comercial / marca bajo la que opera el sitio. */
  marca: "AdelinBTC Academy",
  /** Dominio del sitio (sin protocolo). */
  dominio: "adelinacademy.com",
  /** Email de contacto para asuntos legales, privacidad y ejercicio de derechos. */
  email: "georgeadelingombosredes@gmail.com",
  /** Actividad del sitio. */
  actividad: "Formación y educación en criptomonedas y tecnología blockchain",
  /** Edad mínima para registrarse y usar el servicio. */
  edadMinima: 18,
  /** Fecha de última actualización de las políticas (formato legible). */
  ultimaActualizacion: "12 de julio de 2026",
} as const;
