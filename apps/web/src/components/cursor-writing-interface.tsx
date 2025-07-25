import { useState, useRef } from "react"
import { MessageCircle, Sparkles, Maximize2, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import TiptapEditor from "@/components/tiptap-editor"
import { CursorChatPanel } from "@/components/cursor-chat-panel"
import { cn } from "@/lib/utils"

interface CursorWritingInterfaceProps {
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

export function CursorWritingInterface({
  content = "",
  onUpdate,
  placeholder = "Start writing your story..."
}: CursorWritingInterfaceProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const handleInsertText = (text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    // For demo purposes, we'll just show a notification
    console.log("Inserting text:", text)
    // In a real implementation, you'd use the editor's command API:
    // editor.commands.insertContent(text)
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    if (!isFullscreen) {
      editorRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  return (
    <TooltipProvider>
      <div className={cn(
        "relative h-full w-full transition-all duration-300",
        isChatOpen && "pr-96" // Add padding when chat is open
      )}>
        {/* Floating Action Buttons */}
        <div className="absolute top-4 right-4 z-40 flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="h-10 w-10 p-0 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
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
                variant={isChatOpen ? "default" : "outline"}
                size="sm"
                onClick={toggleChat}
                className={cn(
                  "h-10 gap-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background",
                  isChatOpen && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {isChatOpen ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isChatOpen ? "AI" : "Ask AI"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {isChatOpen ? "Close AI assistant" : "Open AI writing assistant"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Editor Container */}
        <div
          ref={editorRef}
          className="h-full w-full relative bg-background"
        >
          {/* Enhanced Editor with Cursor-style Design */}
          <div className="h-full w-full relative">
            <TiptapEditor
              content={content}
              onUpdate={onUpdate}
              placeholder={placeholder}
            />
            
            {/* Subtle overlay when chat is open */}
            {isChatOpen && (
              <div className="absolute inset-0 bg-background/5 pointer-events-none" />
            )}
          </div>

          {/* Writing Progress Indicator */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-sm text-muted-foreground bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Ready to write</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <span>Words: {content.split(' ').filter(word => word.length > 0).length}</span>
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
          <div className="absolute bottom-4 right-4 animate-bounce">
            <div className="bg-primary text-primary-foreground text-xs px-3 py-2 rounded-full shadow-lg">
              Try the AI assistant →
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}