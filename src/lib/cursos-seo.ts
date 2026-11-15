/**
 * El title y la description de Google de la ficha de un curso, cuando no
 * deben ser su nombre y su subtítulo.
 *
 * El nombre del curso sale en el certificado, en la tarjeta de /cursos y en el
 * aula, y tiene que ser corto: «Fiscalidad cripto en España». Lo que la gente
 * escribe en Google es otra cosa: «curso de fiscalidad sobre criptomonedas».
 * Aquí va lo segundo, sin tocar lo primero.
 *
 * Sin entrada, la ficha usa el título y el subtítulo del curso, como siempre.
 * El title va sin la marca: la añade la plantilla del layout («%s | AdelinBTC»),
 * así que conviene no pasar de unos 48 caracteres.
 */
export const CURSO_SEO: Record<string, { title: string; description: string }> = {
  "fiscalidad-cripto-espana": {
    title: "Curso de fiscalidad de criptomonedas en España",
    description:
      "Curso de fiscalidad de criptomonedas en España: qué tributa, el FIFO, staking y DeFi, cómo compensar pérdidas, la Renta Web y el modelo 721.",
  },
};
