import Link from "next/link";
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import Footer from "@/components/Footer";
import IndiceLegal, { type ApartadoLegal } from "@/components/IndiceLegal";
import InterruptorSonido from "@/components/cuaderno/InterruptorSonido";
// La barra de las páginas legales es la misma tira de papel que la de
// SiteNav, solo con la marca y el altavoz: su CSS vive en site-nav.css.
import "./site-nav.css";
import "./legal-shell.css";

import MarcaLogo from "@/components/MarcaLogo";
interface Props {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

type ConHijos = { children?: ReactNode; id?: string; className?: string };

/** El texto plano de un nodo («Categoría de datos»), para usarlo de etiqueta. */
function textoDe(nodo: ReactNode): string {
  if (typeof nodo === "string" || typeof nodo === "number") return String(nodo);
  if (Array.isArray(nodo)) return nodo.map(textoDe).join("");
  if (isValidElement<ConHijos>(nodo)) return textoDe(nodo.props.children);
  return "";
}

/**
 * En el móvil, las tablas legales pasan a fichas (legal-shell.css): cada fila
 * una tarjeta y cada dato con el nombre de su columna delante. Ese nombre se
 * copia aquí, en el servidor, de la cabecera de la tabla a cada celda
 * (`data-label`): así nadie tiene que escribirlo dos veces en las páginas.
 * Solo recorre elementos HTML, nunca componentes, y no cambia ningún texto.
 */
function etiquetarTablas(nodo: ReactNode): ReactNode {
  return Children.map(nodo, (el) => {
    if (!isValidElement<ConHijos>(el) || typeof el.type !== "string") return el;
    if (el.type === "table" && el.props.className?.split(" ").includes("lg-tabla")) {
      const partes = Children.toArray(el.props.children).filter((n): n is ReactElement<ConHijos> => isValidElement(n));
      const thead = partes.find((n) => n.type === "thead");
      const filaCabecera = thead && Children.toArray(thead.props.children).find((n): n is ReactElement<ConHijos> => isValidElement(n));
      const etiquetas = filaCabecera
        ? Children.toArray(filaCabecera.props.children).filter((n) => isValidElement(n)).map((n) => textoDe(n).trim())
        : [];
      if (etiquetas.length === 0) return el;
      return cloneElement(el, {
        children: Children.map(el.props.children, (parte) => {
          if (!isValidElement<ConHijos>(parte) || parte.type !== "tbody") return parte;
          return cloneElement(parte, {
            children: Children.map(parte.props.children, (fila) => {
              if (!isValidElement<ConHijos>(fila)) return fila;
              let i = 0;
              return cloneElement(fila, {
                children: Children.map(fila.props.children, (celda) => {
                  if (!isValidElement<ConHijos>(celda) || celda.type !== "td") return celda;
                  const etiqueta = etiquetas[i++];
                  return etiqueta ? cloneElement(celda as ReactElement<ConHijos & { "data-label"?: string }>, { "data-label": etiqueta }) : celda;
                }),
              });
            }),
          });
        }),
      });
    }
    if (el.props.children === undefined) return el;
    return cloneElement(el, { children: etiquetarTablas(el.props.children) });
  });
}

/**
 * Las páginas legales (aviso legal, privacidad, cookies) con el estilo
 * «Cuaderno de estudio» (17-11-2026): una hoja de cuaderno sobre el fondo
 * lavanda, con su margen, y al lado un índice de teclas que lleva a cada
 * apartado.
 *
 * El índice se saca del propio texto, en el servidor: cada `<section>` hija
 * cuyo primer `<h2>` empieza por «N. » es un apartado. Así no hay una segunda
 * lista de títulos que se desincronice, y el índice sale en el HTML.
 * El texto legal no se toca aquí: solo cómo se ve (el marco es RUMANO,
 * PLATAFORMA.md; los datos, en src/lib/legal.ts).
 */
function leerApartados(children: ReactNode): { apartados: ApartadoLegal[]; cuerpo: ReactNode } {
  const apartados: ApartadoLegal[] = [];

  const cuerpo = Children.map(children, (hijo) => {
    if (!isValidElement<ConHijos>(hijo) || hijo.type !== "section") return hijo;
    const titulo = Children.toArray(hijo.props.children).find(
      (n): n is ReactElement<ConHijos> => isValidElement<ConHijos>(n) && n.type === "h2",
    );
    const texto = titulo && typeof titulo.props.children === "string" ? titulo.props.children : null;
    const m = texto?.match(/^(\d+)\.\s*(.+)$/);
    if (!m) return hijo;
    const id = hijo.props.id ?? `apartado-${m[1]}`;
    apartados.push({ id, numero: m[1], titulo: m[2] });
    return cloneElement(hijo, { id });
  });

  return { apartados, cuerpo: etiquetarTablas(cuerpo) };
}

/** «Política de Privacidad» → «Política de» + «Privacidad» con rotulador. */
function partirTitulo(title: string): [string, string] {
  const corte = title.lastIndexOf(" ");
  return corte === -1 ? ["", title] : [title.slice(0, corte + 1), title.slice(corte + 1)];
}

export default function LegalShell({ title, lastUpdated, children }: Props) {
  const { apartados, cuerpo } = leerApartados(children);
  const [inicio, final] = partirTitulo(title);

  return (
    <div className="lg">
      <nav className="blog-nav">
        <Link href="/" className="blog-brand">
          <MarcaLogo prioridad />
        </Link>
        {/* El altavoz, también aquí: los sonidos vienen encendidos y
            silenciarlos tiene que estar a mano en todas las páginas. */}
        <div className="blog-nav-end">
          <span className="nav-sonido">
            <InterruptorSonido />
          </span>
        </div>
      </nav>

      <main className="lg-main">
        <header className="lg-cabecera">
          <p className="lg-marca">AdelinBTC Academy</p>
          <h1 className="lg-titulo">
            {inicio}
            <span className="fluor">{final}</span>
          </h1>
          <p className="lg-fecha">Última actualización: {lastUpdated}</p>
        </header>

        <div className={`lg-rejilla${apartados.length ? "" : " lg-rejilla--sola"}`}>
          {apartados.length > 0 && <IndiceLegal apartados={apartados} />}
          <article className="lg-hoja">
            <div className="lg-cuerpo">{cuerpo}</div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
