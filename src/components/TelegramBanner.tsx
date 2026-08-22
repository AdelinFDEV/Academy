"use client";

import { useSyncExternalStore } from "react";
import { Send, X } from "lucide-react";

const CLAVE_CERRADO = "tg-banner-cerrado";

/*
 * El estado vive en sessionStorage, no en React, así que se lee con
 * useSyncExternalStore en vez de con useEffect + setState. Además de ser lo
 * que React recomienda para fuentes externas, evita dos problemas concretos:
 * el parpadeo de pintar la banda y esconderla justo después a quien ya la
 * cerró, y el aviso de "setState dentro de un efecto".
 */
const oyentes = new Set<() => void>();

function suscribir(alCambiar: () => void) {
  oyentes.add(alCambiar);
  return () => {
    oyentes.delete(alCambiar);
  };
}

function estaCerrado(): boolean {
  return sessionStorage.getItem(CLAVE_CERRADO) === "1";
}

/** En el servidor no hay sessionStorage: se asume cerrada para que el HTML
 *  inicial no la incluya y no haya desajuste de hidratación. */
function estaCerradoEnServidor(): boolean {
  return true;
}

function cerrar() {
  sessionStorage.setItem(CLAVE_CERRADO, "1");
  oyentes.forEach((avisar) => avisar());
}

/**
 * Banda fija en la parte inferior de la home invitando a la comunidad de
 * Telegram. Fija de verdad: no aparece al hacer scroll ni tras un temporizador,
 * está siempre a mano.
 *
 * Se recuerda en sessionStorage y no en localStorage a propósito: durante la
 * visita no vuelve a molestar, pero en la siguiente reaparece. Con localStorage
 * desaparecería para siempre tras un solo clic y se perdería el canal.
 */
export default function TelegramBanner({ botUsername }: { botUsername: string }) {
  const cerrado = useSyncExternalStore(suscribir, estaCerrado, estaCerradoEnServidor);

  if (cerrado) return null;

  return (
    <>
      {/* Al ser fija, la banda taparía la última línea del footer cuando se
          llega abajo del todo. Este hueco le devuelve el sitio. */}
      <div className="tg-banner-hueco" aria-hidden="true" />

      <div className="tg-banner" role="complementary" aria-label="Comunidad de Telegram">
        <div className="tg-banner-inner">
          <span className="tg-banner-icon" aria-hidden="true">
            <Send size={17} />
          </span>

          <p className="tg-banner-text">
            <strong>Únete a la comunidad</strong>
            <span>o escríbeme personalmente por Telegram</span>
          </p>

          <a
            href={`https://t.me/${botUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tg-banner-btn"
          >
            <Send size={15} aria-hidden="true" />
            Abrir en Telegram
          </a>

          <button type="button" onClick={cerrar} className="tg-banner-close" aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
