import { AIWritingSidebar } from "@/components/ai-writing-sidebar"
import TiptapEditor from "@/components/tiptap-editor"
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

interface SidebarWritingInterfaceProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
  sidebarOpen?: boolean
  onSidebarOpenChange?: (open: boolean) => void
}

export function SidebarWritingInterface({
  content = "",
  onUpdate,
  placeholder = "Write something beautiful...",
  sidebarOpen = true,
  onSidebarOpenChange,
}: SidebarWritingInterfaceProps) {
  const handleInsertText = (text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    // For demo purposes, we'll just show a notification
    // In a real implementation, you'd use the editor's command API:
    // editor.commands.insertContent(text)
    // Placeholder for demo - would integrate with editor
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = text
  }

  return (
    <SidebarProvider onOpenChange={onSidebarOpenChange} open={sidebarOpen}>
      <div className="flex h-full w-full">
        {/* Main Editor Area */}
        <SidebarInset className="flex flex-1 flex-col">
          {/* TiptapEditor - No header needed */}
          <div className="flex-1">
            <TiptapEditor content={content} onUpdate={onUpdate} placeholder={placeholder} />
          </div>
        </SidebarInset>

        {/* AI Writing Sidebar */}
        <Sidebar collapsible="offcanvas" side="right" variant="sidebar">
          <AIWritingSidebar onInsertText={handleInsertText} />
        </Sidebar>
      </div>
    </SidebarProvider>
  )
}
