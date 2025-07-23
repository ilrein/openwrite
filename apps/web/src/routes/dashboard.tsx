import { createFileRoute } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, BookOpen } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" 
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/dashboard")({
  component: DashboardComponent,
  beforeLoad: async () => {
    try {
      const session = await authClient.getSession()
      if (!session) {
        throw new Error("Not authenticated")
      }
    } catch (_error) {
      throw new Error("Not authenticated")
    }
  }
})

interface Novel {
  id: string
  title: string
  description: string | null
  genre: string | null
  status: string
  visibility: string
  currentWordCount: number
  targetWordCount: number | null
  coverImage: string | null
  createdAt: string
  updatedAt: string
  lastWrittenAt: string | null
}

function DashboardComponent() {
  const queryClient = useQueryClient()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    genre: "",
    targetWordCount: "",
    visibility: "private"
  })

  // Fetch novels
  const { data: novelsData, isLoading } = useQuery({
    queryKey: ["novels"],
    queryFn: async () => {
      const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
        ? import.meta.env.VITE_SERVER_URL
        : window.location.origin

      const response = await fetch(`${baseUrl}/api/novels`, {
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 400) {
          // User needs to create an organization
          return { novels: [], needsOrganization: true }
        }
        throw new Error("Failed to fetch novels")
      }

      return response.json()
    }
  })

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: async () => {
      const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
        ? import.meta.env.VITE_SERVER_URL
        : window.location.origin

      const response = await fetch(`${baseUrl}/api/organization/create-personal`, {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        throw new Error("Failed to create organization")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Personal workspace created!")
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
    onError: () => {
      toast.error("Failed to create personal workspace")
    }
  })

  // Create novel mutation
  const createNovelMutation = useMutation({
    mutationFn: async (novelData: typeof createForm) => {
      const baseUrl = import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
        ? import.meta.env.VITE_SERVER_URL
        : window.location.origin

      const response = await fetch(`${baseUrl}/api/novels`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: novelData.title,
          description: novelData.description || null,
          genre: novelData.genre || null,
          targetWordCount: novelData.targetWordCount ? Number.parseInt(novelData.targetWordCount, 10) : null,
          visibility: novelData.visibility
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create novel")
      }

      return response.json()
    },
    onSuccess: () => {
      toast.success("Novel created successfully!")
      setIsCreateDialogOpen(false)
      setCreateForm({
        title: "",
        description: "",
        genre: "",
        targetWordCount: "",
        visibility: "private"
      })
      queryClient.invalidateQueries({ queryKey: ["novels"] })
    },
    onError: () => {
      toast.error("Failed to create novel")
    }
  })

  const handleCreateNovel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.title.trim()) {
      toast.error("Title is required")
      return
    }
    createNovelMutation.mutate(createForm)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show organization creation if needed
  if (novelsData?.needsOrganization) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="font-bold text-3xl">Welcome to OpenWrite!</h1>
            <p className="text-lg text-muted-foreground">
              Let's set up your personal workspace to start writing.
            </p>
          </div>
          
          <Card className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>Create Your Workspace</CardTitle>
              <CardDescription>
                Every writer needs a space to create. We'll set up a personal workspace for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => createOrganizationMutation.mutate()}
                disabled={createOrganizationMutation.isPending}
                className="w-full"
              >
                {createOrganizationMutation.isPending ? "Creating..." : "Create My Workspace"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const novels = novelsData?.novels || []

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Dashboard</h1>
          <p className="text-muted-foreground">Manage your novels and track your writing progress</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Novel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateNovel}>
              <DialogHeader>
                <DialogTitle>Create New Novel</DialogTitle>
                <DialogDescription>
                  Start your next writing project. You can always update these details later.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter your novel title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your novel"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      value={createForm.genre}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, genre: e.target.value }))}
                      placeholder="e.g., Fantasy, Sci-Fi"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetWordCount">Target Words</Label>
                    <Input
                      id="targetWordCount"
                      type="number"
                      value={createForm.targetWordCount}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, targetWordCount: e.target.value }))}
                      placeholder="50000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select 
                    value={createForm.visibility} 
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={createNovelMutation.isPending}
                >
                  {createNovelMutation.isPending ? "Creating..." : "Create Novel"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Novels</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{novels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Words</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {novels.reduce((sum: number, novel: Novel) => sum + novel.currentWordCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {novels.filter((novel: Novel) => novel.status === "in_progress").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {novels.filter((novel: Novel) => novel.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Novels Grid */}
      {novels.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {novels.map((novel: Novel) => (
            <Card key={novel.id} className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="line-clamp-2">{novel.title}</CardTitle>
                    {novel.genre && (
                      <Badge variant="secondary" className="text-xs">
                        {novel.genre}
                      </Badge>
                    )}
                  </div>
                  <Badge variant={novel.status === "completed" ? "default" : "secondary"}>
                    {novel.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {novel.description && (
                  <p className="mb-4 line-clamp-3 text-muted-foreground text-sm">
                    {novel.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{novel.currentWordCount.toLocaleString()} words</span>
                  </div>
                  
                  {novel.targetWordCount && (
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div 
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ 
                          width: `${Math.min(100, (novel.currentWordCount / novel.targetWordCount) * 100)}%` 
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between text-muted-foreground text-xs">
                    <span>Updated {new Date(novel.updatedAt).toLocaleDateString()}</span>
                    {novel.targetWordCount && (
                      <span>
                        {Math.round((novel.currentWordCount / novel.targetWordCount) * 100)}% complete
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12 text-center">
          <CardContent>
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold text-lg">No novels yet</h3>
            <p className="mb-4 text-muted-foreground">
              Start your writing journey by creating your first novel.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Novel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}