"use client";

interface SeoField {
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  title: string;
  excerpt: string;
  slug: string;
  content: string;
  coverImage: string;
}

interface Props extends SeoField {
  onChange: (field: keyof SeoField, value: string) => void;
}

// ── Char-count progress bar ──────────────────────────────────────
function CharBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const color =
    value === 0 ? "var(--text-muted)"
    : value < min ? "#facc15"
    : value <= max ? "#22c55e"
    : "#ef4444";
  return (
    <div className="seo-char-bar-wrap">
      <div className="seo-char-bar" style={{ width: `${pct}%`, background: color }} />
      <span className="seo-char-count" style={{ color }}>
        {value}/{max}
      </span>
    </div>
  );
}

// ── SEO scoring ──────────────────────────────────────────────────
function buildChecks(f: SeoField) {
  const kw = f.focusKeyword.trim().toLowerCase();
  const titleLower = (f.seoTitle || f.title).toLowerCase();
  const descLower = f.metaDescription.toLowerCase();
  const contentLower = f.content.toLowerCase();
  const excerptLower = f.excerpt.toLowerCase();
  const titleLen = (f.seoTitle || f.title).length;
  const descLen = f.metaDescription.length;

  const checks = [
    {
      id: "kw_set",
      pass: kw.length > 0,
      label: "Palabra clave establecida",
      tip: "Define una palabra clave principal para el artículo.",
    },
    {
      id: "seo_title",
      pass: titleLen >= 40 && titleLen <= 60,
      label: `Título SEO entre 40-60 caracteres (ahora: ${titleLen})`,
      tip: "Un título entre 40 y 60 caracteres aparece completo en Google.",
    },
    {
      id: "kw_in_title",
      pass: kw.length > 0 && titleLower.includes(kw),
      label: "Palabra clave en el título SEO",
      tip: "Incluye la palabra clave en el título para mejorar el posicionamiento.",
    },
    {
      id: "meta_desc",
      pass: descLen >= 120 && descLen <= 155,
      label: `Meta descripción entre 120-155 caracteres (ahora: ${descLen})`,
      tip: "Una buena meta descripción mejora el CTR desde Google.",
    },
    {
      id: "kw_in_meta",
      pass: kw.length > 0 && descLower.includes(kw),
      label: "Palabra clave en meta descripción",
      tip: "Google pone en negrita la palabra clave en los resultados cuando coincide.",
    },
    {
      id: "kw_in_content",
      pass: kw.length > 0 && contentLower.includes(kw),
      label: "Palabra clave en el contenido",
      tip: "La palabra clave debe aparecer naturalmente en el cuerpo del artículo.",
    },
    {
      id: "kw_in_excerpt",
      pass: kw.length > 0 && excerptLower.includes(kw),
      label: "Palabra clave en el extracto",
      tip: "El extracto ayuda al contexto para los motores de búsqueda.",
    },
    {
      id: "slug_ok",
      pass: f.slug.length > 0 && !f.slug.includes(" "),
      label: "Slug/URL amigable (sin espacios)",
      tip: "La URL debe ser corta, en minúsculas y sin espacios.",
    },
    {
      id: "cover_img",
      pass: f.coverImage.length > 0,
      label: "Imagen de portada definida",
      tip: "Tener imagen de portada mejora el CTR en redes sociales y Google.",
    },
    {
      id: "content_length",
      pass: f.content.split(/\s+/).filter(Boolean).length >= 300,
      label: "Contenido de al menos 300 palabras",
      tip: "Google favorece artículos con contenido sustancial.",
    },
  ];

  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  return { checks, score };
}

function scoreColor(score: number) {
  if (score >= 80) return "#22c55e";
  if (score >= 50) return "#facc15";
  return "#ef4444";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Bueno";
  if (score >= 50) return "Mejorable";
  return "Pobre";
}

// ── Social preview ───────────────────────────────────────────────
function SocialPreview({ f }: { f: SeoField }) {
  const title = f.seoTitle || f.title || "Título del artículo";
  const desc = f.metaDescription || f.excerpt || "Descripción del artículo...";
  const img = f.coverImage;

  return (
    <div className="seo-social-preview">
      <p className="seo-section-label">Vista previa en Google / Redes</p>

      {/* Google SERP preview */}
      <div className="seo-google-preview">
        <div className="seo-google-url">adelinbtc.com › {f.slug || "slug-del-articulo"}</div>
        <div
          className="seo-google-title"
          style={{ color: (f.seoTitle || f.title).length > 60 ? "#ef4444" : "#8ab4f8" }}
        >
          {title.slice(0, 60)}{title.length > 60 ? "..." : ""}
        </div>
        <div className="seo-google-desc">
          {desc.slice(0, 155)}{desc.length > 155 ? "..." : ""}
        </div>
      </div>

      {/* OG Card preview */}
      <div className="seo-og-card">
        {img ? (
          <img src={img} alt="OG preview" className="seo-og-img" />
        ) : (
          <div className="seo-og-img-placeholder">Sin imagen de portada</div>
        )}
        <div className="seo-og-body">
          <div className="seo-og-domain">adelinbtc.com</div>
          <div className="seo-og-title">{title.slice(0, 70)}</div>
          <div className="seo-og-desc">{desc.slice(0, 100)}</div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function SeoPanel({ onChange, ...f }: Props) {
  const { checks, score } = buildChecks(f);
  const color = scoreColor(score);

  return (
    <div className="seo-panel">
      {/* Score ring */}
      <div className="seo-score-header">
        <div className="seo-score-ring" style={{ "--score-color": color } as React.CSSProperties}>
          <svg viewBox="0 0 36 36" className="seo-ring-svg">
            <circle className="seo-ring-bg" cx="18" cy="18" r="15.9" />
            <circle
              className="seo-ring-fill"
              cx="18" cy="18" r="15.9"
              style={{ stroke: color, strokeDasharray: `${score}, 100` }}
            />
          </svg>
          <span className="seo-score-num">{score}</span>
        </div>
        <div className="seo-score-info">
          <span className="seo-score-label" style={{ color }}>{scoreLabel(score)}</span>
          <span className="seo-score-sub">
            {checks.filter((c) => c.pass).length} de {checks.length} criterios superados
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="seo-fields">
        <div className="seo-field">
          <label className="seo-label">
            Título SEO <span>(aparece en el navegador y en Google)</span>
          </label>
          <input
            type="text"
            className="seo-input"
            placeholder={f.title || "Título para Google..."}
            value={f.seoTitle}
            onChange={(e) => onChange("seoTitle", e.target.value)}
            maxLength={70}
          />
          <CharBar value={(f.seoTitle || f.title).length} min={40} max={60} />
        </div>

        <div className="seo-field">
          <label className="seo-label">
            Meta descripción <span>(descripción en resultados de búsqueda)</span>
          </label>
          <textarea
            className="seo-textarea"
            placeholder="Describe el artículo en 120-155 caracteres para Google..."
            value={f.metaDescription}
            onChange={(e) => onChange("metaDescription", e.target.value)}
            rows={3}
            maxLength={160}
          />
          <CharBar value={f.metaDescription.length} min={120} max={155} />
        </div>

        <div className="seo-field">
          <label className="seo-label">
            Palabra clave principal <span>(focus keyword)</span>
          </label>
          <input
            type="text"
            className="seo-input"
            placeholder="Ej: bitcoin, análisis técnico, DeFi..."
            value={f.focusKeyword}
            onChange={(e) => onChange("focusKeyword", e.target.value)}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="seo-checklist">
        <p className="seo-section-label">Análisis SEO</p>
        {checks.map((c) => (
          <div key={c.id} className={`seo-check ${c.pass ? "pass" : "fail"}`} title={c.tip}>
            <span className="seo-check-icon">{c.pass ? "✅" : "⚠️"}</span>
            <span className="seo-check-label">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Social preview */}
      <SocialPreview f={f} />
    </div>
  );
}
