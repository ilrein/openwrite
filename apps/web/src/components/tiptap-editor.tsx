import { Highlight } from "@tiptap/extension-highlight"
import { HorizontalRule } from "@tiptap/extension-horizontal-rule"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import Placeholder from "@tiptap/extension-placeholder"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Selection } from "@tiptap/extensions"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"
// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap-ui/color-highlight-popover"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { LinkButton, LinkContent, LinkPopover } from "@/components/tiptap-ui/link-popover"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"
// --- UI Primitives ---
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import { Toolbar, ToolbarGroup, ToolbarSeparator } from "@/components/tiptap-ui-primitive/toolbar"

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

// --- Types ---
interface TiptapEditorProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

export default function TiptapEditor({
  content = "",
  onUpdate,
  placeholder = "Start writing...",
}: TiptapEditorProps) {
  const editor = useEditor({
    shouldRerenderOnTransaction: true,
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        dropcursor: { color: "var(--tiptap-color-primary)" },
        // Ensure bold and italic are enabled in StarterKit with default shortcuts
        bold: {
          HTMLAttributes: {
            class: "font-bold",
          },
        },
        italic: {
          HTMLAttributes: {
            class: "italic",
          },
        },
        strike: {
          HTMLAttributes: {
            class: "line-through",
          },
        },
        code: {
          HTMLAttributes: {
            class: "rounded-md bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
          },
        },
        // Configure underline within StarterKit (since it's included by default)
        underline: {
          HTMLAttributes: {
            class: "underline",
          },
        },
      }),
      Selection,
      Image.configure({ allowBase64: true }),
      ImageUploadNode,
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.getHTML()
      onUpdate?.(html)
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-full p-6",
      },
    },
  })

  if (!editor) {
    return <div className="animate-pulse">Loading editor...</div>
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="tiptap-editor-container flex h-full w-full flex-col bg-background">
        <Toolbar>
          <ToolbarGroup>
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <HeadingDropdownMenu />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <MarkButton type="bold" />
            <MarkButton type="italic" />
            <MarkButton type="underline" />
            <MarkButton type="strike" />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <ColorHighlightPopover>
              <ColorHighlightPopoverButton />
              <ColorHighlightPopoverContent />
            </ColorHighlightPopover>
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <TextAlignButton align="left" />
            <TextAlignButton align="center" />
            <TextAlignButton align="right" />
            <TextAlignButton align="justify" />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <ListDropdownMenu />
            <BlockquoteButton />
            <CodeBlockButton />
          </ToolbarGroup>

          <ToolbarSeparator />

          <ToolbarGroup>
            <LinkPopover>
              <LinkButton />
              <LinkContent />
            </LinkPopover>
            <ImageUploadButton />
          </ToolbarGroup>

          <Spacer />
        </Toolbar>

        <button
          aria-label="Text editor content area"
          className="tiptap-editor-content h-full flex-1 cursor-text overflow-auto text-left"
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus("end")
            }
          }}
          type="button"
        >
          <EditorContent className="h-full" editor={editor} />
        </button>
      </div>
    </EditorContext.Provider>
  )
}
