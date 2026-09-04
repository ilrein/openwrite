# OpenWrite Studio (local desktop app)

A Sudowrite-shaped writing desk with no AI, no server, no account, and no
network access. It is an Electron app that reads and writes plain Markdown
files in a folder you choose.

## Run it

```bash
cd desktop
npm install
npm start
```

On Windows you can also double-click `Start OpenWrite Studio.bat`.

> `npm install` downloads the Electron runtime (~200 MB) once. If npm skips the
> postinstall step, run `node node_modules/electron/install.js` to fetch the
> binary.

## Where your writing lives

On first launch the app uses `Documents/OpenWrite`. Change it any time with the
folder button in the title bar. The layout is plain files and folders:

```
<your folder>/
  Chapters/
    01 The Last Ferry.md              chapter text
    01 The Last Ferry.braindump.md    that chapter's braindump
  Characters/      <name>.md
  Locations/       <name>.md
  Worldbuilding/   <name>.md
  Plot Threads/    <name>.md
  Notes & Ideas/   <name>.md
  Braindump/       <name>.md          braindumps not tied to a chapter
  .trash/          deleted files, kept forever
  README.txt
```

Every file is Markdown with a small front matter block holding the title and
the synopsis. Copy the folder, zip it, sync it, or put it in git - nothing else
is needed to read it back, and editing a file by hand works too.

## What is in the window

- **Left rail** - Chapters, then Characters, Locations, Worldbuilding, Plot
  Threads, Notes & Ideas and Braindump. Every group has its own `+ New`.
  Chapters drag to reorder and the files renumber themselves to match.
- **Top toolbar** - paragraph style, bold, italic, underline, strikethrough,
  inline code, bullet and numbered lists, quote, scene break, link, unlink,
  clear formatting, undo, redo.
- **Two tabs per chapter** - the chapter itself and its own braindump.
- **Bottom dock** - a synopsis box for the chapter and a second one for the
  braindump. `Draft from text` fills a box with the opening sentence of each of
  the first paragraphs, as a starting point to rewrite. It is string handling,
  not a model.

## Shortcuts

| | |
|---|---|
| `Ctrl+B` / `Ctrl+I` / `Ctrl+U` | bold / italic / underline |
| `Ctrl+K` | add link |
| `Ctrl+S` | save now (it already autosaves) |
| `Ctrl+N` | new chapter |
| `Ctrl+F` | search everything |
| `Ctrl+\` | focus mode |
| `Ctrl+Shift+E` | export the manuscript as one file |

## Notes

- Autosave runs about half a second after you stop typing, and again whenever
  you switch documents or leave the window.
- Deleting moves the file to `.trash/` inside your folder. Nothing is erased.
- Pasted text is laundered through Markdown, so fonts and colours from a
  browser or Word never enter the manuscript.
- The window blocks its own navigation and opens real links in your browser.
  Nothing in the app talks to the internet.
