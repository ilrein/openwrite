import { MessageCircle } from "lucide-react"
import { useState } from "react"
import { AIWritingSidebar } from "@/components/ai-writing-sidebar"
import TiptapEditor from "@/components/tiptap-editor"
import { Button } from "@/components/ui/button"
import { Sidebar, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface SidebarWritingInterfaceProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

export function SidebarWritingInterface({
  content = "",
  onUpdate,
  placeholder = "Start writing your story...",
}: SidebarWritingInterfaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
    <SidebarProvider defaultOpen={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex h-full w-full">
        {/* Main Editor Area */}
        <SidebarInset className="flex flex-1 flex-col">
          {/* Editor Header with Sidebar Trigger */}
          <header className="flex items-center justify-between border-sidebar-border border-b px-4 py-2">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="text-muted-foreground text-sm">
                {sidebarOpen ? "AI Assistant Open" : "AI Assistant Closed"}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                className="gap-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                size="sm"
                variant="outline"
              >
                <MessageCircle className="h-4 w-4" />
                {sidebarOpen ? "Hide AI" : "Show AI"}
              </Button>
            </div>
          </header>

          {/* TiptapEditor */}
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
