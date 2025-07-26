import { Maximize2, MessageCircle, Minimize2, Sparkles } from "lucide-react"
import { useRef, useState } from "react"
import { CursorChatPanel } from "@/components/cursor-chat-panel"
import TiptapEditor from "@/components/tiptap-editor"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CursorWritingInterfaceProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

export function CursorWritingInterface({
  content = "",
  onUpdate,
  placeholder = "Write something beautiful...",
}: CursorWritingInterfaceProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const handleInsertText = (text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    // For demo purposes, we'll just show a notification
    // In a real implementation, you'd use the editor's command API:
    // editor.commands.insertContent(text)
    // Placeholder for demo - would integrate with editor
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _unused = text
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (isFullscreen) {
      document.exitFullscreen?.()
    } else {
      editorRef.current?.requestFullscreen?.()
    }
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "relative h-full w-full transition-all duration-300",
          isChatOpen && "pr-96" // Add padding when chat is open
        )}
      >
        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 z-40 flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-10 w-10 border-border/50 bg-background/80 p-0 backdrop-blur-sm hover:bg-background"
                onClick={toggleFullscreen}
                size="sm"
                variant="outline"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  "h-10 gap-2 border-border/50 bg-background/80 backdrop-blur-sm hover:bg-background",
                  isChatOpen && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                onClick={toggleChat}
                size="sm"
                variant={isChatOpen ? "default" : "outline"}
              >
                {isChatOpen ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                <span className="font-medium text-sm">{isChatOpen ? "AI" : "Ask AI"}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isChatOpen ? "Close AI assistant" : "Open AI writing assistant"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Editor Container */}
        <div className="relative h-full w-full bg-background" ref={editorRef}>
          {/* Enhanced Editor with Cursor-style Design */}
          <div className="relative h-full w-full">
            <TiptapEditor content={content} onUpdate={onUpdate} placeholder={placeholder} />

            {/* Subtle overlay when chat is open */}
            {isChatOpen && <div className="pointer-events-none absolute inset-0 bg-background/5" />}
          </div>

          {/* Writing Progress Indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg border border-border/50 bg-background/80 px-3 py-2 text-muted-foreground text-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span>Ready to write</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span>Words: {content.split(" ").filter((word) => word.length > 0).length}</span>
          </div>
        </div>

        {/* Chat Panel */}
        <CursorChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onInsertText={handleInsertText}
        />

        {/* Chat Toggle Hint */}
        {!isChatOpen && (
          <div className="absolute right-4 bottom-4 animate-bounce">
            <div className="rounded-full bg-primary px-3 py-2 text-primary-foreground text-xs shadow-lg">
              Try the AI assistant →
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
