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
import { api, type Novel } from "@/lib/api"

export const Route = createFileRoute("/dashboard/novels")({
  component: NovelsPage,
})

interface CreateNovelForm {
  title: string
  description: string
  genre: string
  targetWordCount: string
  visibility: "private" | "team" | "organization" | "public"
}

function NovelsPage() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateNovelForm>({
    title: "",
    description: "",
    genre: "",
    targetWordCount: "",
    visibility: "private",
  })

  // Fetch novels
  const { data: novels, isLoading } = useQuery({
    queryKey: ["novels"],
    queryFn: async () => {
      const result = await api.novels.list()
      return result
    },
  })

  // Create novel mutation
  const createNovelMutation = useMutation({
    mutationFn: async (data: CreateNovelForm) => {
      const result = await api.novels.create({
        title: data.title,
        description: data.description || null,
        genre: data.genre || null,
        targetWordCount: data.targetWordCount ? Number.parseInt(data.targetWordCount, 10) : null,
        visibility: data.visibility,
      })
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["novels"] })
      setIsCreateDialogOpen(false)
      setCreateForm({
        title: "",
        description: "",
        genre: "",
        targetWordCount: "",
        visibility: "private",
      })
      toast.success("Novel created successfully!")
    },
    onError: (_error) => {
      toast.error("Failed to create novel")
    },
  })

  const handleCreateNovel = () => {
    if (!createForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    createNovelMutation.mutate(createForm)
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
                <BreadcrumbPage>Novels</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Title and Action */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl">My Novels</h1>
              <p className="mt-2">Manage your writing projects</p>
            </div>

            <Dialog onOpenChange={setIsCreateDialogOpen} open={isCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Novel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Novel</DialogTitle>
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
                      placeholder="A brief description of your novel..."
                      value={createForm.description}
                    />
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
                      onValueChange={(value: "private" | "team" | "organization" | "public") =>
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

                <DialogFooter>
                  <Button onClick={() => setIsCreateDialogOpen(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button disabled={createNovelMutation.isPending} onClick={handleCreateNovel}>
                    {createNovelMutation.isPending ? "Creating..." : "Create Novel"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Novels Grid */}
        {novels && novels.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {novels.map((novel: Novel) => (
              <Link key={novel.id} params={{ novelId: novel.id }} to="/write/$novelId/write">
                <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <Badge variant={novel.status === "draft" ? "secondary" : "default"}>
                        {novel.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{novel.title}</CardTitle>
                    {novel.description && (
                      <CardDescription className="line-clamp-2">
                        {novel.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {novel.genre && (
                        <div className="text-gray-600 text-sm">
                          <span className="font-medium">Genre:</span> {novel.genre}
                        </div>
                      )}
                      <div className="text-gray-600 text-sm">
                        <span className="font-medium">Progress:</span>{" "}
                        {novel.currentWordCount.toLocaleString()} /{" "}
                        {novel.targetWordCount?.toLocaleString() || "∞"} words
                      </div>
                      {novel.targetWordCount && (
                        <div className="h-2 w-full rounded-full bg-gray-200">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{
                              width: `${Math.min((novel.currentWordCount / novel.targetWordCount) * 100, 100)}%`,
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
            <h3 className="mb-2 font-medium text-xl">No novels yet</h3>
            <p className="mb-6">Create your first novel to get started writing!</p>
            <Button className="flex items-center gap-2" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Novel
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
