"use client";

import { Bold, List, ListOrdered } from "lucide-react";
import { sonar } from "@/lib/sonidos";

/**
 * Los tres formatos del foro, encima del cuadro de texto: negrita, lista y
 * lista numerada (23-11-2026).
 *
 * No hay editor enriquecido: el mensaje sigue siendo TEXTO PLANO y el
 * formato son marcas que cualquiera puede escribir a mano y que `TextoForo`
 * interpreta al pintar:
 *   **así**   → negrita
 *   - algo    → lista (una línea por punto)
 *   1. algo   → lista numerada
 * Los botones solo las ponen por ti alrededor de lo seleccionado.
 */
export default function BarraFormato({
  campo,
  valor,
  cambiar,
  bloqueado = false,
}: {
  campo: React.RefObject<HTMLTextAreaElement | null>;
  valor: string;
  cambiar: (v: string) => void;
  bloqueado?: boolean;
}) {
  /** Cambia el texto y deja seleccionado lo que toca. */
  function aplicar(nuevo: string, desde: number, hasta: number) {
    cambiar(nuevo);
    sonar("tecla");
    requestAnimationFrame(() => {
      const t = campo.current;
      if (!t) return;
      t.focus();
      t.setSelectionRange(desde, hasta);
    });
  }

  function negrita() {
    const t = campo.current;
    if (!t) return;
    const { selectionStart: a, selectionEnd: b } = t;
    const elegido = valor.slice(a, b);
    // Ya en negrita: se quita.
    if (valor.slice(a - 2, a) === "**" && valor.slice(b, b + 2) === "**") {
      aplicar(valor.slice(0, a - 2) + elegido + valor.slice(b + 2), a - 2, b - 2);
      return;
    }
    const dentro = elegido || "texto";
    aplicar(valor.slice(0, a) + `**${dentro}**` + valor.slice(b), a + 2, a + 2 + dentro.length);
  }

  function lista(numerada: boolean) {
    const t = campo.current;
    if (!t) return;
    // Las líneas enteras que toca la selección.
    const a = valor.lastIndexOf("\n", t.selectionStart - 1) + 1;
    const finLinea = valor.indexOf("\n", t.selectionEnd);
    const b = finLinea === -1 ? valor.length : finLinea;
    const lineas = valor.slice(a, b).split("\n");
    const marca = numerada ? /^\d+\.\s/ : /^[-•]\s/;
    const yaLo = lineas.every((l) => marca.test(l));
    const nuevas = yaLo
      ? lineas.map((l) => l.replace(marca, ""))
      : lineas.map((l, i) => `${numerada ? `${i + 1}.` : "-"} ${l.replace(/^(\d+\.|[-•])\s/, "")}`);
    const bloque = nuevas.join("\n");
    // Una lista nueva va separada del párrafo de antes.
    let antes = valor.slice(0, a);
    if (!yaLo && antes && !antes.endsWith("\n\n")) {
      antes = antes.endsWith("\n") ? `${antes}\n` : `${antes}\n\n`;
    }
    aplicar(antes + bloque + valor.slice(b), antes.length + bloque.length, antes.length + bloque.length);
  }

  return (
    <div className="fp-formato" role="toolbar" aria-label="Formato del texto">
      <button type="button" className="fp-formato-boton" disabled={bloqueado} onClick={negrita} title="Negrita (**texto**)" aria-label="Negrita">
        <Bold size={16} strokeWidth={2.8} aria-hidden="true" />
      </button>
      <button type="button" className="fp-formato-boton" disabled={bloqueado} onClick={() => lista(false)} title="Lista (- punto)" aria-label="Lista">
        <List size={17} strokeWidth={2.6} aria-hidden="true" />
      </button>
      <button type="button" className="fp-formato-boton" disabled={bloqueado} onClick={() => lista(true)} title="Lista numerada (1. punto)" aria-label="Lista numerada">
        <ListOrdered size={17} strokeWidth={2.6} aria-hidden="true" />
      </button>
    </div>
  );
}
