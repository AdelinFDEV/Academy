"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Turnstile from "@/components/Turnstile";
import Tecla from "@/components/cuaderno/Tecla";
import AccesoShell from "@/components/acceso/AccesoShell";
import { Aviso, Campo, CampoClave, GoogleIcon, RequisitosClave, Separador, useSonidoDeError } from "@/components/acceso/Campos";
import { passwordChecks } from "@/lib/passwordRules";
import { MENSAJE_DOMINIO_NO_PERMITIDO, emailPermitido } from "@/lib/emailPolicy";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Same-origin-only "next" (open-redirect guard) — se anexa a los enlaces
  // de confirmación de email y de Google para no perder a dónde iba el
  // usuario (p.ej. /premium tras pulsar "Hazte Premium").
  function safeNext(): string | null {
    const next = searchParams.get("next");
    if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
    return next;
  }

  // Viene de pulsar «Hazte Premium»: al terminar va directo a Stripe.
  const vieneAPagar = safeNext() === "/api/checkout";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  // La ventanita que avisa de que solo valen Gmail y Proton Mail.
  const [avisoDominio, setAvisoDominio] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  useSonidoDeError(error);

  function resetCaptcha() {
    // El token de captcha es de un solo uso: se regenera tras cada intento.
    setCaptchaToken("");
    setCaptchaKey((k) => k + 1);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Antes que nada: si el dominio no vale, no gastamos ni el captcha ni una
    // llamada a Supabase. El bloqueo real lo hace el trigger de auth.users;
    // esto es para que el usuario entienda qué pasa en vez de ver un error
    // técnico de base de datos.
    if (!emailPermitido(email)) {
      setAvisoDominio(true);
      setLoading(false);
      return;
    }

    if (!passwordChecks(password).every((c) => c.ok)) {
      setError("La contraseña no cumple todos los requisitos indicados abajo.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    const next = safeNext();
    const callbackUrl = `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: callbackUrl,
        captchaToken,
      },
    });

    if (error) {
      resetCaptcha();
      // "Ya registrado" no se muestra tal cual: revelaría si ese email existe
      // en la base de datos (enumeración de usuarios). En su lugar mostramos
      // la misma pantalla de éxito que vería alguien registrándose de cero.
      if (/already|registrad/i.test(error.message)) {
        setSuccess(true);
        setLoading(false);
        return;
      }
      const rawMsg = error.message || "";

      // El trigger rechaza los alias del mismo buzón (los puntos y el "+tag"
      // de Gmail llegan todos al mismo sitio). Se trata igual que un email ya
      // registrado — misma pantalla de éxito — para no revelar qué cuentas
      // existen, que es la protección contra enumeración que ya había aquí.
      if (/alias/i.test(rawMsg)) {
        setSuccess(true);
        setLoading(false);
        return;
      }

      if (/gmail|proton/i.test(rawMsg)) {
        setError(MENSAJE_DOMINIO_NO_PERMITIDO);
        setLoading(false);
        return;
      }

      // Supabase envuelve los errores de trigger en un genérico "Database error
      // saving new user", así que aquí ya no se puede saber la causa exacta. Se
      // orienta hacia lo más probable sin dar por hecho nada.
      const isDbGeneric = /database error/i.test(rawMsg);

      const isPwPolicy =
        /password/i.test(rawMsg) && /(should contain|at least|character)/i.test(rawMsg);
      // Fallo opaco ("{}", vacío) o de envío de email (SMTP) → mensaje claro en
      // vez del error crudo. Deja el detalle real en consola para depurar.
      const isEmailSend =
        !rawMsg || rawMsg === "{}" || /(sending|smtp|confirmation email)/i.test(rawMsg);
      console.error("[register] signUp error:", error);
      setError(
        isPwPolicy
          ? "La contraseña no cumple todos los requisitos indicados abajo."
          : isDbGeneric
            ? "No hemos podido crear la cuenta con ese correo. Prueba con otra dirección de Gmail o Proton."
            : isEmailSend
              ? "No pudimos enviarte el correo de confirmación ahora mismo. Inténtalo de nuevo en unos minutos."
              : rawMsg
      );
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogle() {
    const next = safeNext();
    const callbackUrl = `${location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
  }

  if (success) {
    return (
      <AccesoShell nota="¡Ya casi está!" titulo={<>Revisa tu <span className="fluor">email</span></>}>
        <Aviso tipo="ok" titulo="Te hemos escrito">
          Te hemos enviado un enlace de confirmación a <strong>{email}</strong>. Ábrelo para activar tu cuenta
          {vieneAPagar ? " y pasarás directamente al pago." : "."}
        </Aviso>
        <Tecla href={safeNext() ? `/login?next=${encodeURIComponent(safeNext()!)}` : "/login"} tamano="grande" ancho>
          Volver al login
        </Tecla>
      </AccesoShell>
    );
  }

  return (
    <AccesoShell
      nota={vieneAPagar ? "Paso 1 de 2" : "Empieza aquí"}
      // La misma escena del inicio de sesión (18-11-2026), para que las dos
      // pantallas se vean iguales; con su flecha al formulario en el móvil.
      ilustracion="/cuaderno/login-pegatina.webp"
      // En el ordenador, «Tu contraseña necesita» va a la izquierda, bajo la
      // escena (18-11-2026, pedido por el admin); en el formulario se oculta.
      // Copia visual: la que leen los lectores de pantalla es la del formulario.
      lado={<RequisitosClave id="requisitos-clave-lado" password={password} />}
      titulo={
        vieneAPagar ? (
          <>Crea tu cuenta y pasas <span className="fluor">al pago</span></>
        ) : (
          <>Crea tu <span className="fluor">cuenta</span></>
        )
      }
     
    >
      {/* Quien viene a pagar ve Google primero: un clic, sin formulario y sin
          esperar el email de confirmación. Es el camino más corto al pago. */}
      {vieneAPagar && (
        <>
          <Tecla color="blanca" ancho onClick={handleGoogle}>
            <GoogleIcon />
            Continuar con Google
          </Tecla>
          <Separador>o con tu email</Separador>
        </>
      )}

      <form onSubmit={handleRegister} className="acc-form">
        <Campo
          id="fullName"
          name="name"
          etiqueta="Nombre completo"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Tu nombre"
          required
        />

        <Campo
          id="email"
          name="email"
          etiqueta="Tu correo"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@gmail.com"
          required
          // Sin nota fija (18-11-2026, pedido por el admin): si el correo es de
          // otro proveedor, se avisa en una ventanita al salir del campo.
          onBlur={() => { if (email.includes("@") && !emailPermitido(email)) setAvisoDominio(true); }}
        />

        <CampoClave
          id="password"
          name="new-password"
          etiqueta="Contraseña"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          describe="requisitos-clave"
          required
        />

        <CampoClave
          id="confirmPassword"
          name="confirm-password"
          etiqueta="Confirmar contraseña"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite tu contraseña"
          required
        />

        <div className="acc-req-form"><RequisitosClave id="requisitos-clave" password={password} /></div>

        {error && (
          <Aviso tipo="error" titulo="No se ha creado la cuenta">
            {error}
          </Aviso>
        )}

        <Turnstile
          onVerify={setCaptchaToken}
          onExpire={() => setCaptchaToken("")}
          resetKey={captchaKey}
        />

        <Tecla type="submit" tamano="grande" ancho disabled={loading || !captchaToken}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </Tecla>
      </form>

      {!vieneAPagar && (
        <>
          <Separador>o continúa con</Separador>

          <Tecla color="blanca" ancho onClick={handleGoogle}>
            <GoogleIcon />
            Continuar con Google
          </Tecla>
        </>
      )}

      <p className="acc-pie">
        ¿Ya tienes cuenta?{" "}
        <Link href={safeNext() ? `/login?next=${encodeURIComponent(safeNext()!)}` : "/login"}>Inicia sesión</Link>
      </p>

      {avisoDominio && (
        // El aviso del correo, en una ventanita (18-11-2026): sustituye a la
        // nota fija bajo el campo.
        <div className="acc-popup-velo" onClick={() => setAvisoDominio(false)}>
          <div className="acc-popup" role="alertdialog" aria-modal="true" aria-labelledby="acc-popup-titulo" onClick={(e) => e.stopPropagation()}>
            <p id="acc-popup-titulo" className="acc-popup-titulo">Ese correo no vale aquí</p>
            <p className="acc-popup-texto">{MENSAJE_DOMINIO_NO_PERMITIDO}</p>
            <Tecla tamano="peq" ancho onClick={() => setAvisoDominio(false)} autoFocus>
              Entendido
            </Tecla>
          </div>
        </div>
      )}
    </AccesoShell>
  );
}

