"use client";

import { useSyncExternalStore } from "react";
import { Send, X } from "lucide-react";
import { TELEGRAM_CANAL_FREE_URL } from "@/lib/contacto";

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
 *
 * ── A dónde lleva (cambiado el 06-09-2026) ─────────────────────────────────
 * Llevaba al BOT, y el texto prometía «únete a la comunidad o escríbeme
 * personalmente»: un bot no es ninguna de las dos cosas. Quien llegaba se
 * encontraba un menú de opciones en vez de gente hablando, que es lo peor que
 * le puede pasar al único aviso permanente de la portada.
 *
 * Ahora va al canal gratuito. El bot no se enlaza desde la web: a quien paga se
 * le lleva a él desde el flujo de la suscripción, donde sí tiene sentido.
 */
export default function TelegramBanner() {
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
            <span>Guías y vídeos nuevos, en el canal gratuito de Telegram</span>
          </p>

          <a
            href={TELEGRAM_CANAL_FREE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="tg-banner-btn"
          >
            <Send size={15} aria-hidden="true" />
            {/*
             * Dos etiquetas para el mismo botón, y no es un capricho.
             *
             * En pantalla ancha el botón dice la acción («entrar al canal»)
             * porque el destino ya se lee entero en la línea de al lado. En
             * móvil esa línea no cabe, así que el botón tiene que decir el
             * DESTINO: era el único sitio de la banda donde podía aparecer la
             * palabra «Telegram», y sin ella el aviso no decía a dónde llevaba.
             */}
            <span className="tg-banner-btn-ancho">Entrar al canal</span>
            <span className="tg-banner-btn-movil">Telegram</span>
          </a>

          <button type="button" onClick={cerrar} className="tg-banner-close" aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  );
}
