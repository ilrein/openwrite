import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { AIChatContent } from "@/components/ai-chat-content"

import { ProjectSidebar } from "@/components/project-sidebar"
import TiptapEditor from "@/components/tiptap-editor"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useIsMobile } from "@/hooks/use-mobile"
import { api } from "@/lib/api"

interface DualSidebarWritingInterfaceProps {
  projectId: string
  content?: string
  onUpdate?: (content: string) => void
  placeholder?: string
}

// Inner component that has access to sidebar context
function DualSidebarWritingInterfaceInner({
  projectId,
  content = "",
  onUpdate,
  placeholder = "Write something beautiful...",
}: DualSidebarWritingInterfaceProps) {
  // Separate state for right sidebar (AI chat) - independent from left sidebar
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const result = await api.projects.get(projectId)
      return result
    },
  })

  // Keyboard shortcut to toggle AI assistant
  useHotkeys(
    "cmd+j, ctrl+j",
    () => {
      setRightSidebarOpen((prev) => !prev)
    },
    {
      preventDefault: true,
      enableOnFormTags: false,
      enableOnContentEditable: false,
    }
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">Project not found</h2>
        </div>
      </div>
    )
  }

  const targetWordCount = project.targetWordCount || 0
  const _progressPercentage = targetWordCount
    ? Math.min((project.currentWordCount / targetWordCount) * 100, 100)
    : 0

  const handleInsertText = (text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    if (onUpdate) {
      onUpdate(content + text)
    }
  }

  return (
    <>
      {/* Project Sidebar */}
      <ProjectSidebar projectId={projectId} />

      {/* Main Content Area */}
      <SidebarInset className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              params={{ projectId }}
              to="/projects/$projectId"
            >
              {project.title}
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-muted-foreground text-sm">
              {project.currentWordCount.toLocaleString()} /{" "}
              {project.targetWordCount?.toLocaleString() || "∞"} words
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-9 w-9 p-0 transition-colors"
                  onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                  size="sm"
                  variant={rightSidebarOpen ? "default" : "outline"}
                >
                  <Sparkles
                    className={`h-4 w-4 ${rightSidebarOpen ? "text-primary-foreground" : "text-muted-foreground"}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>AI Assistant {rightSidebarOpen ? "(Active)" : ""} • Cmd+J</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </header>

        {/* Editor Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-auto">
            <TiptapEditor content={content} onUpdate={onUpdate} placeholder={placeholder} />
          </div>
        </div>
      </SidebarInset>

      {/* Right Sidebar - AI Assistant */}
      {isMobile ? (
        <Sheet onOpenChange={setRightSidebarOpen} open={rightSidebarOpen}>
          <SheetContent className="w-[18rem] bg-background p-0" side="right">
            <SheetHeader className="sr-only">
              <SheetTitle>AI Writing Assistant</SheetTitle>
              <SheetDescription>AI-powered writing help and suggestions</SheetDescription>
            </SheetHeader>
            <div className="flex h-16 items-center gap-2 border-b px-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Writing Assistant</h3>
                <p className="text-muted-foreground text-xs">AI-powered writing help</p>
              </div>
            </div>
            <div className="h-[calc(100vh-4rem)]">
              <AIChatContent onInsertText={handleInsertText} />
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        rightSidebarOpen && (
          <div className="w-96 border-l bg-background">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Writing Assistant</h3>
                  <p className="text-muted-foreground text-xs">AI-powered writing help</p>
                </div>
              </div>
            </div>
            <div className="h-[calc(100vh-4rem)]">
              <AIChatContent onInsertText={handleInsertText} />
            </div>
          </div>
        )
      )}
    </>
  )
}

// Main component that provides the sidebar context
export function DualSidebarWritingInterface(props: DualSidebarWritingInterfaceProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <DualSidebarWritingInterfaceInner {...props} />
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
