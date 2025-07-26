import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { api, type Project } from "@/lib/api"

export const Route = createFileRoute("/dashboard/projects")({
  component: ProjectsPage,
})

interface CreateProjectForm {
  title: string
  description: string
  type: "novel" | "trilogy" | "series" | "short_story_collection" | "graphic_novel" | "screenplay"
  genre: string
  targetWordCount: string
  visibility: "private" | "organization" | "public"
}

function ProjectsPage() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateProjectForm>({
    title: "",
    description: "",
    type: "novel",
    genre: "",
    targetWordCount: "",
    visibility: "private",
  })

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const result = await api.projects.list()
      return result
    },
  })

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const result = await api.projects.create({
        title: data.title,
        description: data.description || null,
        type: data.type,
        genre: data.genre || null,
        targetWordCount: data.targetWordCount ? Number.parseInt(data.targetWordCount, 10) : null,
        visibility: data.visibility,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      setIsCreateDialogOpen(false)
      setCreateForm({
        title: "",
        description: "",
        type: "novel",
        genre: "",
        targetWordCount: "",
        visibility: "private",
      })
      toast.success("Project created successfully!")
    },
    onError: (_error) => {
      toast.error("Failed to create project")
    },
  })

  const handleCreateProject = () => {
    if (!createForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    createProjectMutation.mutate(createForm)
  }

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-lg">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Projects</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title and Action */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">My Projects</h1>
              <p className="mt-2">Manage your writing projects</p>
            </div>

            <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Start your next writing project. You can always edit these details later.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, title: e.target.value }))
                      }
                      placeholder="The Great Adventure"
                      value={createForm.title}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="A brief description of your project..."
                      value={createForm.description}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Project Type</Label>
                      <Select
                        onValueChange={(
                          value:
                            | "novel"
                            | "trilogy"
                            | "series"
                            | "short_story_collection"
                            | "graphic_novel"
                            | "screenplay"
                        ) => setCreateForm((prev) => ({ ...prev, type: value }))}
                        value={createForm.type}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="novel">Novel</SelectItem>
                          <SelectItem value="trilogy">Trilogy</SelectItem>
                          <SelectItem value="series">Series</SelectItem>
                          <SelectItem value="short_story_collection">
                            Short Story Collection
                          </SelectItem>
                          <SelectItem value="graphic_novel">Graphic Novel</SelectItem>
                          <SelectItem value="screenplay">Screenplay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="genre">Genre</Label>
                        <Input
                          id="genre"
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, genre: e.target.value }))
                          }
                          placeholder="e.g., Fantasy, Sci-Fi"
                          value={createForm.genre}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetWordCount">Target Words</Label>
                        <Input
                          id="targetWordCount"
                          onChange={(e) =>
                            setCreateForm((prev) => ({ ...prev, targetWordCount: e.target.value }))
                          }
                          placeholder="50000"
                          type="number"
                          value={createForm.targetWordCount}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        onValueChange={(value: "private" | "organization" | "public") =>
                          setCreateForm((prev) => ({ ...prev, visibility: value }))
                        }
                        value={createForm.visibility}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="organization">Organization</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button disabled={createProjectMutation.isPending} onClick={handleCreateProject}>
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Projects Grid */}
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Project) => (
              <Link key={project.id} params={{ projectId: project.id }} to="/write/$projectId">
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <Badge variant={project.status === "draft" ? "secondary" : "default"}>
                        {project.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{project.title}</CardTitle>
                    {project.description && (
                      <CardDescription className="line-clamp-2">
                        {project.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-gray-600 text-sm">
                        <span className="font-medium">Type:</span>{" "}
                        {project.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      {project.genre && (
                        <div className="text-gray-600 text-sm">
                          <span className="font-medium">Genre:</span> {project.genre}
                        </div>
                      )}
                      <div className="text-gray-600 text-sm">
                        <span className="font-medium">Progress:</span>{" "}
                        {project.currentWordCount.toLocaleString()} /{" "}
                        {project.targetWordCount?.toLocaleString() || "∞"} words
                      </div>
                      {project.targetWordCount && (
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min((project.currentWordCount / project.targetWordCount) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <BookOpen className="mx-auto mb-4 h-16 w-16 opacity-50" />
            <h3 className="mb-2 font-medium text-xl">No projects yet</h3>
            <p className="mb-6">Create your first project to get started writing!</p>
            <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
