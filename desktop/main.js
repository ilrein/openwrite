"use strict";

const { app, BrowserWindow, ipcMain, dialog, shell, Menu, nativeTheme } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const crypto = require("node:crypto");

/* ------------------------------------------------------------------ *
 * Vault layout
 *
 *   <vault>/
 *     Chapters/
 *       01 Opening Night.md
 *       01 Opening Night.braindump.md
 *     Characters/        <name>.md
 *     Locations/         <name>.md
 *     Worldbuilding/     <name>.md
 *     Plot Threads/      <name>.md
 *     Notes & Ideas/     <name>.md
 *     Braindump/         <name>.md
 *     .trash/            deleted files, never removed automatically
 *
 * Every file is plain Markdown with a small YAML front matter block, so the
 * folder can be copied, synced, versioned or opened in any other editor.
 * ------------------------------------------------------------------ */

const CATEGORIES = [
  { key: "characters", label: "Characters", dir: "Characters" },
  { key: "locations", label: "Locations", dir: "Locations" },
  { key: "worldbuilding", label: "Worldbuilding", dir: "Worldbuilding" },
  { key: "plot", label: "Plot Threads", dir: "Plot Threads" },
  { key: "notes", label: "Notes & Ideas", dir: "Notes & Ideas" },
  { key: "braindump", label: "Braindump", dir: "Braindump" },
];

const CHAPTERS_DIR = "Chapters";
const TRASH_DIR = ".trash";
const BRAINDUMP_SUFFIX = ".braindump.md";

let mainWindow = null;
let config = { vaultPath: null, theme: "paper", lastOpen: null };

/* ---------------------------- config ------------------------------ */

function configFile() {
  return path.join(app.getPath("userData"), "config.json");
}

function loadConfig() {
  try {
    config = { ...config, ...JSON.parse(fs.readFileSync(configFile(), "utf8")) };
  } catch {
    /* first run */
  }
  if (!config.vaultPath) {
    config.vaultPath = path.join(app.getPath("documents"), "OpenWrite");
  }
}

function saveConfig() {
  try {
    fs.mkdirSync(path.dirname(configFile()), { recursive: true });
    fs.writeFileSync(configFile(), JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Could not save config:", err);
  }
}

/* ------------------------- front matter --------------------------- */

function needsQuotes(value) {
  if (value === "") return true;
  if (value !== value.trim()) return true;
  return /^[-?:,[\]{}#&*!|>'"%@`]|: |#/.test(value);
}

function serializeFrontmatter(meta) {
  const lines = ["---"];
  for (const [key, raw] of Object.entries(meta)) {
    if (raw === undefined || raw === null) continue;
    const value = String(raw);
    if (value.includes("\n")) {
      lines.push(`${key}: |`);
      for (const line of value.split("\n")) lines.push(line ? `  ${line}` : "");
    } else if (needsQuotes(value)) {
      lines.push(`${key}: "${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function unquote(value) {
  const trimmed = value.trim();
  if (trimmed.length > 1 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (trimmed.length > 1 && trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontmatter(text) {
  const normalized = String(text).replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) return { meta: {}, body: normalized };

  const lines = normalized.split("\n");
  const meta = {};
  let i = 1;
  while (i < lines.length && lines[i] !== "---") {
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(lines[i]);
    if (!match) {
      i += 1;
      continue;
    }
    const key = match[1];
    const rest = match[2].trim();
    if (rest === "|" || rest === "|-" || rest === ">") {
      const block = [];
      i += 1;
      while (i < lines.length && lines[i] !== "---") {
        const blockLine = lines[i];
        if (blockLine === "") block.push("");
        else if (blockLine.startsWith("  ")) block.push(blockLine.slice(2));
        else break;
        i += 1;
      }
      while (block.length && block[block.length - 1] === "") block.pop();
      meta[key] = block.join("\n");
      continue;
    }
    meta[key] = unquote(rest);
    i += 1;
  }
  const body = lines
    .slice(i + 1)
    .join("\n")
    .replace(/^\n+/, "");
  return { meta, body };
}

/* ---------------------------- helpers ----------------------------- */

function newId(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

function safeName(title) {
  const cleaned = String(title || "")
    .replace(/[<>:"/\\|?*]/g, " ")
    // biome-ignore lint: strip control characters that are illegal in file names
    .replace(/[\u0000-\u001F]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[.\s]+|[.\s]+$/g, "")
    .slice(0, 80)
    .trim();
  return cleaned || "Untitled";
}

function vaultPath() {
  return config.vaultPath;
}

function countWords(text) {
  const plain = String(text || "")
    .replace(/[#*_>`~[\]()]/g, " ")
    .trim();
  return plain ? plain.split(/\s+/).length : 0;
}

const README_LINES = [
  "OpenWrite Studio - your local writing vault",
  "",
  "Everything in this folder is yours. Plain Markdown files, plain folders.",
  "Copy it, zip it, back it up, put it in git, open it in any editor.",
  "",
  "  Chapters/        the manuscript, numbered in reading order.",
  "                   <chapter>.braindump.md holds that chapter's braindump.",
  "  Characters/      Locations/  Worldbuilding/  Plot Threads/",
  "  Notes & Ideas/   Braindump/  - the story bible.",
  "  .trash/          deleted files land here. Nothing is erased for good.",
  "",
  "The block between the --- lines stores the title and the synopsis.",
  "Edit these files by hand if you like; the app reads them back on launch.",
  "",
];

async function ensureVault() {
  const root = vaultPath();
  await fsp.mkdir(path.join(root, CHAPTERS_DIR), { recursive: true });
  for (const category of CATEGORIES) {
    await fsp.mkdir(path.join(root, category.dir), { recursive: true });
  }
  const readme = path.join(root, "README.txt");
  if (!fs.existsSync(readme)) {
    await fsp.writeFile(readme, README_LINES.join("\n"), "utf8");
  }
  return root;
}

function uniquePath(dir, base, ext, keepPath) {
  const keep = keepPath ? path.resolve(keepPath) : null;
  let candidate = path.join(dir, `${base}${ext}`);
  let n = 2;
  while (fs.existsSync(candidate) && path.resolve(candidate) !== keep) {
    candidate = path.join(dir, `${base} (${n})${ext}`);
    n += 1;
  }
  return candidate;
}

async function moveToTrash(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  const trash = path.join(vaultPath(), TRASH_DIR);
  await fsp.mkdir(trash, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const target = uniquePath(trash, `${stamp} ${path.parse(filePath).name}`, path.extname(filePath));
  await fsp.rename(filePath, target);
}

/* ----------------------------- load ------------------------------- */

async function readChapters() {
  const dir = path.join(vaultPath(), CHAPTERS_DIR);
  let files = [];
  try {
    files = await fsp.readdir(dir);
  } catch {
    return [];
  }

  const chapters = [];
  for (const file of files.filter((f) => f.endsWith(".md") && !f.endsWith(BRAINDUMP_SUFFIX))) {
    const { meta, body } = parseFrontmatter(await fsp.readFile(path.join(dir, file), "utf8"));
    const base = file.slice(0, -3);
    const brainFile = path.join(dir, `${base}${BRAINDUMP_SUFFIX}`);
    let brain = { meta: {}, body: "" };
    if (fs.existsSync(brainFile)) {
      brain = parseFrontmatter(await fsp.readFile(brainFile, "utf8"));
    }
    const prefix = /^(\d+)/.exec(file);
    chapters.push({
      id: meta.id || newId("ch"),
      title: meta.title || base.replace(/^\d+\s*/, ""),
      synopsis: meta.synopsis || "",
      body,
      braindump: brain.body,
      braindumpSynopsis: brain.meta.synopsis || "",
      order: Number(meta.order || (prefix ? prefix[1] : 0)) || 0,
      file,
    });
  }

  chapters.sort((a, b) => a.order - b.order || a.file.localeCompare(b.file));
  return chapters;
}

async function readCategory(category) {
  const dir = path.join(vaultPath(), category.dir);
  let files = [];
  try {
    files = await fsp.readdir(dir);
  } catch {
    return [];
  }
  const items = [];
  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const { meta, body } = parseFrontmatter(await fsp.readFile(path.join(dir, file), "utf8"));
    items.push({
      id: meta.id || newId(category.key),
      title: meta.title || file.slice(0, -3),
      tagline: meta.tagline || "",
      synopsis: meta.synopsis || "",
      body,
      order: Number(meta.order || 0) || 0,
      file,
    });
  }
  items.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return items;
}

async function loadProject() {
  await ensureVault();
  const categories = {};
  for (const category of CATEGORIES) {
    categories[category.key] = await readCategory(category);
  }
  return {
    vaultPath: vaultPath(),
    theme: config.theme,
    lastOpen: config.lastOpen,
    chapters: await readChapters(),
    categories,
    categoryMeta: CATEGORIES,
  };
}

/* ----------------------------- write ------------------------------ */

function chapterBase(chapter) {
  return `${String(chapter.order).padStart(2, "0")} ${safeName(chapter.title)}`;
}

async function writeChapter(chapter) {
  const dir = path.join(vaultPath(), CHAPTERS_DIR);
  await fsp.mkdir(dir, { recursive: true });

  const oldFile = chapter.file ? path.join(dir, chapter.file) : null;
  const oldBrain = oldFile ? `${oldFile.slice(0, -3)}${BRAINDUMP_SUFFIX}` : null;

  let target = path.join(dir, `${chapterBase(chapter)}.md`);
  if (!oldFile || path.resolve(oldFile) !== path.resolve(target)) {
    target = uniquePath(dir, chapterBase(chapter), ".md", oldFile);
  }
  const brainTarget = `${target.slice(0, -3)}${BRAINDUMP_SUFFIX}`;

  if (oldFile && fs.existsSync(oldFile) && path.resolve(oldFile) !== path.resolve(target)) {
    await fsp.rename(oldFile, target);
    if (oldBrain && fs.existsSync(oldBrain)) await fsp.rename(oldBrain, brainTarget);
  }

  const head = serializeFrontmatter({
    id: chapter.id,
    title: chapter.title,
    order: chapter.order,
    words: countWords(chapter.body),
    updated: new Date().toISOString(),
    synopsis: chapter.synopsis,
  });
  await fsp.writeFile(target, `${head}\n\n${chapter.body || ""}\n`, "utf8");

  const brainHead = serializeFrontmatter({
    id: `${chapter.id}-braindump`,
    title: `${chapter.title} - Braindump`,
    updated: new Date().toISOString(),
    synopsis: chapter.braindumpSynopsis,
  });
  await fsp.writeFile(brainTarget, `${brainHead}\n\n${chapter.braindump || ""}\n`, "utf8");

  return path.basename(target);
}

async function writeItem(categoryKey, item) {
  const category = CATEGORIES.find((c) => c.key === categoryKey);
  if (!category) throw new Error(`Unknown category: ${categoryKey}`);
  const dir = path.join(vaultPath(), category.dir);
  await fsp.mkdir(dir, { recursive: true });

  const oldFile = item.file ? path.join(dir, item.file) : null;
  let target = path.join(dir, `${safeName(item.title)}.md`);
  if (!oldFile || path.resolve(oldFile) !== path.resolve(target)) {
    target = uniquePath(dir, safeName(item.title), ".md", oldFile);
  }
  if (oldFile && fs.existsSync(oldFile) && path.resolve(oldFile) !== path.resolve(target)) {
    await fsp.rename(oldFile, target);
  }

  const head = serializeFrontmatter({
    id: item.id,
    title: item.title,
    tagline: item.tagline,
    order: item.order,
    updated: new Date().toISOString(),
    synopsis: item.synopsis,
  });
  await fsp.writeFile(target, `${head}\n\n${item.body || ""}\n`, "utf8");
  return path.basename(target);
}

/* ------------------------------ IPC ------------------------------- */

function registerIpc() {
  ipcMain.handle("project:load", () => loadProject());

  ipcMain.handle("vault:choose", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choose your writing folder",
      defaultPath: vaultPath(),
      properties: ["openDirectory", "createDirectory"],
      buttonLabel: "Use this folder",
    });
    if (result.canceled || !result.filePaths[0]) return null;
    config.vaultPath = result.filePaths[0];
    saveConfig();
    return loadProject();
  });

  ipcMain.handle("vault:reveal", async () => {
    await ensureVault();
    await shell.openPath(vaultPath());
    return true;
  });

  ipcMain.handle("chapter:save", (_event, chapter) => writeChapter(chapter));

  ipcMain.handle("chapter:delete", async (_event, chapter) => {
    const dir = path.join(vaultPath(), CHAPTERS_DIR);
    if (chapter.file) {
      await moveToTrash(path.join(dir, chapter.file));
      await moveToTrash(path.join(dir, `${chapter.file.slice(0, -3)}${BRAINDUMP_SUFFIX}`));
    }
    return true;
  });

  // Two-phase rename: park every file under a temp name first so shuffled
  // chapter numbers can never collide mid-flight.
  ipcMain.handle("chapters:reorder", async (_event, chapters) => {
    const dir = path.join(vaultPath(), CHAPTERS_DIR);
    const staged = [];
    for (const chapter of chapters) {
      const from = chapter.file ? path.join(dir, chapter.file) : null;
      if (!from || !fs.existsSync(from)) {
        staged.push({ chapter, tmp: null, tmpBrain: null });
        continue;
      }
      const tmp = path.join(dir, `~${chapter.id}.md`);
      const tmpBrain = path.join(dir, `~${chapter.id}${BRAINDUMP_SUFFIX}`);
      const fromBrain = `${from.slice(0, -3)}${BRAINDUMP_SUFFIX}`;
      await fsp.rename(from, tmp);
      if (fs.existsSync(fromBrain)) await fsp.rename(fromBrain, tmpBrain);
      staged.push({ chapter, tmp, tmpBrain });
    }

    const result = [];
    for (const { chapter, tmp, tmpBrain } of staged) {
      const target = uniquePath(dir, chapterBase(chapter), ".md");
      if (tmp && fs.existsSync(tmp)) {
        await fsp.rename(tmp, target);
        if (tmpBrain && fs.existsSync(tmpBrain)) {
          await fsp.rename(tmpBrain, `${target.slice(0, -3)}${BRAINDUMP_SUFFIX}`);
        }
      }
      const file = await writeChapter({ ...chapter, file: path.basename(target) });
      result.push({ id: chapter.id, file });
    }
    return result;
  });

  ipcMain.handle("item:save", (_event, { category, item }) => writeItem(category, item));

  ipcMain.handle("item:delete", async (_event, { category, item }) => {
    const meta = CATEGORIES.find((c) => c.key === category);
    if (meta && item.file) await moveToTrash(path.join(vaultPath(), meta.dir, item.file));
    return true;
  });

  ipcMain.handle("config:set", (_event, patch) => {
    config = { ...config, ...patch };
    saveConfig();
    if (patch.theme) {
      nativeTheme.themeSource = patch.theme === "dark" ? "dark" : "light";
      applyTitleBar(patch.theme);
    }
    return true;
  });

  ipcMain.handle("app:confirm", async (_event, { title, message, confirmLabel }) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: [confirmLabel || "Delete", "Cancel"],
      defaultId: 1,
      cancelId: 1,
      title: "OpenWrite Studio",
      message: title || "Are you sure?",
      detail: message,
      noLink: true,
    });
    return result.response === 0;
  });

  ipcMain.handle("app:export", async (_event, { suggestedName, contents }) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export manuscript",
      defaultPath: path.join(app.getPath("documents"), suggestedName),
      filters: [{ name: "Markdown", extensions: ["md"] }],
    });
    if (result.canceled || !result.filePath) return null;
    await fsp.writeFile(result.filePath, contents, "utf8");
    shell.showItemInFolder(result.filePath);
    return result.filePath;
  });
}

/* ---------------------------- window ------------------------------ */

const TITLEBAR = {
  paper: { color: "#efe7da", symbolColor: "#5b5148" },
  dark: { color: "#15171b", symbolColor: "#c9c5bf" },
};

function applyTitleBar(theme) {
  if (!mainWindow) return;
  const palette = TITLEBAR[theme] || TITLEBAR.paper;
  try {
    mainWindow.setTitleBarOverlay({ ...palette, height: 46 });
  } catch {
    /* platform without overlay support */
  }
}

function createWindow() {
  const palette = TITLEBAR[config.theme] || TITLEBAR.paper;
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 940,
    minHeight: 620,
    backgroundColor: palette.color,
    show: false,
    autoHideMenuBar: true,
    title: "OpenWrite Studio",
    titleBarStyle: "hidden",
    titleBarOverlay: process.platform === "darwin" ? true : { ...palette, height: 46 },
    trafficLightPosition: { x: 14, y: 15 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "app", "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Nothing in this app is meant to reach the internet: open real links in the
  // user's browser instead, and never let the window itself navigate away.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      if (/^https?:/.test(url)) shell.openExternal(url);
    }
  });
}

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  loadConfig();
  nativeTheme.themeSource = config.theme === "dark" ? "dark" : "light";
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
