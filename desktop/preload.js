"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// The renderer gets exactly these calls and nothing else: no node, no network.
contextBridge.exposeInMainWorld("vault", {
  load: () => ipcRenderer.invoke("project:load"),
  chooseFolder: () => ipcRenderer.invoke("vault:choose"),
  revealFolder: () => ipcRenderer.invoke("vault:reveal"),
  saveChapter: (chapter) => ipcRenderer.invoke("chapter:save", chapter),
  deleteChapter: (chapter) => ipcRenderer.invoke("chapter:delete", chapter),
  reorderChapters: (chapters) => ipcRenderer.invoke("chapters:reorder", chapters),
  saveItem: (category, item) => ipcRenderer.invoke("item:save", { category, item }),
  deleteItem: (category, item) => ipcRenderer.invoke("item:delete", { category, item }),
  setConfig: (patch) => ipcRenderer.invoke("config:set", patch),
  confirm: (options) => ipcRenderer.invoke("app:confirm", options),
  exportManuscript: (options) => ipcRenderer.invoke("app:export", options),
});
