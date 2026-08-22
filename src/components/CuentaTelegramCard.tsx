"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Check, ExternalLink, Loader2, Unlink } from "lucide-react";

type Props = {
  initialLinked: boolean;
  initialUsername: string | null;
  isPremium: boolean;
  inviteLink: string | null;
};

export default function CuentaTelegramCard({ initialLinked, initialUsername, isPremium, inviteLink }: Props) {
  const [linked, setLinked] = useState(initialLinked);
  const [username, setUsername] = useState(initialUsername);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setWaiting(false);
  }

  async function connect() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/telegram/link", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar el enlace");

      window.open(data.deepLink, "_blank", "noopener,noreferrer");
      setWaiting(true);

      let attempts = 0;
      pollRef.current = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await fetch("/api/telegram/status");
          const statusData = await statusRes.json();
          if (statusData.linked) {
            setLinked(true);
            setUsername(statusData.username);
            stopPolling();
          } else if (attempts >= 40) {
            stopPolling();
            setError("No hemos detectado la conexión. Si ya confirmaste en Telegram, recarga esta página.");
          }
        } catch {
          // Reintenta en el siguiente tick; si sigue fallando, el límite de
          // intentos de arriba corta el sondeo.
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    if (!confirm("¿Desvincular tu cuenta de Telegram? Si estabas dentro del canal, se te expulsará.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/telegram/unlink", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo desvincular");
      stopPolling();
      setLinked(false);
      setUsername(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cuenta-card">
      <div className="cuenta-card-header">
        <Send size={18} />
        <h2>Comunidad en Telegram</h2>
      </div>

      {linked ? (
        <>
          <div className="cuenta-info-list">
            <div className="cuenta-info-row">
              <span className="cuenta-info-label">Cuenta vinculada</span>
              <span className="cuenta-info-value">
                <Check size={13} className="cuenta-tg-check" />
                {username ? `@${username}` : "Sí"}
              </span>
            </div>
          </div>

          {isPremium ? (
            inviteLink ? (
              <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="cuenta-btn-manage">
                <Send size={15} />
                Solicitar entrada al canal
                <ExternalLink size={15} className="cuenta-btn-arrow" />
              </a>
            ) : (
              <p className="cuenta-manage-hint">El enlace de invitación aún no está configurado.</p>
            )
          ) : (
            <p className="cuenta-manage-hint">Hazte Premium para poder entrar al canal privado.</p>
          )}

          <button type="button" onClick={disconnect} disabled={busy} className="cuenta-btn-change-pw">
            <Unlink size={13} className="cuenta-tg-inline-icon" />
            Desvincular cuenta
          </button>
        </>
      ) : (
        <>
          <p className="cuenta-no-plan">
            Vincula tu cuenta de Telegram para que el acceso al canal Premium se gestione solo:
            entras al hacerte Premium y sales automáticamente si cancelas.
          </p>
          <button type="button" onClick={connect} disabled={busy} className="cuenta-btn-manage cuenta-btn-manage--as-button">
            {busy ? <Loader2 size={15} className="cuenta-tg-spin" /> : <Send size={15} />}
            Conectar Telegram
          </button>
          {waiting && (
            <p className="cuenta-manage-hint">
              <Loader2 size={12} className="cuenta-tg-spin cuenta-tg-inline-icon" />
              Esperando a que confirmes en Telegram…
            </p>
          )}
        </>
      )}

      {error && <p className="cuenta-portal-error">{error}</p>}
    </div>
  );
}
