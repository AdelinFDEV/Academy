"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, Loader2, AtSign } from "lucide-react";
import AvatarUsuario from "@/components/AvatarUsuario";
import { ALIAS_MAX, AVATARES, AVATAR_ADMIN, problemaDelAlias } from "@/lib/perfilPublico";

type Estado = { tipo: "nada" } | { tipo: "guardando" } | { tipo: "ok" } | { tipo: "error"; texto: string };

/**
 * El editor del perfil público: la foto, el alias y cómo se verá en el foro.
 *
 * Valida mientras se escribe con la misma regla que el servidor
 * (`@/lib/perfilPublico`), solo para avisar antes: quien decide es
 * /api/perfil. Al guardar refresca la página, y con ella la barra de arriba,
 * que enseña la foto nueva sin recargar.
 */
export default function PerfilEditor({
  inicial,
  aliasInicial,
  avatarInicial,
  diasParaCambiar,
  tieneAlias,
  esPremium,
  esAdmin = false,
  premiumDesde,
  activo,
}: {
  inicial: string;
  aliasInicial: string;
  avatarInicial: string | null;
  diasParaCambiar: number;
  tieneAlias: boolean;
  esPremium: boolean;
  /** Solo el admin puede llevar un alias como AdelinBTC. */
  esAdmin?: boolean;
  premiumDesde: string | null;
  activo: boolean;
}) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(avatarInicial);
  const [alias, setAlias] = useState(aliasInicial);
  const [estado, setEstado] = useState<Estado>({ tipo: "nada" });

  const limpio = alias.trim();
  const aliasCambiado = limpio !== aliasInicial;
  // Cambiar solo mayúsculas no gasta el plazo (igual que en el servidor).
  const cambiaIdentidad = aliasCambiado && limpio.toLowerCase() !== aliasInicial.toLowerCase();
  const bloqueadoPorPlazo = tieneAlias && diasParaCambiar > 0;
  const problema = limpio && aliasCambiado ? problemaDelAlias(limpio, { esAdmin }) : null;
  const hayCambios = aliasCambiado || avatar !== avatarInicial;
  const puedeGuardar =
    activo && hayCambios && estado.tipo !== "guardando" && !problema &&
    !(cambiaIdentidad && bloqueadoPorPlazo) && !(aliasCambiado && !limpio);

  async function guardar() {
    if (!puedeGuardar) return;
    setEstado({ tipo: "guardando" });
    const cuerpo: { alias?: string; avatar?: string | null } = {};
    if (aliasCambiado) cuerpo.alias = limpio;
    if (avatar !== avatarInicial) cuerpo.avatar = avatar;
    try {
      const r = await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const datos = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setEstado({ tipo: "error", texto: datos.error ?? "No se pudo guardar." });
        return;
      }
      setEstado({ tipo: "ok" });
      router.refresh();
    } catch {
      setEstado({ tipo: "error", texto: "Sin conexión. Inténtalo de nuevo." });
    }
  }

  const aliasVista = limpio && !problema ? limpio : aliasInicial || "tu_alias";

  return (
    <div className="mp-panel mp-editor">
      <div className="mp-editor-campos">
        {/* ── La foto ── */}
        <fieldset className="mp-campo" disabled={!activo}>
          <legend className="mp-campo-titulo">Foto de perfil</legend>
          <div className="mp-fotos" role="radiogroup" aria-label="Foto de perfil">
            {/* La foto real del admin solo se le ofrece a él (ver AVATAR_ADMIN). */}
            {(esAdmin ? [AVATAR_ADMIN, ...AVATARES] : AVATARES).map((v) => {
              const elegida = avatar === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  role="radio"
                  aria-checked={elegida}
                  className={`mp-foto${elegida ? " is-elegida" : ""}`}
                  onClick={() => { setAvatar(v.id); setEstado({ tipo: "nada" }); }}
                >
                  <span className="mp-foto-marco">
                    <AvatarUsuario avatar={v.id} inicial={inicial} className="mp-foto-img" />
                    {elegida && <span className="mp-foto-check" aria-hidden="true"><Check size={11} strokeWidth={3.4} /></span>}
                  </span>
                  <span className="mp-foto-nombre">{v.nombre}</span>
                </button>
              );
            })}
            <button
              type="button"
              role="radio"
              aria-checked={avatar === null}
              className={`mp-foto${avatar === null ? " is-elegida" : ""}`}
              onClick={() => { setAvatar(null); setEstado({ tipo: "nada" }); }}
            >
              <span className="mp-foto-marco">
                <AvatarUsuario avatar={null} inicial={inicial} className="mp-foto-img mp-foto-inicial" />
                {avatar === null && <span className="mp-foto-check" aria-hidden="true"><Check size={11} strokeWidth={3.4} /></span>}
              </span>
              <span className="mp-foto-nombre">Inicial</span>
            </button>
          </div>
        </fieldset>

        {/* ── El alias ── */}
        <div className="mp-campo">
          <label className="mp-campo-titulo" htmlFor="mp-alias">Alias</label>
          <div className={`mp-alias${problema ? " is-error" : ""}`}>
            <AtSign size={16} aria-hidden="true" />
            <input
              id="mp-alias"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={ALIAS_MAX}
              placeholder="satoshi_21"
              value={alias}
              disabled={!activo}
              onChange={(e) => { setAlias(e.target.value.replace(/\s/g, "")); setEstado({ tipo: "nada" }); }}
              aria-describedby="mp-alias-ayuda"
              aria-invalid={!!problema}
            />
            <span className="mp-alias-cuenta">{limpio.length}/{ALIAS_MAX}</span>
          </div>
          <p className={`mp-ayuda${problema || (cambiaIdentidad && bloqueadoPorPlazo) ? " is-error" : ""}`} id="mp-alias-ayuda">
            {problema
              ?? (cambiaIdentidad && bloqueadoPorPlazo
                ? `Podrás cambiarlo dentro de ${diasParaCambiar} ${diasParaCambiar === 1 ? "día" : "días"}.`
                : tieneAlias
                  ? "Puedes cambiarlo una vez cada 30 días."
                  : "De 3 a 20 caracteres: letras sin tilde, números, _ y punto. Único en toda la web.")}
          </p>
        </div>
      </div>

      {/* ── La vista previa: así te verán en el foro ── */}
      <div className="mp-vista" aria-label="Vista previa en el foro">
        <span className="mp-vista-etiqueta">Vista previa en el foro</span>
        <div className="mp-vista-mensaje">
          <div className="mp-vista-autor">
            <AvatarUsuario avatar={avatar} inicial={(aliasVista.charAt(0) || inicial).toUpperCase()} className="mp-vista-foto" />
            <span className="mp-vista-quien">
              <span className="mp-vista-alias">@{aliasVista}</span>
              {esPremium ? (
                <span className="mp-chip is-oro"><Crown size={11} aria-hidden="true" /> Premium{premiumDesde ? ` · desde ${premiumDesde}` : ""}</span>
              ) : (
                <span className="mp-chip">Miembro</span>
              )}
            </span>
          </div>
          <span className="mp-vista-linea" />
          <span className="mp-vista-linea mp-vista-linea--media" />
          <span className="mp-vista-linea mp-vista-linea--corta" />
        </div>
      </div>

      {/* ── Guardar ── */}
      <div className="mp-editor-pie">
        <span className="mp-estado" role="status" aria-live="polite">
          {estado.tipo === "ok" && <span className="is-ok"><Check size={14} strokeWidth={3} aria-hidden="true" /> Cambios guardados</span>}
          {estado.tipo === "error" && <span className="is-error">{estado.texto}</span>}
          {estado.tipo === "nada" && hayCambios && <span className="is-pendiente">Tienes cambios sin guardar</span>}
        </span>
        <button type="button" className="mp-guardar" onClick={guardar} disabled={!puedeGuardar}>
          {estado.tipo === "guardando" ? <><Loader2 size={15} className="mp-girando" aria-hidden="true" /> Guardando…</> : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
