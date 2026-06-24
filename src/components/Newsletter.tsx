"use client";

import { useState } from "react";
import Icon from "@/components/Icon";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: conectar con backend (tabla Supabase o proveedor de email).
    // Por ahora confirmación optimista en cliente.
    setDone(true);
  }

  return (
    <section className="newsletter-band">
      <div className="newsletter-content">
        <span className="newsletter-eyebrow">
          <Icon name="mail" size={15} />
          Boletín semanal
        </span>
        <h2 className="newsletter-title">Recibe el análisis antes que el mercado</h2>
        <p className="newsletter-sub">
          Un correo a la semana con lo esencial: lecturas de mercado, conceptos clave
          y los artículos nuevos. Sin ruido, sin spam.
        </p>
      </div>

      {done ? (
        <p className="newsletter-success">
          <Icon name="check" size={18} />
          Gracias. Te avisaremos en <strong>{email}</strong>.
        </p>
      ) : (
        <form className="newsletter-form" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            aria-label="Tu email"
            required
          />
          <button type="submit">Suscribirme</button>
        </form>
      )}
    </section>
  );
}
