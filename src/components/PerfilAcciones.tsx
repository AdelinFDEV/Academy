"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ChevronDown, KeyRound, LogOut, ShieldAlert, ShieldCheck, Trash2, UserRound } from "lucide-react";
import TwoFactorSettings from "@/components/TwoFactorSettings";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import DeleteAccountModal from "@/components/DeleteAccountModal";
import Tecla from "@/components/cuaderno/Tecla";
import LogoutButton from "@/components/LogoutButton";
import { sonar } from "@/lib/sonidos";

/**
 * Las acciones de cuenta de «Mi perfil» que necesitan navegador: la
 * verificación en dos pasos, la contraseña, cerrar sesión y eliminar la cuenta.
 *
 * Desde el 06-11-2026 /cuenta no existe como página (redirige aquí): todo lo
 * que hacía vive en «Mi perfil». La lógica sigue en los mismos componentes
 * de siempre (`TwoFactorSettings`, `ChangePasswordModal`,
 * `DeleteAccountModal`); aquí solo cambia cómo se presentan.
 */

/**
 * La verificación en dos pasos. Si NO está activada, la fila se destaca con
 * suavidad y su botón dice «Activar»; si lo está, sale confirmada y sin
 * llamar la atención. Al pulsar, se despliega el asistente de siempre debajo.
 */
export function Fila2FA({ activada }: { activada: boolean }) {
  const router = useRouter();
  const [abierta, setAbierta] = useState(false);

  return (
    <div className={`mp-2fa${activada ? " is-activada" : ""}${abierta ? " is-abierta" : ""}`}>
      <div className="mp-2fa-fila">
        <span className={`mp-fila-icono ${activada ? "tono-menta" : "tono-amarillo"}`} aria-hidden="true">
          {activada ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
        </span>
        <span className="mp-fila-texto">
          <strong>
            Verificación en dos pasos
            {activada
              ? <span className="pn-chip tono-menta"><Check size={11} strokeWidth={3.2} aria-hidden="true" /> Activada</span>
              : <span className="pn-chip tono-amarillo">Recomendado</span>}
          </strong>
          <span>
            {activada
              ? "Al entrar se te pide un código de tu app de autenticación."
              : "Además de la contraseña, un código de tu móvil al entrar. Si alguien la consigue, sigue sin poder entrar. Se activa en un minuto."}
          </span>
        </span>
        <Tecla
          color={activada || abierta ? "blanca" : "amarillo"}
          tamano="peq"
          className="mp-fila-accion"
          onClick={() => {
            sonar(abierta ? "cerrar" : "abrir");
            setAbierta(!abierta);
          }}
          aria-expanded={abierta}
          aria-controls="mp-2fa-panel"
        >
          {abierta ? "Cerrar" : activada ? "Gestionar" : "Activar"}
          {abierta ? <ChevronDown size={15} className="mp-girada" aria-hidden="true" /> : <ArrowRight size={15} aria-hidden="true" />}
        </Tecla>
      </div>
      {abierta && (
        <div className="mp-desplegado" id="mp-2fa-panel">
          <TwoFactorSettings onCambio={() => router.refresh()} />
        </div>
      )}
    </div>
  );
}

/** La contraseña: la fila abre el mismo modal que había en /cuenta. */
export function FilaPassword({ email }: { email: string }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <div className="mp-fila">
        <span className="mp-fila-icono tono-gris" aria-hidden="true"><KeyRound size={18} /></span>
        <span className="mp-fila-texto">
          <strong>Contraseña</strong>
          <span>{email}</span>
        </span>
        <Tecla color="blanca" tamano="peq" className="mp-fila-accion" onClick={() => setAbierto(true)}>
          Cambiar <ArrowRight size={14} aria-hidden="true" />
        </Tecla>
      </div>
      {abierto && <ChangePasswordModal open onClose={() => setAbierto(false)} />}
    </>
  );
}

/** Cerrar sesión en este dispositivo: el mismo LogoutButton de los menús, vestido de tecla. */
export function FilaSesion() {
  return (
    <div className="mp-fila">
      <span className="mp-fila-icono tono-gris" aria-hidden="true"><UserRound size={18} /></span>
      <span className="mp-fila-texto">
        <strong>Sesión</strong>
        <span>Sal de tu cuenta en este dispositivo. Tu progreso se queda guardado.</span>
      </span>
      <LogoutButton tecla={{ color: "blanca", tamano: "peq" }} className="mp-fila-accion">
        Cerrar sesión <LogOut size={14} aria-hidden="true" />
      </LogoutButton>
    </div>
  );
}

/** Eliminar la cuenta: la fila abre el modal de confirmación de siempre. */
export function FilaEliminar({ esPremium }: { esPremium: boolean }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <>
      <div className="mp-fila is-peligro">
        <span className="mp-fila-icono tono-coral" aria-hidden="true"><Trash2 size={18} /></span>
        <span className="mp-fila-texto">
          <strong>Eliminar la cuenta</strong>
          <span>
            Borra tu perfil, tu progreso y tus datos para siempre
            {esPremium ? ", y cancela tu suscripción al instante" : ""}. No se puede deshacer.
          </span>
        </span>
        <Tecla color="coral" tamano="peq" className="mp-fila-accion" onClick={() => setAbierto(true)}>
          Eliminar <ArrowRight size={14} aria-hidden="true" />
        </Tecla>
      </div>
      {abierto && <DeleteAccountModal open onClose={() => setAbierto(false)} isPremium={esPremium} />}
    </>
  );
}
