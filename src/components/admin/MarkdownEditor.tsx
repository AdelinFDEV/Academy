"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ImageUpload from "@/components/admin/ImageUpload";
import { renderMarkdown } from "@/lib/renderMarkdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

type ToolbarItem =
  | { type: "action"; label: string; icon: string; title: string; action: ActionFn }
  | { type: "separator" }
  | { type: "img-upload" };

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
  { type: "action", label: "H1", icon: "H1", title: "Título H1", action: (t, s, e) => toggleLinePrefix(t, s, e, "# ") },
  { type: "action", label: "H2", icon: "H2", title: "Título H2", action: (t, s, e) => toggleLinePrefix(t, s, e, "## ") },
  { type: "action", label: "H3", icon: "H3", title: "Título H3", action: (t, s, e) => toggleLinePrefix(t, s, e, "### ") },
  { type: "action", label: "H4", icon: "H4", title: "Título H4", action: (t, s, e) => toggleLinePrefix(t, s, e, "#### ") },
  { type: "separator" },
  // Inline styles
  { type: "action", label: "B", icon: "B", title: "Negrita (Ctrl+B)", action: (t, s, e) => wrapSel(t, s, e, "**", "**") },
  { type: "action", label: "I", icon: "I", title: "Cursiva (Ctrl+I)", action: (t, s, e) => wrapSel(t, s, e, "*", "*") },
  { type: "action", label: "S", icon: "S̶", title: "Tachado", action: (t, s, e) => wrapSel(t, s, e, "~~", "~~") },
  { type: "action", label: "mark", icon: "✦", title: "Resaltar / Highlight", action: (t, s, e) => wrapSel(t, s, e, "==", "==", "texto resaltado") },
  { type: "separator" },
  // Blocks
  { type: "action", label: "quote", icon: "❝", title: "Cita", action: (t, s, e) => toggleLinePrefix(t, s, e, "> ") },
  { type: "action", label: "ul", icon: "≡", title: "Lista con viñetas", action: (t, s, e) => toggleLinePrefix(t, s, e, "- ") },
  { type: "action", label: "ol", icon: "1.", title: "Lista numerada", action: (t, s, e) => toggleLinePrefix(t, s, e, "1. ") },
  { type: "action", label: "todo", icon: "☐", title: "Lista de tareas", action: (t, s, e) => toggleLinePrefix(t, s, e, "- [ ] ") },
  { type: "separator" },
  // Media & code
  {
    type: "action", label: "link", icon: "🔗", title: "Enlace (Ctrl+K)",
    action: (t, s, e) => {
      const sel = t.slice(s, e) || "texto del enlace";
      const wrapped = `[${sel}](https://)`;
      return { newText: t.slice(0, s) + wrapped + t.slice(e), newCursor: s + sel.length + 3, newSelEnd: s + sel.length + 3 + 8 };
    },
  },
  { type: "img-upload" },
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
  // Footnote
  {
    type: "action", label: "fn", icon: "[¹]", title: "Nota al pie",
    action: (t, s, e) => {
      const sel = t.slice(s, e).trim();
      // Count existing footnotes to get next number
      const existing = (t.match(/\[\^(\d+)\]/g) ?? []).map((m) => parseInt(m.replace(/\D/g, "")));
      const n = existing.length > 0 ? Math.max(...existing) + 1 : 1;
      const ref = `[^${n}]`;
      const def = `\n[^${n}]: ${sel || "Fuente o aclaración aquí"}`;
      const newText = t.slice(0, s) + ref + t.slice(e) + def;
      return { newText, newCursor: s + ref.length };
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
  { type: "action", label: "sup", icon: "x²", title: "Superíndice", action: (t, s, e) => wrapSel(t, s, e, "<sup>", "</sup>", "2") },
  { type: "action", label: "sub", icon: "x₂", title: "Subíndice", action: (t, s, e) => wrapSel(t, s, e, "<sub>", "</sub>", "2") },
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
  const [dragging, setDragging] = useState(false);
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

  const insertImageUrl = useCallback((url: string) => {
    const ta = textareaRef.current;
    const s = ta ? ta.selectionStart : value.length;
    const snippet = `\n![imagen](${url})\n`;
    const newText = value.slice(0, s) + snippet + value.slice(s);
    onChange(newText);
    requestAnimationFrame(() => {
      ta?.focus();
      ta?.setSelectionRange(s + snippet.length, s + snippet.length);
    });
  }, [value, onChange]);

  // ── Drag & drop ──────────────────────────────────────────────────
  async function handleDrop(e: React.DragEvent<HTMLTextAreaElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    if (!res.ok) return;
    const { url } = await res.json();
    if (url) insertImageUrl(url);
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
            ) : item.type === "img-upload" ? (
              <ImageUpload
                key="img-upload"
                compact
                label="Insertar imagen"
                onUpload={insertImageUrl}
              />
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
            <button type="button" className={`md-tab ${preview ? "active" : ""}`} onClick={() => setPreview(true)}>👁 Vista previa</button>
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
        <div className={`md-drop-zone${dragging ? " md-drop-zone--active" : ""}`}>
          <textarea
            ref={textareaRef}
            className="md-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            placeholder={placeholder ?? "Escribe aquí tu artículo en Markdown…\n\n## Título de sección\n\n**Negrita**, *cursiva*, ~~tachado~~, ==resaltado==\n\n- Lista\n- De elementos\n\n| Col 1 | Col 2 |\n|-------|-------|\n| A     | B     |\n\n:::info\n💡 Puedes insertar callouts\n:::\n\n[^1]: Nota al pie de ejemplo"}
            spellCheck
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          />
          {dragging && (
            <div className="md-drop-overlay">📁 Suelta la imagen aquí</div>
          )}
        </div>
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
          <span>arrastra imágenes al editor</span>
        </div>
      </div>
    </div>
  );
}

