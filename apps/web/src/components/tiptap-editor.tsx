import Placeholder from "@tiptap/extension-placeholder"
import Typography from "@tiptap/extension-typography"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Separator } from "./ui/separator"

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
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Typography,
    ],
    content,
    onUpdate: ({ editor: editorInstance }) => {
      const html = editorInstance.getHTML()
      onUpdate?.(html)
    },
    editorProps: {
      attributes: {
        class: "mx-auto focus:outline-none min-h-[400px] p-4 text-foreground",
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Write</CardTitle>
          <div className="flex gap-2">
            <Button
              className={editor.isActive("bold") ? "bg-secondary" : ""}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              onClick={() => editor.chain().focus().toggleBold().run()}
              size="sm"
              variant="outline"
            >
              Bold
            </Button>
            <Button
              className={editor.isActive("italic") ? "bg-secondary" : ""}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              size="sm"
              variant="outline"
            >
              Italic
            </Button>
            <Button
              className={editor.isActive("heading", { level: 1 }) ? "bg-secondary" : ""}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              size="sm"
              variant="outline"
            >
              H1
            </Button>
            <Button
              className={editor.isActive("heading", { level: 2 }) ? "bg-secondary" : ""}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              size="sm"
              variant="outline"
            >
              H2
            </Button>
            <Button
              className={editor.isActive("bulletList") ? "bg-secondary" : ""}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              size="sm"
              variant="outline"
            >
              List
            </Button>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <EditorContent editor={editor} />
      </CardContent>
    </Card>
  )
}
