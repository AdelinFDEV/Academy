/**
 * Datos identificativos del titular y metadatos legales compartidos por las
 * páginas legales (aviso legal, privacidad, cookies) y el footer.
 *
 * ⚠️  COMPLETAR ANTES DE SEGUIR: `titularNombre`, `formaJuridica`,
 * `identificadorFiscal` y `domicilio` llevan texto de relleno y **se muestran
 * tal cual en producción** en /aviso-legal y /privacidad. Identificar al
 * titular es una obligación legal, no un adorno.
 *
 * ── El sitio se rige por derecho rumano (06-09-2026) ────────────────────────
 *
 * Hasta esta fecha las páginas legales citaban normativa española (LSSI-CE
 * 34/2002, LOPDGDD 3/2018, AEPD) porque el sitio nació apuntando a público
 * español. El titular reside y opera desde **Rumanía**, así que las leyes
 * nacionales aplicables son las rumanas. Las referencias al **RGPD no cambian**:
 * es un reglamento europeo y rige igual en los dos países.
 *
 * Que la ley aplicable sea la rumana **no rebaja los derechos del cliente
 * español**: el art. 6 del Reglamento Roma I mantiene para el consumidor las
 * protecciones imperativas de su país de residencia, y por eso la cláusula de
 * jurisdicción sigue remitiendo a los tribunales del domicilio del usuario.
 *
 * Las leyes se nombran desde aquí y no se escriben a mano en cada página: son
 * el mismo tipo de dato repetido en cuatro sitios que ya causó problemas con el
 * catálogo de herramientas.
 *
 * ⚠️  **Esto no es asesoramiento jurídico.** El cambio de marco legal, la
 * fiscalidad de vender a consumidores de otro Estado miembro (IVA / OSS) y la
 * normativa de promoción de criptoactivos los tiene que revisar un abogado.
 */
export const LEGAL = {
  /** Nombre y apellidos del titular (persona física). COMPLETAR. */
  titularNombre: "[Nombre y apellidos del titular]",
  /**
   * Cómo opera el titular. COMPLETAR con la realidad del alta en Rumanía:
   * «persona física autorizada (PFA)» o «sociedad de responsabilidad limitada
   * (SRL)». Si es SRL hay que publicar además el número del Registro Mercantil.
   */
  formaJuridica: "[PFA o SRL — forma jurídica del titular]",
  /** Código de identificación fiscal rumano (CUI/CIF). COMPLETAR. */
  identificadorFiscal: "[CUI / código de identificación fiscal]",
  /** Domicilio a efectos de notificaciones. COMPLETAR. */
  domicilio: "[Domicilio a efectos de notificaciones]",
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
  /** País cuya legislación nacional rige el Sitio. */
  pais: "Rumanía",
  /** Gentilicio, para redactar «la normativa …» sin repetir el país. */
  gentilicio: "rumana",
  /** Equivalente rumano de la LSSI: obliga a identificar al prestador. */
  leyComercioElectronico:
    "Ley n.º 365/2002, sobre comercio electrónico",
  /** Cookies y comunicaciones electrónicas (transposición de la Directiva ePrivacy). */
  leyCookies:
    "Ley n.º 506/2004, sobre el tratamiento de datos personales y la protección de la vida privada en el sector de las comunicaciones electrónicas",
  /** Norma nacional que desarrolla el RGPD en Rumanía. */
  leyProteccionDatos:
    "Ley n.º 190/2018, de aplicación del Reglamento (UE) 2016/679",
  /** Autoridad de control en materia de protección de datos. */
  autoridadControl: {
    nombre:
      "Autoridad Nacional de Supervisión del Tratamiento de Datos de Carácter Personal",
    siglas: "ANSPDCP",
    url: "https://www.dataprotection.ro",
  },
  /** Fecha de última actualización de las políticas (formato legible). */
  ultimaActualizacion: "6 de septiembre de 2026",
} as const;
