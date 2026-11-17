interface GuideSpotlightCardsProps {
  uses: {
    /** Se conserva en los datos de las guías, pero no se pinta: la web pública va sin emojis (ESTILO.md). */
    icon: string;
    title: string;
    desc: string;
    ex: string;
  }[];
}

/**
 * Las tarjetas de usos de una guía (estilo «Cuaderno de estudio»): hojas de
 * papel con canto, numeradas como fichas de un cuaderno, que se levantan con
 * un rebote al pasar el ratón. En vez del emoji de cada uso va su número: la
 * web pública no lleva emojis. CSS en guias.css.
 */
export default function GuideSpotlightCards({ uses }: GuideSpotlightCardsProps) {
  return (
    <div className="gsc-rejilla">
      {uses.map((u, i) => (
        <div key={u.title} className="gsc-tarjeta" style={{ "--i": i } as React.CSSProperties}>
          <span className="gsc-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <div className="gsc-t">{u.title}</div>
          <div className="gsc-d">{u.desc}</div>
          <div className="gsc-ex">Ejemplos: {u.ex}</div>
        </div>
      ))}
    </div>
  );
}
