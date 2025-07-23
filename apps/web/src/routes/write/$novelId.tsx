import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import {
  Bell,
  BookOpen,
  ChevronRight,
  FileEdit,
  FileText,
  MapPin,
  PenTool,
  Scroll,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import UserMenu from "@/components/user-menu"
import { api } from "@/lib/api"

export const Route = createFileRoute("/write/$novelId")({
  component: WriteLayout,
})

function WriteLayout() {
  const { novelId } = Route.useParams()

  // Fetch novel details
  const { data: novel, isLoading } = useQuery({
    queryKey: ["novel", novelId],
    queryFn: async () => {
      const result = await api.novels.get(novelId)
      return result
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse">Loading novel...</div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl">Novel not found</h2>
          <Link to="/dashboard/novels">
            <Button variant="outline">Back to Novels</Button>
          </Link>
        </div>
      </div>
    )
  }

  const targetWordCount = novel.targetWordCount || 0
  const progressPercentage = targetWordCount
    ? Math.min((novel.currentWordCount / targetWordCount) * 100, 100)
    : 0

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        {/* Writing Sidebar */}
        <Sidebar>
          <SidebarHeader>
            <div className="px-4 py-2">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">
                  {novel.currentWordCount.toLocaleString()} words
                </p>
                {novel.targetWordCount && (
                  <div>
                    <Progress className="h-2" value={progressPercentage} />
                    <p className="mt-1 text-muted-foreground text-xs">
                      {Math.round(progressPercentage)}% of {novel.targetWordCount.toLocaleString()}{" "}
                      word goal
                    </p>
                  </div>
                )}
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Structure</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link params={{ novelId }} to="/write/$novelId/outline">
                        <FileText />
                        <span>Outline</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link params={{ novelId }} to="/write/$novelId/write">
                        <PenTool />
                        <span>Write</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Chapters</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton>
                                <ChevronRight className="h-4 w-4" />
                                <span className="truncate">
                                  Chapter 1: The Beginning and the Call to Adventure
                                </span>
                                <Badge className="ml-auto" variant="secondary">
                                  3
                                </Badge>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chapter 1: The Beginning and the Call to Adventure</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 1: Opening
                          </Button>
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 2: Conflict
                          </Button>
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 3: Resolution
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <SidebarMenuButton>
                                <ChevronRight className="h-4 w-4" />
                                <span className="truncate">
                                  Chapter 2: The Journey Through the Dark Forest
                                </span>
                                <Badge className="ml-auto" variant="secondary">
                                  2
                                </Badge>
                              </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Chapter 2: The Journey Through the Dark Forest</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 space-y-1">
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 1: Departure
                          </Button>
                          <Button className="w-full justify-start" size="sm" variant="ghost">
                            Scene 2: Discovery
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <div className="p-4">
              <Button className="w-full" size="sm">
                <FileEdit className="mr-2 h-4 w-4" />
                Quick Notes
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-16 items-center justify-between border-b px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard/novels">Novels</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{novel.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <Badge variant="outline">{novel.status}</Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* Codex Drawer */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Codex
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-96" side="right">
                  <SheetHeader>
                    <SheetTitle>Novel Codex</SheetTitle>
                  </SheetHeader>

                  <Tabs className="mt-4" defaultValue="characters">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="characters">
                        <Users className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="locations">
                        <MapPin className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="lore">
                        <Scroll className="h-4 w-4" />
                      </TabsTrigger>
                      <TabsTrigger value="plot">
                        <FileText className="h-4 w-4" />
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent className="mt-4" value="characters">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Aria</CardTitle>
                            <CardDescription>Protagonist</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">A young mage discovering her powers...</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Kellan</CardTitle>
                            <CardDescription>Mentor</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              An experienced warrior with a mysterious past...
                            </p>
                          </CardContent>
                        </Card>
                        <Button className="w-full" size="sm" variant="outline">
                          <Link
                            params={{ novelId, type: "characters" }}
                            to="/write/$novelId/codex/$type"
                          >
                            View All Characters
                          </Link>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent className="mt-4" value="locations">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">The Dark Forest</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              An ancient forest filled with magical creatures...
                            </p>
                          </CardContent>
                        </Card>
                        <Button className="w-full" size="sm" variant="outline">
                          <Link
                            params={{ novelId, type: "locations" }}
                            to="/write/$novelId/codex/$type"
                          >
                            View All Locations
                          </Link>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent className="mt-4" value="lore">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Magic System</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">Elemental magic drawn from nature...</p>
                          </CardContent>
                        </Card>
                        <Button className="w-full" size="sm" variant="outline">
                          <Link params={{ novelId, type: "lore" }} to="/write/$novelId/codex/$type">
                            View All Lore
                          </Link>
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent className="mt-4" value="plot">
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Quest for the Crystal</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              Main plot thread following the ancient prophecy...
                            </p>
                          </CardContent>
                        </Card>
                        <Button className="w-full" size="sm" variant="outline">
                          <Link params={{ novelId, type: "plot" }} to="/write/$novelId/codex/$type">
                            View All Plot Threads
                          </Link>
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </SheetContent>
              </Sheet>

              <Button size="sm" variant="ghost">
                Word Count: {novel.currentWordCount.toLocaleString()}
              </Button>

              {/* Notifications Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <Bell className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <UserMenu />
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>

          {/* Status Bar */}
          <footer className="border-t px-6 py-2">
            <div className="flex items-center justify-between text-muted-foreground text-sm">
              <div className="flex items-center gap-4">
                <span>Current Scene: Chapter 1, Scene 2</span>
                <Separator className="h-4" orientation="vertical" />
                <span>Last saved: 2 minutes ago</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">Auto-save: On</Badge>
                <span>Writing session: 45 minutes</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  )
}
