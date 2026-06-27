"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type ToolbarItem =
  | { type: "action"; label: string; icon: string; title: string; action: ActionFn }
  | { type: "separator" };

type ActionFn = (
  text: string,
  selStart: number,
  selEnd: number
) => { newText: string; newCursor: number; newSelEnd?: number };

// ── Helper: wrap selection or placeholder ────────────────────────
function wrapSel(text: string, selStart: number, selEnd: number, before: string, after: string, placeholder = "texto") {
  const sel = text.slice(selStart, selEnd) || placeholder;
  const wrapped = `${before}${sel}${after}`;
  return { newText: text.slice(0, selStart) + wrapped + text.slice(selEnd), newCursor: selStart + before.length, newSelEnd: selStart + before.length + sel.length };
}

function toggleLinePrefix(text: string, selStart: number, selEnd: number, prefix: string) {
  const lineStart = text.lastIndexOf("\n", selStart - 1) + 1;
  const lineEnd = text.indexOf("\n", selEnd);
  const end = lineEnd === -1 ? text.length : lineEnd;
  const lines = text.slice(lineStart, end).split("\n");
  const allHavePrefix = lines.every((l) => l.startsWith(prefix));
  const newLines = allHavePrefix ? lines.map((l) => l.slice(prefix.length)) : lines.map((l) => prefix + l);
  const newBlock = newLines.join("\n");
  return { newText: text.slice(0, lineStart) + newBlock + text.slice(end), newCursor: lineStart + newBlock.length };
}

// ── Toolbar definition ────────────────────────────────────────────
const TOOLBAR: ToolbarItem[] = [
  // Headings
  {
    type: "action", label: "H1", icon: "H1", title: "Título H1",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "# "),
  },
  {
    type: "action", label: "H2", icon: "H2", title: "Título H2",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "## "),
  },
  {
    type: "action", label: "H3", icon: "H3", title: "Título H3",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "### "),
  },
  { type: "separator" },
  // Inline styles
  {
    type: "action", label: "B", icon: "B", title: "Negrita (Ctrl+B)",
    action: (t, s, e) => wrapSel(t, s, e, "**", "**"),
  },
  {
    type: "action", label: "I", icon: "I", title: "Cursiva (Ctrl+I)",
    action: (t, s, e) => wrapSel(t, s, e, "*", "*"),
  },
  {
    type: "action", label: "S", icon: "S̶", title: "Tachado",
    action: (t, s, e) => wrapSel(t, s, e, "~~", "~~"),
  },
  {
    type: "action", label: "mark", icon: "✦", title: "Resaltar / Highlight",
    action: (t, s, e) => wrapSel(t, s, e, "==", "==", "texto resaltado"),
  },
  { type: "separator" },
  // Blocks
  {
    type: "action", label: "quote", icon: "❝", title: "Cita",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "> "),
  },
  {
    type: "action", label: "ul", icon: "≡", title: "Lista con viñetas",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "- "),
  },
  {
    type: "action", label: "ol", icon: "1.", title: "Lista numerada",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "1. "),
  },
  {
    type: "action", label: "todo", icon: "☐", title: "Lista de tareas",
    action: (t, s, e) => toggleLinePrefix(t, s, e, "- [ ] "),
  },
  { type: "separator" },
  // Media & code
  {
    type: "action", label: "link", icon: "🔗", title: "Enlace",
    action: (t, s, e) => {
      const sel = t.slice(s, e) || "texto del enlace";
      const wrapped = `[${sel}](https://)`;
      return { newText: t.slice(0, s) + wrapped + t.slice(e), newCursor: s + sel.length + 3, newSelEnd: s + sel.length + 3 + 8 };
    },
  },
  {
    type: "action", label: "img", icon: "🖼", title: "Imagen",
    action: (t, s) => {
      const snippet = `\n![descripción](https://url-imagen.com)\n`;
      return { newText: t.slice(0, s) + snippet + t.slice(s), newCursor: s + snippet.length };
    },
  },
  {
    type: "action", label: "code", icon: "{ }", title: "Bloque de código",
    action: (t, s, e) => {
      const sel = t.slice(s, e) || "código aquí";
      const wrapped = sel.includes("\n") ? `\`\`\`\n${sel}\n\`\`\`` : `\`${sel}\``;
      return { newText: t.slice(0, s) + wrapped + t.slice(e), newCursor: s + wrapped.length };
    },
  },
  {
    type: "action", label: "table", icon: "⊞", title: "Tabla",
    action: (t, s) => {
      const snippet = `\n| Columna 1 | Columna 2 | Columna 3 |\n|-----------|-----------|----------|\n| Celda 1   | Celda 2   | Celda 3  |\n| Celda 4   | Celda 5   | Celda 6  |\n`;
      return { newText: t.slice(0, s) + snippet + t.slice(s), newCursor: s + snippet.length };
    },
  },
  { type: "separator" },
  // Callouts
  {
    type: "action", label: "info", icon: "ℹ", title: "Callout: Información",
    action: (t, s) => {
      const snippet = `\n:::info\n💡 Escribe tu nota informativa aquí\n:::\n`;
      return { newText: t.slice(0, s) + snippet + t.slice(s), newCursor: s + snippet.length };
    },
  },
  {
    type: "action", label: "warn", icon: "⚠", title: "Callout: Advertencia",
    action: (t, s) => {
      const snippet = `\n:::warning\n⚠️ Escribe tu advertencia aquí\n:::\n`;
      return { newText: t.slice(0, s) + snippet + t.slice(s), newCursor: s + snippet.length };
    },
  },
  {
    type: "action", label: "tip", icon: "✅", title: "Callout: Consejo",
    action: (t, s) => {
      const snippet = `\n:::tip\n✅ Escribe tu consejo aquí\n:::\n`;
      return { newText: t.slice(0, s) + snippet + t.slice(s), newCursor: s + snippet.length };
    },
  },
  { type: "separator" },
  // Misc
  {
    type: "action", label: "hr", icon: "—", title: "Separador horizontal",
    action: (t, s) => {
      const snippet = `\n\n---\n\n`;
      return { newText: t.slice(0, s) + snippet + t.slice(s), newCursor: s + snippet.length };
    },
  },
  {
    type: "action", label: "sup", icon: "x²", title: "Superíndice",
    action: (t, s, e) => wrapSel(t, s, e, "<sup>", "</sup>", "2"),
  },
  {
    type: "action", label: "sub", icon: "x₂", title: "Subíndice",
    action: (t, s, e) => wrapSel(t, s, e, "<sub>", "</sub>", "2"),
  },
];

// ── Word count ────────────────────────────────────────────────────
function countWords(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const readTime = Math.max(1, Math.round(words / 200));
  return { words, chars, readTime };
}

// ── Editor component ──────────────────────────────────────────────
export default function MarkdownEditor({ value, onChange, placeholder, rows = 22 }: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { words, chars, readTime } = countWords(value);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!textareaRef.current || document.activeElement !== textareaRef.current) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "b") { e.preventDefault(); applyTool("B"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "i") { e.preventDefault(); applyTool("I"); }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); applyTool("link"); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Tab key → insert 2 spaces instead of focus change
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const { selectionStart: s, selectionEnd: end } = ta;
      const newText = value.slice(0, s) + "  " + value.slice(end);
      onChange(newText);
      requestAnimationFrame(() => ta.setSelectionRange(s + 2, s + 2));
    }
  }

  const applyTool = useCallback((label: string) => {
    const item = TOOLBAR.find((t) => t.type === "action" && t.label === label);
    if (!item || item.type !== "action") return;
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const { newText, newCursor, newSelEnd } = item.action(value, s, e);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newSelEnd ?? newCursor);
    });
  }, [value, onChange]);

  const applyAction = useCallback((actionFn: ActionFn) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const { newText, newCursor, newSelEnd } = actionFn(value, s, e);
    onChange(newText);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newCursor, newSelEnd ?? newCursor);
    });
  }, [value, onChange]);

  return (
    <div className="md-editor">
      {/* ── Top toolbar ── */}
      <div className="md-toolbar">
        <div className="md-toolbar-actions">
          {TOOLBAR.map((item, idx) =>
            item.type === "separator" ? (
              <span key={idx} className="md-toolbar-sep" />
            ) : (
              <button
                key={item.label}
                type="button"
                className="md-toolbar-btn"
                title={item.title}
                onClick={() => applyAction(item.action)}
              >
                {item.icon}
              </button>
            )
          )}
        </div>
        <div className="md-toolbar-right">
          <div className="md-toolbar-tabs">
            <button type="button" className={`md-tab ${!preview ? "active" : ""}`} onClick={() => setPreview(false)}>✏️ Editar</button>
            <button type="button" className={`md-tab ${preview ? "active" : ""}`} onClick={() => setPreview(true)}>👁 Previsualizar</button>
          </div>
        </div>
      </div>

      {/* ── Editor / Preview ── */}
      {preview ? (
        <div
          className="md-preview prose-content"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value || "*Sin contenido todavía…*") }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          className="md-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={rows}
          placeholder={placeholder ?? "Escribe aquí tu artículo en Markdown…\n\n## Título de sección\n\n**Negrita**, *cursiva*, ~~tachado~~, ==resaltado==\n\n- Lista\n- De elementos\n\n| Col 1 | Col 2 |\n|-------|-------|\n| A     | B     |\n\n:::info\n💡 Puedes insertar callouts\n:::"}
          spellCheck
        />
      )}

      {/* ── Footer / Stats ── */}
      <div className="md-footer">
        <div className="md-stats">
          <span>{words} palabras</span>
          <span>·</span>
          <span>{chars} caracteres</span>
          <span>·</span>
          <span>~{readTime} min lectura</span>
        </div>
        <div className="md-hint-inline">
          <span><kbd>Ctrl+B</kbd> negrita</span>
          <span><kbd>Ctrl+I</kbd> cursiva</span>
          <span><kbd>Ctrl+K</kbd> enlace</span>
          <span><kbd>Tab</kbd> indentar</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  renderMarkdown — Markdown → HTML (zero deps, XSS-safe)
// ══════════════════════════════════════════════════════════════════
export function renderMarkdown(md: string): string {
  // 1. Protect code blocks from further processing
  const codeBlocks: string[] = [];
  let html = md.replace(/```([\w]*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(`<pre class="md-code-block${lang ? ` language-${lang}` : ""}"><code>${escapeHtml(code.trim())}</code></pre>`);
    return `\x00CODE${idx}\x00`;
  });

  // 2. Escape remaining HTML
  html = html.replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 3. Headings
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // 4. Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");

  // 5. Callouts  :::type\n...\n:::
  html = html.replace(/:::(\w+)\n([\s\S]*?):::/gm, (_m, type, content) => {
    const iconMap: Record<string, string> = { info: "💡", warning: "⚠️", tip: "✅", danger: "🚨" };
    const icon = iconMap[type] ?? "📌";
    return `<div class="md-callout md-callout--${type}"><span class="md-callout-icon">${icon}</span><div class="md-callout-body">${content.trim()}</div></div>`;
  });

  // 6. Blockquote
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");

  // 7. Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 8. Tables
  html = html.replace(/(^\|.+\|\n)(^\|[-| :]+\|\n)((?:^\|.+\|\n?)+)/gm, (block) => {
    const rows = block.trim().split("\n").filter(Boolean);
    const parseRow = (row: string) => row.split("|").slice(1, -1).map((c) => c.trim());
    const header = parseRow(rows[0]);
    const body = rows.slice(2);
    const thead = `<thead><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${body.map((r) => `<tr>${parseRow(r).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<table class="md-table"><${thead}<${tbody}</table>`;
  });

  // 9. Bold + italic + strikethrough + highlight
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/==(.+?)==/g, "<mark>$1</mark>");

  // 10. Superscript / Subscript (passthrough from toolbar)
  html = html.replace(/&lt;sup&gt;(.+?)&lt;\/sup&gt;/g, "<sup>$1</sup>");
  html = html.replace(/&lt;sub&gt;(.+?)&lt;\/sub&gt;/g, "<sub>$1</sub>");

  // 11. Images (before links)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" loading="lazy" />');

  // 12. Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // 13. Task list (before regular ul)
  html = html.replace(/^- \[x\] (.+)$/gm, '<li class="md-task md-task--done"><span class="md-checkbox">✅</span> $1</li>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<li class="md-task"><span class="md-checkbox">☐</span> $1</li>');

  // 14. Unordered list
  html = html.replace(/(^(- .+)(\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((l) => {
      if (l.startsWith('<li')) return l; // already processed (task list)
      return `<li>${l.replace(/^- /, "").trim()}</li>`;
    }).join("");
    return `<ul>${items}</ul>`;
  });

  // 15. Ordered list
  html = html.replace(/(^(\d+\. .+)(\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^\d+\. /, "").trim()}</li>`).join("");
    return `<ol>${items}</ol>`;
  });

  // 16. Paragraphs
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^(\x00CODE\d+\x00|<(h[1-6]|ul|ol|blockquote|pre|hr|img|div|table))/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  // 17. Restore code blocks
  html = html.replace(/\x00CODE(\d+)\x00/g, (_m, idx) => codeBlocks[Number(idx)]);

  return html;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
