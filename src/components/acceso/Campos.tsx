"use client";

import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, Eye, EyeOff, Info, X } from "lucide-react";
import Tecla from "@/components/cuaderno/Tecla";
import { passwordChecks } from "@/lib/passwordRules";
import { sonar } from "@/lib/sonidos";

/**
 * Las piezas de los formularios de acceso, como en disenos/sistema.html
 * («Formularios» y «Avisos»). Solo aspecto: la lógica de cada formulario sigue
 * en su página.
 */

type PropsInput = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">;

interface PropsCampo extends PropsInput {
  id: string;
  etiqueta: string;
  /** La ayuda a mano bajo el campo. Se le asocia con `aria-describedby`. */
  ayuda?: ReactNode;
  /** Algo a la derecha de la etiqueta (el «¿La has olvidado?»). */
  extra?: ReactNode;
  /** Otro id que describa el campo (la lista de requisitos de la contraseña). */
  describe?: string;
  claseInput?: string;
  /** Una tecla pegada al campo (mostrar u ocultar la contraseña). */
  accion?: ReactNode;
  inputRef?: React.Ref<HTMLInputElement>;
}

export function Campo({ id, etiqueta, ayuda, extra, describe, claseInput, accion, inputRef, ...input }: PropsCampo) {
  const descritoPor = [ayuda ? `${id}-ayuda` : null, describe ?? null].filter(Boolean).join(" ") || undefined;
  const campo = (
    <input
      id={id}
      ref={inputRef}
      className={`acc-input${claseInput ? ` ${claseInput}` : ""}`}
      aria-describedby={descritoPor}
      {...input}
    />
  );

  return (
    <div className="acc-campo">
      <div className="acc-campo-cabeza">
        <label htmlFor={id}>{etiqueta}</label>
        {extra}
      </div>
      {accion ? (
        <div className="acc-control">
          {campo}
          {accion}
        </div>
      ) : (
        campo
      )}
      {ayuda && (
        <span id={`${id}-ayuda`} className="acc-ayuda">
          {ayuda}
        </span>
      )}
    </div>
  );
}

/** Campo de contraseña con su tecla para verla u ocultarla. */
export function CampoClave(props: Omit<PropsCampo, "type" | "accion">) {
  const [visible, setVisible] = useState(false);
  return (
    <Campo
      {...props}
      type={visible ? "text" : "password"}
      accion={
        <Tecla
          color="blanca"
          icono
          className="acc-ojo"
          aria-label="Mostrar contraseña"
          aria-pressed={visible}
          aria-controls={props.id}
          onClick={() => setVisible((v) => !v)}
        >
          {/* Tachado mientras la contraseña está oculta; abierto cuando se ve (18-11-2026). */}
          {visible ? <Eye size={20} aria-hidden="true" /> : <EyeOff size={20} aria-hidden="true" />}
        </Tecla>
      }
    />
  );
}

/** Lo que le falta a la contraseña, tachándose en vivo como una lista de tareas. */
export function RequisitosClave({ id, password }: { id: string; password: string }) {
  return (
    <div className="acc-req">
      <p id={`${id}-titulo`} className="acc-req-titulo">
        Tu contraseña necesita
      </p>
      <ul id={id} aria-labelledby={`${id}-titulo`} aria-live="polite">
        {passwordChecks(password).map((req) => (
          <li key={req.label} className={req.ok ? "is-ok" : ""}>
            <span className="acc-req-caja" aria-hidden="true">
              <Check size={14} strokeWidth={3.5} />
            </span>
            {req.label}
            <span className="sr-only">{req.ok ? ": cumplido" : ": pendiente"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * El golpe sordo de `error` cada vez que el formulario estrena un mensaje de
 * error. Solo para estados que se escriben al enviar (nunca al cargar la
 * página), para que nada suene sin que la persona haya hecho algo.
 */
export function useSonidoDeError(error: string) {
  useEffect(() => {
    if (error) sonar("error");
  }, [error]);
}

export type TipoAviso = "info" | "ok" | "error";

/**
 * Un aviso del sistema de diseño. El de error se anuncia al instante
 * (`role="alert"`); los demás, cuando el lector de pantalla termina (`status`).
 */
export function Aviso({ tipo, titulo, children }: { tipo: TipoAviso; titulo: string; children?: ReactNode }) {
  const icono =
    tipo === "ok" ? <Check size={20} strokeWidth={3} /> : tipo === "error" ? <X size={20} strokeWidth={3} /> : <Info size={20} strokeWidth={3} />;
  return (
    <div className={`acc-aviso acc-aviso--${tipo}`} role={tipo === "error" ? "alert" : "status"}>
      <span className="acc-aviso-ic" aria-hidden="true">
        {icono}
      </span>
      <span>
        <b>{titulo}</b>
        {children}
      </span>
    </div>
  );
}

/** La raya discontinua con su nota a mano entre el formulario y Google. */
export function Separador({ children }: { children: ReactNode }) {
  return (
    <p className="acc-separador">
      <span>{children}</span>
    </p>
  );
}

/** La «G» de Google en sus cuatro colores: la tecla de Google lleva su marca. */
export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
