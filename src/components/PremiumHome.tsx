import { ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { INSTAGRAM_DM_URL } from "@/lib/contacto";
import { AVATAR_ADMIN } from "@/lib/perfilPublico";
import { PREGUNTAS_FRECUENTES } from "@/lib/preguntas-frecuentes";
import { InstagramIcon } from "@/components/SocialLinks";
import Tecla from "@/components/cuaderno/Tecla";
import "./premium-home.css";

/**
 * El cierre de la portada: las preguntas frecuentes y el contacto.
 *
 * Hasta el 18-11-2026 abría con el bloque oscuro de Premium (las tres piezas,
 * el precio y la oferta). El admin pidió quitarlo por completo de la portada,
 * en todos los dispositivos: Premium se presenta en /premium y en el menú.
 * Se borró con su código y sus estilos.
 *
 * Las preguntas salen de `preguntas-frecuentes.ts`, compartidas con /premium.
 */

/** El color de cada pregunta, en rueda: la tarjeta lo toma al abrirse. */
const COLORES_PREGUNTA = ["cielo", "lila", "azul", "menta", "naranja", "coral"] as const;

export default function PremiumHome({ isPremium }: { isPremium: boolean }) {
  const preguntas = PREGUNTAS_FRECUENTES.filter((p) => p.portada);

  return (
    <section id="preguntas-frecuentes" className="pf" aria-labelledby="pf-faq-titulo">
      <div className="pf-inner">
        {/* ── 2 · Preguntas frecuentes y contacto ─────────────────────────
            Cada pregunta es una tarjeta-tecla: se hunde al pulsarla y se abre
            con rebote. La altura la anima AcordeonesSuaves (layout raíz), que
            marca `data-acordeon` mientras abre o cierra: los estilos de
            «abierta» lo respetan para no cambiar de golpe al cerrar. */}
        <div className="pf-faq" id="preguntas">
          <div className="pf-faq-lado">
            <p className="pf-faq-nota">Dudas frecuentes</p>
            <h2 id="pf-faq-titulo" className="pf-faq-titulo">
              Lo que más me <span className="pf-faq-mano">preguntan</span>
            </h2>
            <p className="pf-faq-texto">Si la tuya no está, escríbeme. Te contesto yo, de tú a tú.</p>

            <div className="pf-contacto">
              <span className="pf-contacto-cab">
                <span className="pf-contacto-avatar" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element -- estático, 256 px, ya optimizado */}
                  <img src={AVATAR_ADMIN.src ?? ""} alt="" width={60} height={60} className="pf-contacto-foto" />
                  <span className="pf-contacto-online" />
                </span>
                <span className="pf-contacto-texto">
                  <strong>AdelinBTC</strong>
                  <small>@adelinbtc · en Instagram</small>
                </span>
              </span>
              <Tecla href={INSTAGRAM_DM_URL} target="_blank" rel="noopener noreferrer" prefetch={false} ancho className="pf-ig" aria-label="Escríbeme por Instagram">
                {/* En el móvil, «Instagram» a secas: en dos líneas no se leía (premium-home.css). */}
                <InstagramIcon size={18} /> <span className="pf-ig-largo">Escríbeme por Instagram</span><span className="pf-ig-corto">Instagram</span>
                <ArrowUpRight size={16} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            </div>

            {!isPremium && (
              <Tecla href="/premium" color="blanca" tamano="peq">
                Todas las preguntas en Premium <ArrowRight size={14} strokeWidth={2.6} aria-hidden="true" />
              </Tecla>
            )}
          </div>

          <div className="pf-faq-lista">
            {preguntas.map((p, i) => (
              <details
                key={p.q}
                className={`pf-pregunta pf-pregunta--${COLORES_PREGUNTA[i % COLORES_PREGUNTA.length]}`}
                open={i === 0}
              >
                <summary>
                  <span className="pf-pregunta-num" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <span className="pf-pregunta-q">{p.q}</span>
                  <span className="pf-pregunta-icono" aria-hidden="true"><Plus size={18} strokeWidth={3} /></span>
                </summary>
                <div className="pf-respuesta">
                  <p>{p.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
