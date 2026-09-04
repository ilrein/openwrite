/* ------------------------------------------------------------------ *
 * The writing surface: a contenteditable pane plus the toolbar that
 * drives whichever pane currently has the caret.
 * ------------------------------------------------------------------ */

(function attachEditor(global) {
  "use strict";

  const BLOCK_TAGS = ["h1", "h2", "h3", "blockquote", "p"];

  function closestBlock(node, root) {
    let current = node;
    while (current && current !== root) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const tag = current.tagName.toLowerCase();
        if (BLOCK_TAGS.includes(tag) || tag === "li") return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  class Editor {
    constructor(element, options) {
      this.el = element;
      this.placeholder = (options && options.placeholder) || "";
      this.onInput = (options && options.onInput) || (() => {});
      this.el.dataset.placeholder = this.placeholder;

      this.el.addEventListener("input", () => {
        this.refreshEmpty();
        this.onInput();
      });
      this.el.addEventListener("paste", (event) => this.handlePaste(event));
      this.el.addEventListener("keydown", (event) => this.handleKeydown(event));
      this.el.addEventListener("focus", () => {
        Editor.active = this;
      });
    }

    /* ------------------------------ content ---------------------- */

    setMarkdown(markdown) {
      const html = global.MD.toHtml(markdown);
      this.el.innerHTML = html || "<p><br></p>";
      this.refreshEmpty();
    }

    getMarkdown() {
      return global.MD.toMarkdown(this.el);
    }

    getText() {
      return this.el.innerText || "";
    }

    wordCount() {
      return global.MD.countWords(this.getText());
    }

    refreshEmpty() {
      const empty = !this.el.textContent.trim() && !this.el.querySelector("hr, img");
      this.el.classList.toggle("is-empty", empty);
    }

    focus() {
      this.el.focus();
      Editor.active = this;
    }

    /* ------------------------------ input ------------------------ */

    // Anything pasted is laundered through Markdown, so foreign fonts,
    // colours and tracking junk never make it into the manuscript.
    handlePaste(event) {
      event.preventDefault();
      const clipboard = event.clipboardData;
      if (!clipboard) return;

      const html = clipboard.getData("text/html");
      let markdown;
      if (html) {
        const scratch = document.createElement("div");
        scratch.innerHTML = html;
        for (const node of scratch.querySelectorAll("script, style, meta, link")) node.remove();
        markdown = global.MD.toMarkdown(scratch);
      } else {
        markdown = clipboard.getData("text/plain");
      }
      if (!markdown) return;

      document.execCommand("insertHTML", false, global.MD.toHtml(markdown));
      this.refreshEmpty();
      this.onInput();
    }

    handleKeydown(event) {
      const mod = event.ctrlKey || event.metaKey;

      if (mod && !event.shiftKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        this.exec("bold");
        return;
      }
      if (mod && !event.shiftKey && event.key.toLowerCase() === "i") {
        event.preventDefault();
        this.exec("italic");
        return;
      }
      if (mod && !event.shiftKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        this.exec("underline");
        return;
      }

      if (event.key === "Tab") {
        const block = this.currentBlock();
        if (block && block.tagName.toLowerCase() === "li") {
          event.preventDefault();
          document.execCommand(event.shiftKey ? "outdent" : "indent");
        }
        return;
      }

      // Leaving a heading with Enter should drop you into body text, not
      // another heading.
      if (event.key === "Enter" && !event.shiftKey) {
        const block = this.currentBlock();
        if (block && /^h[1-3]$/.test(block.tagName.toLowerCase())) {
          const selection = window.getSelection();
          const atEnd =
            selection &&
            selection.focusOffset === (selection.focusNode.textContent || "").length;
          if (atEnd) {
            event.preventDefault();
            document.execCommand("insertParagraph");
            document.execCommand("formatBlock", false, "p");
            this.onInput();
          }
        }
      }
    }

    /* --------------------------- commands ------------------------ */

    currentBlock() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return null;
      if (!this.el.contains(selection.anchorNode)) return null;
      return closestBlock(selection.anchorNode, this.el);
    }

    currentBlockTag() {
      const block = this.currentBlock();
      if (!block) return "p";
      const tag = block.tagName.toLowerCase();
      return tag === "li" ? "p" : tag;
    }

    exec(command, value) {
      this.el.focus();
      document.execCommand("styleWithCSS", false, false);

      if (command === "blockquote") {
        const isQuote = this.currentBlockTag() === "blockquote";
        document.execCommand("formatBlock", false, isQuote ? "p" : "blockquote");
      } else if (command === "block") {
        document.execCommand("formatBlock", false, value || "p");
      } else if (command === "code") {
        this.toggleCode();
      } else if (command === "link") {
        return;
      } else {
        document.execCommand(command, false, value);
      }

      this.refreshEmpty();
      this.onInput();
    }

    toggleCode() {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const inCode = closestTag(selection.anchorNode, "code", this.el);
      if (inCode) {
        const text = document.createTextNode(inCode.textContent);
        inCode.replaceWith(text);
        return;
      }
      const text = selection.toString();
      if (!text) return;
      document.execCommand("insertHTML", false, `<code>${global.MD.escapeHtml(text)}</code>`);
    }

    applyLink(url, label) {
      this.el.focus();
      const selection = window.getSelection();
      const hasSelection = selection && String(selection).length > 0;
      if (hasSelection && !label) {
        document.execCommand("createLink", false, url);
      } else {
        const text = global.MD.escapeHtml(label || url);
        document.execCommand("insertHTML", false, `<a href="${url}">${text}</a>`);
      }
      this.refreshEmpty();
      this.onInput();
    }

    state() {
      const query = (name) => {
        try {
          return document.queryCommandState(name);
        } catch {
          return false;
        }
      };
      return {
        bold: query("bold"),
        italic: query("italic"),
        underline: query("underline"),
        strikeThrough: query("strikeThrough"),
        insertUnorderedList: query("insertUnorderedList"),
        insertOrderedList: query("insertOrderedList"),
        block: this.currentBlockTag(),
        code: Boolean(closestTag(window.getSelection().anchorNode, "code", this.el)),
      };
    }
  }

  function closestTag(node, tagName, root) {
    let current = node;
    while (current && current !== root) {
      if (current.nodeType === Node.ELEMENT_NODE && current.tagName.toLowerCase() === tagName) {
        return current;
      }
      current = current.parentNode;
    }
    return null;
  }

  Editor.active = null;
  global.Editor = Editor;
})(window);
