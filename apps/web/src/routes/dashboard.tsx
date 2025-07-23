import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  BarChart3,
  Calendar,
  ChevronUp,
  Download,
  FileText,
  FolderOpen,
  LogOut,
  PenTool,
  Plus,
  Save,
  Settings,
  Share,
  User,
} from "lucide-react"
import { useEffect, useState } from "react"
import TiptapEditor from "@/components/tiptap-editor"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { fetchSessionData } from "@/lib/auth-client"

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const queryClient = useQueryClient()
  const [content, setContent] = useState("<p>Welcome to your writing space! Start typing...</p>")

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSessionData,
    retry: 2,
    staleTime: 0, // Always consider stale
    gcTime: 0, // Don't cache
  })

  useEffect(() => {
    // Only redirect if query is not loading and definitely not authenticated
    if (!sessionQuery.isLoading && sessionQuery.data && !sessionQuery.data.authenticated) {
      navigate({
        to: "/login",
      })
    }
  }, [sessionQuery.data, sessionQuery.isLoading, navigate])

  const handleContentUpdate = (newContent: string) => {
    setContent(newContent)
    // Here you would typically save to your backend
    console.log("Content updated:", newContent)
  }

  const handleSave = () => {
    // Implement save functionality
    console.log("Saving content:", content)
    // You could show a toast notification here
  }

  const handleSignOut = async () => {
    try {
      const baseUrl =
        import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
          ? import.meta.env.VITE_SERVER_URL
          : window.location.origin

      await fetch(`${baseUrl}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      })

      // Invalidate session query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["session"] })
      navigate({ to: "/" })
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  if (sessionQuery.isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading your writing space...</div>
      </div>
    )
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Redirecting to login...</div>
      </div>
    )
  }

  const menuItems = [
    {
      title: "Documents",
      items: [
        { title: "New Document", icon: Plus, action: () => setContent("<p>New document...</p>") },
        { title: "Recent Files", icon: FileText, action: () => console.log("Recent files") },
        { title: "All Documents", icon: FolderOpen, action: () => console.log("All documents") },
      ],
    },
    {
      title: "Actions",
      items: [
        { title: "Save", icon: Save, action: handleSave },
        { title: "Export", icon: Download, action: () => console.log("Export") },
        { title: "Share", icon: Share, action: () => console.log("Share") },
      ],
    },
    {
      title: "Tools",
      items: [
        { title: "Writing Stats", icon: BarChart3, action: () => console.log("Stats") },
        { title: "Writing Tools", icon: PenTool, action: () => console.log("Tools") },
        { title: "Calendar", icon: Calendar, action: () => console.log("Calendar") },
      ],
    },
  ]

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-2 px-4 py-2">
              <PenTool className="h-6 w-6" />
              <span className="font-bold">OpenWrite</span>
            </div>
          </SidebarHeader>

          <SidebarContent>
            {menuItems.map((group) => (
              <SidebarGroup key={group.title}>
                <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton className="w-full" onClick={item.action}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton className="w-full">
                      <User className="h-4 w-4" />
                      <span>{sessionQuery.data?.session?.user?.name || "User"}</span>
                      <ChevronUp className="ml-auto h-4 w-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="mb-2 w-56"
                    side="top"
                    sideOffset={8}
                  >
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-1 flex-col">
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger />
            <div className="flex-1">
              <h1 className="font-semibold text-lg">
                Welcome back, {sessionQuery.data?.session?.user?.name || "Writer"}!
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-muted-foreground text-sm">
                {
                  content
                    .replace(/<[^>]*>/g, "")
                    .split(/\s+/)
                    .filter((word) => word.length > 0).length
                }{" "}
                words
              </div>
              <div className="text-green-600 text-sm">Auto-saving</div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            <TiptapEditor
              content={content}
              onUpdate={handleContentUpdate}
              placeholder="What's on your mind today?"
            />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
