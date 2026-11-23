"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MessageCircle, Search, X } from "lucide-react";
import { aspectoDe, colorDe } from "@/components/foro/categorias";
import type { HiloSugerido } from "@/lib/foro/tipos";
import { sonar } from "@/lib/sonidos";

/**
 * El buscador del foro (23-11-2026): antes de preguntar, mira si tu duda ya
 * está respondida.
 *
 * Es un formulario de verdad (`GET /foro/buscar?q=…`): sin JavaScript, Intro
 * lleva a la página de resultados. Con él, mientras se escribe salen debajo
 * las preguntas que coinciden (`/api/foro/buscar`, solo lo publicado), que se
 * recorren con las flechas y se abren con Intro.
 *
 * Lo que se escribe viaja como texto y el servidor lo convierte en palabras
 * sueltas: aquí no se construye ninguna consulta.
 */

const MAXIMO = 80;

export default function BuscadorForo({ inicial = "", enfocar = false }: { inicial?: string; enfocar?: boolean }) {
  const router = useRouter();
  const id = useId();
  const caja = useRef<HTMLFormElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState(inicial);
  const [hilos, setHilos] = useState<HiloSugerido[] | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);

  const consulta = texto.trim();

  // Las sugerencias, un momento después de dejar de teclear. Cada petición
  // nueva deja sin efecto a la anterior: nunca pinta una respuesta vieja.
  useEffect(() => {
    if (consulta.length < 2 || consulta === inicial.trim()) {
      // Sin nada que buscar (o lo mismo que ya se ve en la página): sin lista.
      const t = setTimeout(() => setHilos(null), 0);
      return () => clearTimeout(t);
    }
    const corte = new AbortController();
    const espera = setTimeout(() => {
      fetch(`/api/foro/buscar?q=${encodeURIComponent(consulta)}`, { cache: "no-store", signal: corte.signal })
        .then((r) => r.json())
        .then((d: unknown) => {
          const r = d as { ok?: boolean; hilos?: unknown };
          setHilos(r.ok === true && Array.isArray(r.hilos) ? (r.hilos as HiloSugerido[]) : []);
          setActiva(-1);
        })
        .catch(() => { /* Abortada o sin red: se queda lo que hubiera. */ });
    }, 260);
    return () => { clearTimeout(espera); corte.abort(); };
  }, [consulta, inicial]);

  // Cerrar al tocar fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("pointerdown", fuera);
    return () => document.removeEventListener("pointerdown", fuera);
  }, [abierto]);

  const lista = abierto && hilos !== null && consulta.length >= 2 ? hilos : null;
  // Las filas que se recorren con las flechas: cada hilo y, al final, «ver todos».
  const filas = lista ? lista.length + 1 : 0;

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      if (abierto && lista) { e.preventDefault(); setAbierto(false); }
      return;
    }
    if (!lista) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const paso = e.key === "ArrowDown" ? 1 : -1;
      setActiva((n) => {
        const siguiente = n + paso;
        return siguiente < -1 ? filas - 1 : siguiente >= filas ? -1 : siguiente;
      });
    } else if (e.key === "Enter" && activa >= 0 && activa < lista.length) {
      e.preventDefault();
      const h = lista[activa];
      sonar("elegir");
      router.push(`/foro/${h.id}-${h.slug}`);
    }
    // Intro sin fila elegida (o en «ver todos»): se envía el formulario.
  }

  return (
    <form
      ref={caja}
      className={`fb${lista ? " is-abierto" : ""}`}
      action="/foro/buscar"
      method="get"
      role="search"
      aria-label="Buscar en el foro"
      onSubmit={() => { sonar("elegir"); setAbierto(false); }}
    >
      <label htmlFor={id} className="sr-only">Buscar en el foro</label>
      <span className="fb-lupa" aria-hidden="true"><Search size={20} strokeWidth={2.8} /></span>
      <input
        ref={campo}
        id={id}
        name="q"
        type="search"
        className="fb-campo"
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
        onFocus={() => setAbierto(true)}
        // Con el foco ya puesto (tras cerrar con Esc), tocar la caja la vuelve a abrir.
        onClick={() => setAbierto(true)}
        onKeyDown={alTeclear}
        maxLength={MAXIMO}
        placeholder="Busca tu duda: staking, impuestos, wallet…"
        autoComplete="off"
        enterKeyHint="search"
        // Solo en la página de resultados sin búsqueda: es a lo que se viene.
        autoFocus={enfocar}
        aria-controls={lista ? `${id}-lista` : undefined}
        aria-activedescendant={lista && activa >= 0 ? `${id}-f${activa}` : undefined}
      />
      {texto !== "" && (
        <button
          type="button"
          className="fb-borrar"
          aria-label="Borrar la búsqueda"
          onClick={() => { sonar("cerrar"); setTexto(""); setHilos(null); campo.current?.focus(); }}
        >
          <X size={16} strokeWidth={3} aria-hidden="true" />
        </button>
      )}
      <button type="submit" className="fb-boton" disabled={consulta.length < 2}>
        Buscar
      </button>

      {lista && (
        <div className="fb-lista" id={`${id}-lista`} role="listbox" aria-label="Preguntas que coinciden">
          {lista.length === 0 ? (
            <p className="fb-vacio">
              <b>Nadie lo ha preguntado todavía.</b>
              <span>Prueba con otras palabras, o pregúntalo tú.</span>
            </p>
          ) : (
            lista.map((h, i) => {
              const { Icono } = aspectoDe(h.categoria.slug);
              return (
                <a
                  key={h.id}
                  id={`${id}-f${i}`}
                  role="option"
                  aria-selected={i === activa}
                  href={`/foro/${h.id}-${h.slug}`}
                  className={`fb-fila${i === activa ? " is-activa" : ""}`}
                  style={colorDe(h.categoria.slug)}
                  onPointerEnter={() => setActiva(i)}
                >
                  <span className="fb-fila-icono" aria-hidden="true"><Icono size={16} strokeWidth={2.5} /></span>
                  <span className="fb-fila-texto">
                    <b>{h.titulo}</b>
                    <small>{h.categoria.nombre}</small>
                  </span>
                  <span className={`fb-fila-estado${h.resuelto ? " is-resuelta" : ""}`}>
                    {h.resuelto ? <Check size={13} strokeWidth={3.4} aria-hidden="true" /> : <MessageCircle size={13} strokeWidth={2.8} aria-hidden="true" />}
                    {h.resuelto ? "resuelta" : h.respuestas}
                  </span>
                </a>
              );
            })
          )}
          <button
            type="submit"
            id={`${id}-f${lista.length}`}
            role="option"
            aria-selected={activa === lista.length}
            className={`fb-todos${activa === lista.length ? " is-activa" : ""}`}
            onPointerEnter={() => setActiva(lista.length)}
          >
            Ver todos los resultados de «{consulta}»
            <ArrowRight size={16} strokeWidth={2.8} aria-hidden="true" />
          </button>
        </div>
      )}
    </form>
  );
}
