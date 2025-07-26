import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Clock, Edit, FileText, Plus, TrendingUp, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { EditProjectDialog } from "@/components/edit-project-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { api, type Project } from "@/lib/api"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  const [editingProject, setEditingProject] = useState<Project | null>(null)

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
                  <div
                    className="flex flex-col space-y-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:space-y-0"
                    key={project.id}
                  >
                    <div className="flex min-w-0 flex-1 items-center space-x-4">
                      <BookOpen className="h-8 w-8 flex-shrink-0 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{project.title}</p>
                        <p className="truncate text-muted-foreground text-sm">
                          {project.currentWordCount.toLocaleString()} words
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center space-x-2 sm:ml-4">
                      <Badge variant={project.status === "draft" ? "secondary" : "default"}>
                        {project.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingProject(project)}
                          size="sm"
                          variant="ghost"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button asChild className="h-8 px-3" size="sm" variant="default">
                          <Link params={{ projectId: project.id }} to="/write/$projectId">
                            <FileText className="mr-1 h-3 w-3" />
                            Write
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
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

        {/* Edit Project Dialog */}
        {editingProject && (
          <EditProjectDialog
            onOpenChange={(open) => {
              if (!open) {
                setEditingProject(null)
              }
            }}
            open={!!editingProject}
            project={editingProject}
          />
        )}
      </div>
    </div>
  )
}
