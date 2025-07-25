import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Clock, Plus, TrendingUp, Users } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { api, type Project } from "@/lib/api"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  // Fetch projects for overview
  const {
    data: projects,
    isError,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await api.projects.list()
      return result
    },
    retry: 2,
    retryDelay: 1000,
  })

  // Handle error with toast notification
  useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load projects. Please try refreshing the page.")
    }
  }, [isError, error])

  const totalWords = projects?.reduce((sum, project) => sum + project.currentWordCount, 0) || 0
  const activeProjects =
    projects?.filter((project) => project.status === "in_progress" || project.status === "draft") ||
    []
  const recentProjects = projects?.slice(0, 3) || []

  // Handle error state
  if (isError) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h2 className="mb-2 font-semibold text-2xl text-destructive">
                Unable to load dashboard
              </h2>
              <p className="mb-4 text-muted-foreground">
                There was a problem loading your writing data. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>Refresh Page</Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-bold text-3xl">Welcome back!</h1>
          <p className="mt-2 text-muted-foreground">Here's what's happening with your writing.</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Total Projects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{projects?.length || 0}</div>
              <p className="text-muted-foreground text-xs">
                {activeProjects.length} active projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Total Words</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{totalWords.toLocaleString()}</div>
              <p className="text-muted-foreground text-xs">Across all projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">This Week</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">2,341</div>
              <p className="text-muted-foreground text-xs">Words written</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-medium text-sm">Organization</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">1</div>
              <p className="text-muted-foreground text-xs">Team member</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Novels */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Your latest writing projects</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/projects">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project: Project) => (
                  <Link
                    className="block"
                    key={project.id}
                    params={{ projectId: project.id }}
                    to="/projects/$projectId/write"
                  >
                    <div className="flex cursor-pointer flex-col space-y-3 rounded-lg p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                      <div className="flex items-center space-x-4">
                        <BookOpen className="h-8 w-8 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{project.title}</p>
                          <p className="text-muted-foreground text-sm">
                            {project.currentWordCount.toLocaleString()} words
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={project.status === "draft" ? "secondary" : "default"}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}

                {recentProjects.length === 0 && (
                  <div className="py-8 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="mb-4 text-muted-foreground">No projects yet</p>
                    <Button asChild>
                      <Link to="/dashboard/projects">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Project
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Writing Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Writing Progress</CardTitle>
              <CardDescription>Goal completion across projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeProjects.slice(0, 3).map((project: Project) => {
                  const progress = project.targetWordCount
                    ? Math.min((project.currentWordCount / project.targetWordCount) * 100, 100)
                    : 0

                  return (
                    <div className="space-y-2" key={project.id}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-muted-foreground text-sm">{Math.round(progress)}%</p>
                      </div>
                      <Progress className="h-2" value={progress} />
                      <p className="text-muted-foreground text-xs">
                        {project.currentWordCount.toLocaleString()} /{" "}
                        {project.targetWordCount?.toLocaleString() || "∞"} words
                      </p>
                    </div>
                  )
                })}

                {activeProjects.length === 0 && (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No active projects with word goals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
