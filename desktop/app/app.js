/* ------------------------------------------------------------------ *
 * OpenWrite Studio - renderer
 *
 * Holds the project in memory, paints the sidebar and the editor, and
 * writes every change back to disk through the preload bridge.
 * ------------------------------------------------------------------ */

(function main(global) {
  "use strict";

  const { MD, Editor, vault } = global;

  const GROUPS = [
    { key: "chapters", label: "Chapters", newLabel: "New Chapter", noun: "Chapter" },
    { key: "characters", label: "Characters", newLabel: "New Character", noun: "Character" },
    { key: "locations", label: "Locations", newLabel: "New Location", noun: "Location" },
    { key: "worldbuilding", label: "Worldbuilding", newLabel: "New Entry", noun: "Entry" },
    { key: "plot", label: "Plot Threads", newLabel: "New Thread", noun: "Thread" },
    { key: "notes", label: "Notes & Ideas", newLabel: "New Note", noun: "Note" },
    { key: "braindump", label: "Braindump", newLabel: "New Braindump", noun: "Braindump" },
  ];

  const PLACEHOLDERS = {
    chapters: "Start where it gets interesting.",
    characters: "Who are they when nobody is watching? Voice, wants, wounds, habits.",
    locations: "What does it smell like at three in the morning?",
    worldbuilding: "Rules, history, money, weather, whatever the story leans on.",
    plot: "Where this thread starts, what it complicates, how it pays off.",
    notes: "The half-thought you would otherwise lose.",
    braindump: "No structure required.",
  };

  const SAVE_DELAY = 650;

  const state = {
    project: null,
    active: null,
    collapsed: {},
    filter: "",
    saveTimer: null,
    pendingKey: null,
    dockCollapsed: false,
    focusMode: false,
  };

  const el = (id) => document.getElementById(id);

  const dom = {
    groups: el("groups"),
    vaultPath: el("vault-path"),
    saveState: el("save-state"),
    totalWords: el("total-words"),
    empty: el("empty-state"),
    doc: el("doc"),
    title: el("doc-title"),
    tagline: el("doc-tagline"),
    kind: el("doc-kind"),
    words: el("doc-words"),
    read: el("doc-read"),
    tabs: el("tabs"),
    tabCountMain: el("tab-count-main"),
    tabCountBrain: el("tab-count-brain"),
    pages: el("pages"),
    dock: el("dock"),
    dockCards: el("dock-cards"),
    synMain: el("syn-main"),
    synBrain: el("syn-brain"),
    synMainLabel: el("syn-main-label"),
    synMainCount: el("syn-main-count"),
    synBrainCount: el("syn-brain-count"),
    synBrainCard: el("syn-brain-card"),
    blockStyle: el("block-style"),
    toolbar: el("toolbar"),
    search: el("search"),
    toast: el("toast"),
    linkModal: el("link-modal"),
    linkText: el("link-text"),
    linkUrl: el("link-url"),
  };

  let mainEditor = null;
  let brainEditor = null;

  /* ------------------------------ utils ---------------------------- */

  function makeId(prefix) {
    const bytes = new Uint8Array(4);
    (global.crypto || {}).getRandomValues?.(bytes);
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${prefix}-${hex || Date.now().toString(16)}`;
  }

  function toast(message) {
    dom.toast.textContent = message;
    dom.toast.hidden = false;
    dom.toast.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      dom.toast.classList.remove("show");
      setTimeout(() => {
        dom.toast.hidden = true;
      }, 220);
    }, 2200);
  }

  function setSaveState(text, saving) {
    dom.saveState.textContent = text;
    dom.saveState.classList.toggle("is-saving", Boolean(saving));
  }

  function collectionFor(kind) {
    if (!state.project) return [];
    return kind === "chapters" ? state.project.chapters : state.project.categories[kind] || [];
  }

  function findDoc(kind, id) {
    return collectionFor(kind).find((entry) => entry.id === id) || null;
  }

  function activeDoc() {
    return state.active ? findDoc(state.active.kind, state.active.id) : null;
  }

  function wordsOf(doc) {
    return MD.countWords(String(doc.body || "").replace(/[#*_>`~[\]()]/g, " "));
  }

  /* ---------------------------- sidebar ---------------------------- */

  function matchesFilter(doc) {
    if (!state.filter) return true;
    const needle = state.filter.toLowerCase();
    return `${doc.title} ${doc.tagline || ""} ${doc.synopsis || ""} ${doc.body || ""}`
      .toLowerCase()
      .includes(needle);
  }

  function buildItem(group, doc, index) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "item";
    item.dataset.kind = group.key;
    item.dataset.id = doc.id;
    if (state.active && state.active.kind === group.key && state.active.id === doc.id) {
      item.classList.add("is-active");
    }

    if (group.key === "chapters") {
      item.draggable = true;
      const num = document.createElement("span");
      num.className = "item-num";
      num.textContent = String(index + 1).padStart(2, "0");
      item.append(num);
    }

    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = doc.title || "Untitled";
    item.append(title);

    const words = document.createElement("span");
    words.className = "item-words";
    const count = wordsOf(doc);
    words.textContent = count ? `${count.toLocaleString()}w` : "";
    item.append(words);

    item.addEventListener("click", () => openDoc(group.key, doc.id));
    return item;
  }

  function buildGroup(group) {
    const section = document.createElement("section");
    section.className = "group";
    section.style.setProperty("--group-color", `var(--c-${group.key}, var(--accent))`);
    if (state.collapsed[group.key]) section.classList.add("collapsed");

    const head = document.createElement("button");
    head.type = "button";
    head.className = "group-head";
    head.innerHTML = `
      <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>
      <span class="group-dot"></span>
      <span class="group-label"></span>
      <span class="group-count"></span>`;
    head.querySelector(".chev path").setAttribute("d", "m6 9 6 6 6-6");
    head.querySelector(".group-label").textContent = group.label;

    const docs = collectionFor(group.key).filter(matchesFilter);
    head.querySelector(".group-count").textContent = String(docs.length);
    head.addEventListener("click", () => {
      state.collapsed[group.key] = !state.collapsed[group.key];
      section.classList.toggle("collapsed");
    });
    section.append(head);

    const body = document.createElement("div");
    body.className = "group-body";

    const list = document.createElement("ul");
    list.className = "item-list";
    for (const [index, doc] of docs.entries()) {
      const li = document.createElement("li");
      li.append(buildItem(group, doc, index));
      list.append(li);
    }
    if (!docs.length) {
      const hint = document.createElement("li");
      hint.className = "empty-hint";
      hint.textContent = state.filter ? "Nothing matches." : "Nothing here yet.";
      list.append(hint);
    }
    body.append(list);

    const add = document.createElement("button");
    add.type = "button";
    add.className = "new-btn";
    add.innerHTML = '<span class="plus">+</span>';
    add.append(document.createTextNode(group.newLabel));
    add.addEventListener("click", () => createDoc(group));
    body.append(add);

    section.append(body);
    if (group.key === "chapters") wireChapterDrag(list);
    return section;
  }

  function renderSidebar() {
    dom.groups.replaceChildren();
    for (const group of GROUPS) dom.groups.append(buildGroup(group));

    const total = state.project.chapters.reduce((sum, chapter) => sum + wordsOf(chapter), 0);
    dom.totalWords.textContent = `${total.toLocaleString()} words`;
  }

  /* -------------------------- drag to reorder ---------------------- */

  function wireChapterDrag(list) {
    let draggingId = null;

    list.addEventListener("dragstart", (event) => {
      const item = event.target.closest(".item");
      if (!item) return;
      draggingId = item.dataset.id;
      item.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", draggingId);
    });

    list.addEventListener("dragend", () => {
      draggingId = null;
      for (const node of list.querySelectorAll(".item")) {
        node.classList.remove("dragging", "drag-over-top", "drag-over-bottom");
      }
    });

    list.addEventListener("dragover", (event) => {
      if (!draggingId) return;
      event.preventDefault();
      const item = event.target.closest(".item");
      if (!item) return;
      const box = item.getBoundingClientRect();
      const after = event.clientY > box.top + box.height / 2;
      for (const node of list.querySelectorAll(".item")) {
        node.classList.remove("drag-over-top", "drag-over-bottom");
      }
      item.classList.add(after ? "drag-over-bottom" : "drag-over-top");
    });

    list.addEventListener("drop", async (event) => {
      if (!draggingId) return;
      event.preventDefault();
      const target = event.target.closest(".item");
      if (!target || target.dataset.id === draggingId) return;

      const box = target.getBoundingClientRect();
      const after = event.clientY > box.top + box.height / 2;
      const chapters = state.project.chapters;
      const from = chapters.findIndex((c) => c.id === draggingId);
      const moved = chapters.splice(from, 1)[0];
      let to = chapters.findIndex((c) => c.id === target.dataset.id);
      if (after) to += 1;
      chapters.splice(to, 0, moved);

      chapters.forEach((chapter, index) => {
        chapter.order = index + 1;
      });
      renderSidebar();

      const files = await vault.reorderChapters(chapters.map(stripDoc));
      for (const entry of files) {
        const chapter = findDoc("chapters", entry.id);
        if (chapter) chapter.file = entry.file;
      }
      setSaveState(savedLabel());
    });
  }

  /* ----------------------------- editor ---------------------------- */

  function savedLabel() {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return `Saved ${time}`;
  }

  function stripDoc(doc) {
    return {
      id: doc.id,
      title: doc.title,
      tagline: doc.tagline,
      synopsis: doc.synopsis,
      body: doc.body,
      braindump: doc.braindump,
      braindumpSynopsis: doc.braindumpSynopsis,
      order: doc.order,
      file: doc.file,
    };
  }

  function updateCounts() {
    const doc = activeDoc();
    if (!doc) return;
    const words = mainEditor.wordCount();
    dom.words.textContent = `${words.toLocaleString()} ${words === 1 ? "word" : "words"}`;
    dom.read.textContent = `${Math.max(1, Math.round(words / 220))} min read`;
    dom.tabCountMain.textContent = words.toLocaleString();
    dom.tabCountBrain.textContent = brainEditor.wordCount().toLocaleString();
    dom.synMainCount.textContent = `${MD.countWords(dom.synMain.value)} words`;
    dom.synBrainCount.textContent = `${MD.countWords(dom.synBrain.value)} words`;

    const item = dom.groups.querySelector(
      `.item[data-kind="${state.active.kind}"][data-id="${state.active.id}"] .item-words`
    );
    if (item) item.textContent = words ? `${words.toLocaleString()}w` : "";
  }

  // Reads the panes back into the model. Only ever called for the document
  // currently on screen, just before it is written out.
  function harvest(kind, id) {
    if (!state.active || state.active.kind !== kind || state.active.id !== id) return null;
    const doc = findDoc(kind, id);
    if (!doc) return null;

    doc.title = dom.title.value.trim() || "Untitled";
    doc.body = mainEditor.getMarkdown();
    doc.synopsis = dom.synMain.value.trim();
    if (kind === "chapters") {
      doc.braindump = brainEditor.getMarkdown();
      doc.braindumpSynopsis = dom.synBrain.value.trim();
    } else {
      doc.tagline = dom.tagline.value.trim();
    }
    return doc;
  }

  async function flush() {
    clearTimeout(state.saveTimer);
    state.saveTimer = null;
    if (!state.pendingKey) return;

    const { kind, id } = state.pendingKey;
    state.pendingKey = null;
    const doc = harvest(kind, id) || findDoc(kind, id);
    if (!doc) return;

    try {
      const file =
        kind === "chapters"
          ? await vault.saveChapter(stripDoc(doc))
          : await vault.saveItem(kind, stripDoc(doc));
      doc.file = file;
      setSaveState(savedLabel());
    } catch (error) {
      setSaveState("Could not save");
      toast(`Could not save: ${error.message || error}`);
    }
  }

  function markDirty() {
    if (!state.active) return;
    state.pendingKey = { kind: state.active.kind, id: state.active.id };
    setSaveState("Saving...", true);
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(flush, SAVE_DELAY);

    const title = dom.title.value.trim() || "Untitled";
    const item = dom.groups.querySelector(
      `.item[data-kind="${state.active.kind}"][data-id="${state.active.id}"] .item-title`
    );
    if (item && item.textContent !== title) item.textContent = title;
    updateCounts();
  }

  /* ------------------------------ open ----------------------------- */

  async function openDoc(kind, id) {
    await flush();

    const doc = findDoc(kind, id);
    if (!doc) return;
    state.active = { kind, id };

    const isChapter = kind === "chapters";
    const group = GROUPS.find((g) => g.key === kind);

    dom.empty.hidden = true;
    dom.doc.hidden = false;
    dom.title.value = doc.title || "";
    dom.tagline.value = doc.tagline || "";
    dom.tagline.hidden = isChapter;
    dom.kind.textContent = isChapter ? `Chapter ${doc.order}` : group.noun;
    dom.tabs.hidden = !isChapter;
    dom.synBrainCard.hidden = !isChapter;
    dom.dockCards.classList.toggle("single", !isChapter);
    dom.synMainLabel.textContent = isChapter ? "Chapter synopsis" : "Summary";
    dom.synMain.placeholder = isChapter
      ? "What happens in this chapter, in a few lines. Who wants what, what changes, where it leaves the reader."
      : "The short version, for when you need reminding.";

    mainEditor.el.dataset.placeholder = PLACEHOLDERS[kind] || "";
    mainEditor.setMarkdown(doc.body || "");
    brainEditor.setMarkdown(doc.braindump || "");
    dom.synMain.value = doc.synopsis || "";
    dom.synBrain.value = doc.braindumpSynopsis || "";
    autoGrow(dom.synMain);
    autoGrow(dom.synBrain);

    showPane("main");
    updateCounts();
    setSaveState(savedLabel());

    for (const node of dom.groups.querySelectorAll(".item")) {
      node.classList.toggle(
        "is-active",
        node.dataset.kind === kind && node.dataset.id === id
      );
    }
    vault.setConfig({ lastOpen: { kind, id } });
  }

  function showPane(pane) {
    for (const node of dom.pages.querySelectorAll(".page")) {
      node.classList.toggle("is-active", node.dataset.pane === pane);
    }
    for (const node of dom.tabs.querySelectorAll(".tab")) {
      node.classList.toggle("is-active", node.dataset.pane === pane);
    }
    (pane === "brain" ? brainEditor : mainEditor).focus();
  }

  function autoGrow(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight + 2, 220)}px`;
  }

  /* ------------------------- create / delete ----------------------- */

  async function createDoc(group) {
    await flush();

    if (group.key === "chapters") {
      const order = state.project.chapters.length + 1;
      const chapter = {
        id: makeId("ch"),
        title: `Chapter ${order}`,
        synopsis: "",
        body: "",
        braindump: "",
        braindumpSynopsis: "",
        order,
        file: null,
      };
      state.project.chapters.push(chapter);
      chapter.file = await vault.saveChapter(stripDoc(chapter));
      renderSidebar();
      await openDoc("chapters", chapter.id);
    } else {
      const list = state.project.categories[group.key];
      const item = {
        id: makeId(group.key),
        title: `New ${group.noun}`,
        tagline: "",
        synopsis: "",
        body: "",
        order: list.length + 1,
        file: null,
      };
      list.push(item);
      item.file = await vault.saveItem(group.key, stripDoc(item));
      renderSidebar();
      await openDoc(group.key, item.id);
    }

    dom.title.focus();
    dom.title.select();
    toast(`${group.noun} added`);
  }

  async function deleteActive() {
    const doc = activeDoc();
    if (!doc) return;
    const kind = state.active.kind;
    const group = GROUPS.find((g) => g.key === kind);

    const ok = await vault.confirm({
      title: `Delete "${doc.title}"?`,
      message:
        "The file moves to the .trash folder inside your writing folder, so you can still get it back by hand.",
      confirmLabel: "Move to trash",
    });
    if (!ok) return;

    clearTimeout(state.saveTimer);
    state.pendingKey = null;

    if (kind === "chapters") {
      await vault.deleteChapter(stripDoc(doc));
      state.project.chapters = state.project.chapters.filter((c) => c.id !== doc.id);
      state.project.chapters.forEach((chapter, index) => {
        chapter.order = index + 1;
      });
      await vault.reorderChapters(state.project.chapters.map(stripDoc));
    } else {
      await vault.deleteItem(kind, stripDoc(doc));
      state.project.categories[kind] = state.project.categories[kind].filter(
        (i) => i.id !== doc.id
      );
    }

    state.active = null;
    renderSidebar();

    const next = collectionFor(kind)[0];
    if (next) {
      await openDoc(kind, next.id);
    } else if (state.project.chapters[0]) {
      await openDoc("chapters", state.project.chapters[0].id);
    } else {
      dom.doc.hidden = true;
      dom.empty.hidden = false;
    }
    toast(`${group.noun} moved to trash`);
  }

  /* ---------------------------- toolbar ---------------------------- */

  function currentEditor() {
    const activePane = dom.pages.querySelector(".page.is-active");
    const pane = activePane ? activePane.dataset.pane : "main";
    if (Editor.active && Editor.active.el.closest(".page") === activePane) return Editor.active;
    return pane === "brain" ? brainEditor : mainEditor;
  }

  function syncToolbar() {
    const editor = currentEditor();
    if (!editor || !document.activeElement) return;
    const status = editor.state();
    for (const button of dom.toolbar.querySelectorAll(".tb[data-cmd]")) {
      const cmd = button.dataset.cmd;
      button.classList.toggle("is-on", Boolean(status[cmd]));
    }
    dom.blockStyle.value = ["h1", "h2", "h3", "blockquote"].includes(status.block)
      ? status.block
      : "p";
  }

  function openLinkModal() {
    const editor = currentEditor();
    const selection = window.getSelection();
    dom.linkText.value = selection ? String(selection) : "";
    dom.linkUrl.value = "";
    dom.linkModal.hidden = false;
    dom.linkUrl.focus();

    const savedRange =
      selection && selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;

    const close = () => {
      dom.linkModal.hidden = true;
      dom.linkModal.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey, true);
    };

    const apply = () => {
      const url = dom.linkUrl.value.trim();
      if (!url) return close();
      if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      const label = dom.linkText.value.trim();
      const hasSelection = savedRange && !savedRange.collapsed;
      editor.applyLink(url, hasSelection && label === String(savedRange) ? "" : label);
      close();
    };

    function onClick(event) {
      const act = event.target.dataset ? event.target.dataset.act : null;
      if (event.target === dom.linkModal || act === "cancel") close();
      if (act === "ok") apply();
    }

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Enter" && !dom.linkModal.hidden) {
        event.preventDefault();
        apply();
      }
    }

    dom.linkModal.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey, true);
  }

  function wireToolbar() {
    for (const button of dom.toolbar.querySelectorAll(".tb[data-cmd]")) {
      button.addEventListener("mousedown", (event) => event.preventDefault());
      button.addEventListener("click", () => {
        const cmd = button.dataset.cmd;
        if (cmd === "link") {
          openLinkModal();
          return;
        }
        currentEditor().exec(cmd);
        syncToolbar();
      });
    }

    dom.blockStyle.addEventListener("change", () => {
      currentEditor().exec("block", dom.blockStyle.value);
      syncToolbar();
    });

    for (const tab of dom.tabs.querySelectorAll(".tab")) {
      tab.addEventListener("click", () => showPane(tab.dataset.pane));
    }

    document.addEventListener("selectionchange", syncToolbar);
  }

  /* ----------------------------- chrome ---------------------------- */

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    vault.setConfig({ theme });
  }

  async function exportManuscript() {
    await flush();
    const folder = state.project.vaultPath.split(/[\\/]/).filter(Boolean).pop() || "Manuscript";
    const parts = [`# ${folder}`, ""];
    for (const chapter of state.project.chapters) {
      parts.push(`## ${chapter.title}`, "");
      const body = String(chapter.body || "").trim();
      if (body) parts.push(body, "");
    }
    const saved = await vault.exportManuscript({
      suggestedName: `${folder} - manuscript.md`,
      contents: parts.join("\n"),
    });
    if (saved) toast("Manuscript exported");
  }

  function wireChrome() {
    el("btn-theme").addEventListener("click", () => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "paper" : "dark");
    });
    el("btn-change-folder").addEventListener("click", async () => {
      await flush();
      const project = await vault.chooseFolder();
      if (project) load(project);
    });
    el("btn-export").addEventListener("click", exportManuscript);
    el("vault-chip").addEventListener("click", () => vault.revealFolder());
    el("btn-open-folder").addEventListener("click", () => vault.revealFolder());
    el("btn-first-chapter").addEventListener("click", () =>
      createDoc(GROUPS.find((g) => g.key === "chapters"))
    );
    el("btn-delete").addEventListener("click", deleteActive);

    el("dock-handle").addEventListener("click", () => {
      state.dockCollapsed = !state.dockCollapsed;
      dom.dock.classList.toggle("collapsed", state.dockCollapsed);
    });

    el("btn-focus").addEventListener("click", toggleFocus);

    dom.search.addEventListener("input", () => {
      state.filter = dom.search.value.trim();
      renderSidebar();
    });

    dom.title.addEventListener("input", markDirty);
    dom.tagline.addEventListener("input", markDirty);
    for (const area of [dom.synMain, dom.synBrain]) {
      area.addEventListener("input", () => {
        autoGrow(area);
        markDirty();
      });
    }

    for (const button of document.querySelectorAll("[data-draft]")) {
      button.addEventListener("click", () => {
        const which = button.dataset.draft;
        const editor = which === "brain" ? brainEditor : mainEditor;
        const target = which === "brain" ? dom.synBrain : dom.synMain;
        const draft = MD.draftSynopsis(editor.getText());
        if (!draft) {
          toast("Write a little first, then this has something to pull from");
          return;
        }
        target.value = draft;
        autoGrow(target);
        markDirty();
      });
    }

    global.addEventListener("beforeunload", () => {
      if (state.pendingKey) flush();
    });
    global.addEventListener("blur", flush);
  }

  function toggleFocus() {
    state.focusMode = !state.focusMode;
    document.body.classList.toggle("focus", state.focusMode);
  }

  function wireShortcuts() {
    document.addEventListener("keydown", (event) => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod) return;
      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        flush().then(() => toast("Saved to your folder"));
      } else if (key === "n") {
        event.preventDefault();
        createDoc(GROUPS.find((g) => g.key === "chapters"));
      } else if (key === "k" && dom.linkModal.hidden) {
        event.preventDefault();
        openLinkModal();
      } else if (key === "f") {
        event.preventDefault();
        dom.search.focus();
        dom.search.select();
      } else if (event.key === "\\") {
        event.preventDefault();
        toggleFocus();
      } else if (key === "e" && event.shiftKey) {
        event.preventDefault();
        exportManuscript();
      }
    });
  }

  /* ------------------------------ boot ----------------------------- */

  function load(project) {
    state.project = project;
    state.active = null;
    document.documentElement.dataset.theme = project.theme || "paper";
    dom.vaultPath.textContent = project.vaultPath;
    dom.vaultPath.parentElement.title = `${project.vaultPath}\nClick to open in Explorer`;
    renderSidebar();

    const last = project.lastOpen;
    const target =
      (last && findDoc(last.kind, last.id) && last) ||
      (project.chapters[0] ? { kind: "chapters", id: project.chapters[0].id } : null);

    if (target) {
      openDoc(target.kind, target.id);
    } else {
      dom.doc.hidden = true;
      dom.empty.hidden = false;
    }
  }

  async function boot() {
    document.execCommand("defaultParagraphSeparator", false, "p");

    mainEditor = new Editor(el("editor-main"), {
      placeholder: PLACEHOLDERS.chapters,
      onInput: markDirty,
    });
    brainEditor = new Editor(el("editor-brain"), {
      placeholder: "Dump it here. Sort it out later.",
      onInput: markDirty,
    });

    wireToolbar();
    wireChrome();
    wireShortcuts();

    load(await vault.load());
  }

  boot();
})(window);
