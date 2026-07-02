// Pure server/client-safe function — no "use client" directive

export function slugId(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SH_KEYWORDS: Record<string, string[]> = {
  js:         ["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","typeof","new","this","true","false","null","undefined","=>"],
  ts:         ["const","let","var","function","return","if","else","for","while","class","import","export","default","from","async","await","typeof","new","this","true","false","null","undefined","=>","type","interface","extends","implements","readonly","as","enum","namespace"],
  python:     ["def","return","if","elif","else","for","while","class","import","from","as","True","False","None","and","or","not","in","is","lambda","with","pass","break","continue","raise","try","except","finally"],
  bash:       ["if","then","else","fi","for","do","done","while","case","esac","function","return","echo","export","local","source"],
};
SH_KEYWORDS["javascript"] = SH_KEYWORDS["js"];
SH_KEYWORDS["typescript"] = SH_KEYWORDS["ts"];
SH_KEYWORDS["sh"]         = SH_KEYWORDS["bash"];
SH_KEYWORDS["py"]         = SH_KEYWORDS["python"];

function highlightCode(code: string, lang: string): string {
  const keywords = SH_KEYWORDS[lang] ?? [];
  let result = "";
  let i = 0;
  while (i < code.length) {
    if ((lang === "js" || lang === "ts" || lang === "javascript" || lang === "typescript") && code[i] === "/" && code[i + 1] === "/") {
      const end = code.indexOf("\n", i);
      const comment = end === -1 ? code.slice(i) : code.slice(i, end);
      result += `<span class="sh-comment">${comment}</span>`;
      i += comment.length;
      continue;
    }
    if ((lang === "python" || lang === "py" || lang === "bash" || lang === "sh") && code[i] === "#") {
      const end = code.indexOf("\n", i);
      const comment = end === -1 ? code.slice(i) : code.slice(i, end);
      result += `<span class="sh-comment">${comment}</span>`;
      i += comment.length;
      continue;
    }
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && (code[j] !== q || code[j - 1] === "\\")) j++;
      j++;
      result += `<span class="sh-string">${code.slice(i, j)}</span>`;
      i = j;
      continue;
    }
    if (code[i] === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== "`") j++;
      j++;
      result += `<span class="sh-string">${code.slice(i, j)}</span>`;
      i = j;
      continue;
    }
    if (/[0-9]/.test(code[i]) && (i === 0 || /\W/.test(code[i - 1]))) {
      let j = i;
      while (j < code.length && /[0-9._xXa-fA-F]/.test(code[j])) j++;
      result += `<span class="sh-number">${code.slice(i, j)}</span>`;
      i = j;
      continue;
    }
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[a-zA-Z0-9_$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      result += keywords.includes(word) ? `<span class="sh-keyword">${word}</span>` : word;
      i = j;
      continue;
    }
    result += code[i];
    i++;
  }
  return result;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Sanea una URL antes de meterla en un atributo href/src.
 * - Bloquea esquemas peligrosos (javascript:, data:, vbscript:) que permitirían
 *   ejecutar JS (XSS). Ignora espacios/controles iniciales que se usan para evadir.
 * - Escapa las comillas para impedir que se rompa el atributo e inyecten otro
 *   (p.ej. `" onerror="...`). '<', '>' y '&' ya vienen escapados del paso previo.
 */
function safeUrl(url: string): string {
  const scheme = url.replace(/[\u0000-\u0020]+/g, "").toLowerCase();
  if (
    scheme.startsWith("javascript:") ||
    scheme.startsWith("data:") ||
    scheme.startsWith("vbscript:")
  ) {
    return "#";
  }
  return url.trim().replace(/"/g, "%22");
}

export function renderMarkdown(md: string): string {
  const codeBlocks: string[] = [];
  let html = md.replace(/```([\w]*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const idx = codeBlocks.length;
    const escaped = escapeHtml(code.trim());
    const highlighted = lang ? highlightCode(escaped, lang.toLowerCase()) : escaped;
    codeBlocks.push(`<pre class="md-code-block${lang ? ` language-${lang}` : ""}"><code>${highlighted}</code></pre>`);
    return `\x00CODE${idx}\x00`;
  });

  const footnoteDefs: string[] = [];
  html = html.replace(/^\[\^(\d+)\]: (.+)$/gm, (_m, n, text) => {
    const idx = footnoteDefs.length;
    footnoteDefs.push(`<li id="fn-${n}" class="md-footnote-item"><sup>${n}</sup> ${text} <a href="#fnref-${n}" class="md-footnote-back">↩</a></li>`);
    return `\x00FNDEF${idx}\x00`;
  });

  html = html.replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, (_, text) => `<h3 id="${slugId(text)}">${text}</h3>`);
  html = html.replace(/^## (.+)$/gm,  (_, text) => `<h2 id="${slugId(text)}">${text}</h2>`);
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/:::(\w+)\n([\s\S]*?):::/gm, (_m, type, content) => {
    const iconMap: Record<string, string> = { info: "💡", warning: "⚠️", tip: "✅", danger: "🚨" };
    const icon = iconMap[type] ?? "📌";
    return `<div class="md-callout md-callout--${type}"><span class="md-callout-icon">${icon}</span><div class="md-callout-body">${content.trim()}</div></div>`;
  });
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/(^\|.+\|\n)(^\|[-| :]+\|\n)((?:^\|.+\|\n?)+)/gm, (block) => {
    const rows = block.trim().split("\n").filter(Boolean);
    const parseRow = (row: string) => row.split("|").slice(1, -1).map((c) => c.trim());
    const header = parseRow(rows[0]);
    const body = rows.slice(2);
    const thead = `<thead><tr>${header.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${body.map((r) => `<tr>${parseRow(r).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
    return `<table class="md-table"><${thead}<${tbody}</table>`;
  });
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/==(.+?)==/g, "<mark>$1</mark>");
  html = html.replace(/&lt;sup&gt;(.+?)&lt;\/sup&gt;/g, "<sup>$1</sup>");
  html = html.replace(/&lt;sub&gt;(.+?)&lt;\/sub&gt;/g, "<sub>$1</sub>");
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, url) =>
    `<img src="${safeUrl(url)}" alt="${String(alt).replace(/"/g, "&quot;")}" class="md-img" loading="lazy" />`);
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
    `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`);
  html = html.replace(/\[\^(\d+)\]/g, '<sup><a href="#fn-$1" id="fnref-$1" class="md-footnote-ref">[$1]</a></sup>');
  html = html.replace(/^- \[x\] (.+)$/gm, '<li class="md-task md-task--done"><span class="md-checkbox">✅</span> $1</li>');
  html = html.replace(/^- \[ \] (.+)$/gm, '<li class="md-task"><span class="md-checkbox">☐</span> $1</li>');
  html = html.replace(/(^(- .+)(\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((l) => {
      if (l.startsWith('<li')) return l;
      return `<li>${l.replace(/^- /, "").trim()}</li>`;
    }).join("");
    return `<ul>${items}</ul>`;
  });
  html = html.replace(/(^(\d+\. .+)(\n|$))+/gm, (block) => {
    const items = block.trim().split("\n").map((l) => `<li>${l.replace(/^\d+\. /, "").trim()}</li>`).join("");
    return `<ol>${items}</ol>`;
  });
  html = html
    .split(/\n{2,}/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^(\x00CODE\d+\x00|\x00FNDEF\d+\x00|<(h[1-6]|ul|ol|blockquote|pre|hr|img|div|table))/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");
  html = html.replace(/\x00CODE(\d+)\x00/g, (_m, idx) => codeBlocks[Number(idx)]);

  const fnDefsInOrder: string[] = [];
  html = html.replace(/\x00FNDEF(\d+)\x00/g, (_m, idx) => {
    fnDefsInOrder.push(footnoteDefs[Number(idx)]);
    return "";
  });
  if (fnDefsInOrder.length > 0) {
    html += `<hr class="md-footnotes-hr" /><ol class="md-footnotes">${fnDefsInOrder.join("")}</ol>`;
  }

  return html;
}
