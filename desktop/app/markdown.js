/* ------------------------------------------------------------------ *
 * Markdown <-> editor HTML.
 *
 * The editor is rich text, but what lands on disk is ordinary Markdown so
 * the folder stays readable in Notepad, Obsidian, git, anything.
 * ------------------------------------------------------------------ */

(function attachMarkdown(global) {
  "use strict";

  const BLOCK_START = /^(\s*)(#{1,6}\s|>|[-*+]\s|\d+\.\s|```|---\s*$|\*\*\*\s*$)/;

  /* ------------------------- HTML -> Markdown --------------------- */

  function escapeText(text) {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/([*`[\]])/g, "\\$1")
      .replace(/\u00A0/g, " ");
  }

  function escapeLineStarts(text) {
    return text.replace(/^(\s*)(#{1,6}\s|>|[-+]\s|\d+\.\s)/gm, "$1\\$2");
  }

  function styleWraps(el) {
    const style = el.style || {};
    const weight = String(style.fontWeight || "");
    const decoration = String(style.textDecoration || style.textDecorationLine || "");
    return {
      bold: weight === "bold" || Number(weight) >= 600,
      italic: String(style.fontStyle || "") === "italic",
      underline: decoration.includes("underline"),
      strike: decoration.includes("line-through"),
    };
  }

  function wrap(inner, before, after) {
    if (!inner.trim()) return inner;
    const lead = inner.match(/^\s*/)[0];
    const tail = inner.match(/\s*$/)[0];
    return `${lead}${before}${inner.trim()}${after}${tail}`;
  }

  function inlineToMd(node) {
    if (node.nodeType === Node.TEXT_NODE) return escapeText(node.nodeValue || "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const tag = node.tagName.toLowerCase();
    if (tag === "br") return "\n";
    if (tag === "img") return "";

    const inner = childrenToMd(node);

    switch (tag) {
      case "strong":
      case "b":
        return wrap(inner, "**", "**");
      case "em":
      case "i":
        return wrap(inner, "*", "*");
      case "u":
        return wrap(inner, "<u>", "</u>");
      case "s":
      case "strike":
      case "del":
        return wrap(inner, "~~", "~~");
      case "code":
        return inner.trim() ? `\`${inner.replace(/\\([*`[\]\\])/g, "$1")}\`` : inner;
      case "a": {
        const href = node.getAttribute("href") || "";
        return href ? `[${inner}](${href})` : inner;
      }
      default: {
        const styles = styleWraps(node);
        let out = inner;
        if (styles.strike) out = wrap(out, "~~", "~~");
        if (styles.underline) out = wrap(out, "<u>", "</u>");
        if (styles.italic) out = wrap(out, "*", "*");
        if (styles.bold) out = wrap(out, "**", "**");
        return out;
      }
    }
  }

  function childrenToMd(node) {
    let out = "";
    for (const child of node.childNodes) out += inlineToMd(child);
    return out;
  }

  function listToMd(el, depth) {
    const ordered = el.tagName.toLowerCase() === "ol";
    const pad = "  ".repeat(depth);
    const lines = [];
    let index = 1;
    for (const li of el.children) {
      if (li.tagName.toLowerCase() !== "li") continue;
      const nested = [];
      let text = "";
      for (const child of li.childNodes) {
        const tag = child.nodeType === Node.ELEMENT_NODE ? child.tagName.toLowerCase() : "";
        if (tag === "ul" || tag === "ol") nested.push(listToMd(child, depth + 1));
        else text += inlineToMd(child);
      }
      const marker = ordered ? `${index}. ` : "- ";
      lines.push(pad + marker + text.replace(/\n/g, `\n${pad}  `).trim());
      lines.push(...nested);
      index += 1;
    }
    return lines.join("\n");
  }

  function blockToMd(el) {
    const tag = el.tagName.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const level = Math.min(Number(tag[1]), 6);
      const text = childrenToMd(el).replace(/\n+/g, " ").trim();
      return text ? `${"#".repeat(level)} ${text}` : "";
    }
    if (tag === "hr") return "---";
    if (tag === "ul" || tag === "ol") return listToMd(el, 0);
    if (tag === "pre") return `\`\`\`\n${el.textContent.replace(/\n+$/, "")}\n\`\`\``;
    if (tag === "blockquote") {
      const inner = rootToMd(el);
      return inner
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
    }
    if (tag === "br") return "";
    return escapeLineStarts(childrenToMd(el).trim());
  }

  function rootToMd(root) {
    const blocks = [];
    let loose = "";

    const flushLoose = () => {
      const text = escapeLineStarts(loose.trim());
      if (text) blocks.push(text);
      loose = "";
    };

    for (const node of root.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        loose += escapeText(node.nodeValue || "");
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = node.tagName.toLowerCase();
      if (tag === "br") {
        loose += "\n";
        continue;
      }
      if (tag === "span" || tag === "font" || tag === "a" || tag === "code") {
        loose += inlineToMd(node);
        continue;
      }
      flushLoose();
      const block = blockToMd(node);
      if (block) blocks.push(block);
    }
    flushLoose();

    return blocks.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  /* ------------------------- Markdown -> HTML --------------------- */

  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function inlineToHtml(source) {
    const stash = [];
    const keep = (html) => {
      stash.push(html);
      return `\uE000${stash.length - 1}\uE001`;
    };

    let text = escapeHtml(String(source).replace(/[\uE000-\uE001]/g, ""));

    // Backslash escapes are parked before any pattern can see them.
    text = text.replace(/\\([\\*_`[\]~])/g, (_m, char) => keep(escapeHtml(char)));
    text = text.replace(/`([^`]+)`/g, (_m, code) => keep(`<code>${code}</code>`));
    text = text.replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, (_m, inner) => `<u>${inner}</u>`);
    text = text.replace(/\[([^\]]*)\]\(([^)\s]+)\)/g, (_m, label, href) =>
      keep(`<a href="${href}">${label || href}</a>`)
    );
    text = text.replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,!?;:)]|$)/g, "$1<em>$2</em>");
    text = text.replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,!?;:)]|$)/g, "$1<em>$2</em>");
    text = text.replace(/~~([\s\S]+?)~~/g, "<s>$1</s>");

    return text.replace(/\uE000(\d+)\uE001/g, (_m, index) => stash[Number(index)]);
  }

  function buildList(entries, start, ordered, indent) {
    const tag = ordered ? "ol" : "ul";
    let html = `<${tag}>`;
    let i = start;
    let open = false;

    while (i < entries.length) {
      const entry = entries[i];
      if (entry.indent < indent) break;
      if (entry.indent > indent) {
        const nested = buildList(entries, i, entry.ordered, entry.indent);
        html += nested.html;
        i = nested.next;
        continue;
      }
      if (entry.ordered !== ordered) break;
      if (open) html += "</li>";
      html += `<li>${inlineToHtml(entry.text)}`;
      open = true;
      i += 1;
    }
    if (open) html += "</li>";
    return { html: `${html}</${tag}>`, next: i };
  }

  function toHtml(markdown) {
    const lines = String(markdown || "")
      .replace(/\r\n/g, "\n")
      .split("\n");
    const out = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (!line.trim()) {
        i += 1;
        continue;
      }

      if (/^```/.test(line.trim())) {
        const code = [];
        i += 1;
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          code.push(lines[i]);
          i += 1;
        }
        i += 1;
        out.push(`<pre>${escapeHtml(code.join("\n"))}</pre>`);
        continue;
      }

      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        const level = Math.min(heading[1].length, 3);
        out.push(`<h${level}>${inlineToHtml(heading[2].trim())}</h${level}>`);
        i += 1;
        continue;
      }

      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
        out.push("<hr>");
        i += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quote = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^>\s?/, ""));
          i += 1;
        }
        out.push(`<blockquote>${toHtml(quote.join("\n"))}</blockquote>`);
        continue;
      }

      const listStart = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(line);
      if (listStart) {
        const entries = [];
        while (i < lines.length) {
          const match = /^(\s*)([-*+]|\d+\.)\s+(.*)$/.exec(lines[i]);
          if (!match) break;
          entries.push({
            indent: Math.floor(match[1].length / 2),
            ordered: /\d/.test(match[2]),
            text: match[3],
          });
          i += 1;
        }
        out.push(buildList(entries, 0, entries[0].ordered, entries[0].indent).html);
        continue;
      }

      const paragraph = [];
      while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) {
        paragraph.push(lines[i]);
        i += 1;
      }
      if (paragraph.length) {
        out.push(`<p>${paragraph.map(inlineToHtml).join("<br>")}</p>`);
      } else {
        // A block marker that no rule above claimed: keep it as literal text.
        out.push(`<p>${inlineToHtml(lines[i])}</p>`);
        i += 1;
      }
    }

    return out.join("");
  }

  /* ----------------------------- helpers -------------------------- */

  function countWords(text) {
    const plain = String(text || "").trim();
    return plain ? plain.split(/\s+/).length : 0;
  }

  // Pulls the opening sentence of the first few paragraphs together into a
  // rough summary. No cleverness, no model - just your own words, gathered.
  function draftSynopsis(plainText, maxParagraphs) {
    const limit = maxParagraphs || 5;
    const paragraphs = String(plainText || "")
      .split(/\n{1,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 30);

    const picked = [];
    for (const paragraph of paragraphs.slice(0, limit)) {
      const sentence = /^[\s\S]*?[.!?]["')\]]?(\s|$)/.exec(paragraph);
      picked.push((sentence ? sentence[0] : paragraph.slice(0, 160)).trim());
    }
    return picked.join(" ").replace(/\s+/g, " ").trim();
  }

  global.MD = { toMarkdown: rootToMd, toHtml, countWords, draftSynopsis, escapeHtml };
})(window);
