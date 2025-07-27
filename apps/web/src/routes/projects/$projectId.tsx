import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"
import { AIChatContent } from "@/components/ai-chat-content"

import { ProjectSidebar } from "@/components/project-sidebar"

import { Button } from "@/components/ui/button"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import WriteHeader from "@/components/write-header"
import { useIsMobile } from "@/hooks/use-mobile"
import { api } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId")({
  component: WriteLayout,
})

function WriteLayout() {
  const { projectId } = Route.useParams()
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const isMobile = useIsMobile()

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

  const handleInsertText = (_text: string) => {
    // This would integrate with the TiptapEditor to insert text at cursor position
    // TODO: Implement text insertion at cursor position
  }

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => await api.projects.get(projectId),
  })

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
          <Link to="/dashboard/projects">Back to Projects</Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Project Sidebar */}
        <ProjectSidebar projectId={projectId} />

        {/* Main Content Area */}
        <SidebarInset className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex h-16 items-center justify-between border-b bg-background/95 pr-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <WriteHeader
              breadcrumbs={[
                { label: "Projects", to: "/dashboard/projects" },
                { label: project.title },
              ]}
            />

            {/* AI Assistant Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setRightSidebarOpen((prev) => !prev)}
                  size="sm"
                  variant="outline"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="sr-only">Toggle AI Assistant</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>AI Assistant (⌘J)</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </SidebarInset>

        {/* Right Sidebar - AI Assistant */}
        {isMobile ? (
          <Sheet onOpenChange={setRightSidebarOpen} open={rightSidebarOpen}>
            <SheetContent className="w-[18rem] bg-background p-0" side="right">
              <SheetHeader className="sr-only">
                <SheetTitle>AI Writing Assistant</SheetTitle>
                <SheetDescription>AI-powered writing help and suggestions</SheetDescription>
              </SheetHeader>
              <AIChatContent onInsertText={handleInsertText} />
            </SheetContent>
          </Sheet>
        ) : (
          rightSidebarOpen && (
            <div className="w-[18rem] border-l bg-background">
              <AIChatContent onInsertText={handleInsertText} />
            </div>
          )
        )}
      </div>
    </SidebarProvider>
  )
}
