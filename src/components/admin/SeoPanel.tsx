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

// ── Helpers ──────────────────────────────────────────────────────
function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getFirstParagraph(content: string) {
  // First non-empty, non-heading, non-special line block
  const lines = content.split(/\n+/);
  for (const line of lines) {
    const t = line.trim();
    if (t && !t.startsWith("#") && !t.startsWith(">") && !t.startsWith("-") && !t.startsWith("|") && !t.startsWith(":::") && !t.startsWith("```")) {
      return t.toLowerCase();
    }
  }
  return "";
}

function getHeadingsText(content: string) {
  return content
    .split("\n")
    .filter((l) => /^#{2,3} /.test(l))
    .map((l) => l.replace(/^#+\s/, "").toLowerCase())
    .join(" ");
}

function getKeywordDensity(content: string, kw: string): number {
  if (!kw || !content) return 0;
  const words = content.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const kwWords = kw.toLowerCase().split(/\s+/).filter(Boolean);
  let matches = 0;
  for (let i = 0; i <= words.length - kwWords.length; i++) {
    if (kwWords.every((w, j) => words[i + j] === w)) matches++;
  }
  return parseFloat(((matches / words.length) * 100).toFixed(2));
}

function getAvgSentenceLength(content: string): number {
  // Strip markdown syntax roughly
  const plain = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/#+\s/g, "")
    .replace(/[*_~`=|>]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .trim();
  const sentences = plain.split(/[.!?]+/).filter((s) => s.trim().split(/\s+/).length > 1);
  if (sentences.length === 0) return 0;
  const totalWords = sentences.reduce((acc, s) => acc + s.trim().split(/\s+/).filter(Boolean).length, 0);
  return Math.round(totalWords / sentences.length);
}

function hasImagesWithoutAlt(content: string): boolean {
  // Find images with empty alt: ![ ](url) or ![](url)
  return /!\[\s*\]\([^)]+\)/.test(content);
}

function hasLinks(content: string): boolean {
  return /\[[^\]]+\]\(https?:\/\/[^)]+\)/.test(content);
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
  const wordCount = countWords(f.content);
  const density = getKeywordDensity(f.content, kw);
  const avgSentLen = getAvgSentenceLength(f.content);
  const firstPara = getFirstParagraph(f.content);
  const headingsText = getHeadingsText(f.content);

  const checks = [
    // ── Keyword setup
    {
      id: "kw_set",
      group: "Palabra clave",
      pass: kw.length > 0,
      label: "Palabra clave establecida",
      tip: "Define una palabra clave principal para el artículo.",
    },
    {
      id: "kw_in_title",
      group: "Palabra clave",
      pass: kw.length > 0 && titleLower.includes(kw),
      label: "Palabra clave en el título SEO",
      tip: "Incluye la palabra clave en el título para mejorar el posicionamiento.",
    },
    {
      id: "kw_in_slug",
      group: "Palabra clave",
      pass: kw.length > 0 && f.slug.toLowerCase().includes(kw.replace(/\s+/g, "-")),
      label: "Palabra clave en el slug/URL",
      tip: "El slug debe contener la keyword principal.",
    },
    {
      id: "kw_in_meta",
      group: "Palabra clave",
      pass: kw.length > 0 && descLower.includes(kw),
      label: "Palabra clave en meta descripción",
      tip: "Google pone en negrita la keyword en los resultados cuando coincide.",
    },
    {
      id: "kw_in_first_para",
      group: "Palabra clave",
      pass: kw.length > 0 && firstPara.includes(kw),
      label: "Palabra clave en el primer párrafo",
      tip: "Mencionar la keyword al inicio del artículo es una señal fuerte para Google.",
    },
    {
      id: "kw_in_heading",
      group: "Palabra clave",
      pass: kw.length > 0 && headingsText.includes(kw),
      label: "Palabra clave en al menos un H2 o H3",
      tip: "Usa la keyword en subtítulos para estructurar el contenido.",
    },
    {
      id: "kw_in_content",
      group: "Palabra clave",
      pass: kw.length > 0 && contentLower.includes(kw),
      label: "Palabra clave en el contenido",
      tip: "La keyword debe aparecer de forma natural en el cuerpo del artículo.",
    },
    {
      id: "kw_in_excerpt",
      group: "Palabra clave",
      pass: kw.length > 0 && excerptLower.includes(kw),
      label: "Palabra clave en el extracto",
      tip: "El extracto ayuda al contexto para los motores de búsqueda.",
    },
    {
      id: "kw_density",
      group: "Palabra clave",
      pass: kw.length > 0 && density >= 0.5 && density <= 2.5,
      label: `Densidad de keyword: ${kw.length > 0 ? density + "%" : "—"} (objetivo: 0.5–2.5%)`,
      tip: "Una densidad demasiado baja o alta perjudica el SEO.",
    },
    // ── Título & meta
    {
      id: "seo_title",
      group: "Título & Meta",
      pass: titleLen >= 40 && titleLen <= 60,
      label: `Título SEO entre 40-60 caracteres (ahora: ${titleLen})`,
      tip: "Un título entre 40 y 60 caracteres aparece completo en Google.",
    },
    {
      id: "meta_desc",
      group: "Título & Meta",
      pass: descLen >= 120 && descLen <= 155,
      label: `Meta descripción entre 120-155 caracteres (ahora: ${descLen})`,
      tip: "Una buena meta descripción mejora el CTR desde Google.",
    },
    {
      id: "slug_ok",
      group: "Título & Meta",
      pass: f.slug.length > 0 && !f.slug.includes(" ") && f.slug.length <= 75,
      label: "Slug/URL amigable (sin espacios, ≤75 chars)",
      tip: "La URL debe ser corta, en minúsculas y sin espacios.",
    },
    // ── Contenido
    {
      id: "content_length",
      group: "Contenido",
      pass: wordCount >= 600,
      label: `Longitud del contenido: ${wordCount} palabras ${wordCount < 300 ? "(mínimo: 300)" : wordCount < 600 ? "(recomendado: 600+)" : wordCount < 1000 ? "(bueno, óptimo: 1000+)" : "(excelente)"}`,
      tip: "Google favorece artículos con contenido sustancial. 1000+ palabras es lo ideal.",
    },
    {
      id: "cover_img",
      group: "Contenido",
      pass: f.coverImage.length > 0,
      label: "Imagen de portada definida",
      tip: "Tener imagen de portada mejora el CTR en redes sociales y Google.",
    },
    {
      id: "img_alt",
      group: "Contenido",
      pass: !hasImagesWithoutAlt(f.content),
      label: "Todas las imágenes tienen texto alternativo (alt)",
      tip: "El alt text ayuda al SEO y a la accesibilidad. Evita ![](url), usa ![descripción](url).",
    },
    {
      id: "has_links",
      group: "Contenido",
      pass: hasLinks(f.content),
      label: "El contenido incluye al menos un enlace",
      tip: "Los enlaces internos y externos enriquecen el artículo y mejoran el SEO.",
    },
    // ── Legibilidad
    {
      id: "readability",
      group: "Legibilidad",
      pass: avgSentLen > 0 && avgSentLen <= 20,
      label: `Longitud media de frase: ${avgSentLen > 0 ? avgSentLen + " palabras" : "—"} (objetivo: ≤20)`,
      tip: "Frases cortas mejoran la legibilidad y el tiempo en página.",
    },
  ];

  const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
  return { checks, score, wordCount, density, avgSentLen };
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
  const { checks, score, wordCount, density, avgSentLen } = buildChecks(f);
  const color = scoreColor(score);

  // Group checks for display
  const groups = Array.from(new Set(checks.map((c) => c.group)));

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
          {/* Quick stats */}
          <div className="seo-quick-stats">
            <span>{wordCount} palabras</span>
            {f.focusKeyword && <span>densidad: {density}%</span>}
            {avgSentLen > 0 && <span>~{avgSentLen} words/frase</span>}
          </div>
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

      {/* Grouped checklist */}
      <div className="seo-checklist">
        <p className="seo-section-label">Análisis SEO</p>
        {groups.map((group) => (
          <div key={group} className="seo-check-group">
            <p className="seo-check-group-label">{group}</p>
            {checks.filter((c) => c.group === group).map((c) => (
              <div key={c.id} className={`seo-check ${c.pass ? "pass" : "fail"}`} title={c.tip}>
                <span className="seo-check-icon">{c.pass ? "✅" : "⚠️"}</span>
                <span className="seo-check-label">{c.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Social preview */}
      <SocialPreview f={f} />
    </div>
  );
}
