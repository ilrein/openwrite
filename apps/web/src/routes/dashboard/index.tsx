import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { BookOpen, Clock, Plus, TrendingUp, Users } from "lucide-react"
import { useEffect } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { api, type Novel } from "@/lib/api"

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
})

function DashboardHome() {
  // Fetch novels for overview
  const {
    data: novels,
    isError,
    error,
  } = useQuery({
    queryKey: ["novels"],
    queryFn: async () => {
      const result = await api.novels.list()
      return result
    },
    retry: 2,
    retryDelay: 1000,
  })

  // Handle error with toast notification
  useEffect(() => {
    if (isError && error) {
      toast.error("Failed to load novels. Please try refreshing the page.")
    }
  }, [isError, error])

  const totalWords = novels?.reduce((sum, novel) => sum + novel.currentWordCount, 0) || 0
  const activeNovels =
    novels?.filter((novel) => novel.status === "in_progress" || novel.status === "draft") || []
  const recentNovels = novels?.slice(0, 3) || []

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
              <CardTitle className="font-medium text-sm">Total Novels</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="font-bold text-2xl">{novels?.length || 0}</div>
              <p className="text-muted-foreground text-xs">{activeNovels.length} active projects</p>
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
                <CardTitle>Recent Novels</CardTitle>
                <CardDescription>Your latest writing projects</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/dashboard/novels">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentNovels.map((novel: Novel) => (
                  <div
                    className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
                    key={novel.id}
                  >
                    <div className="flex items-center space-x-4">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{novel.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {novel.currentWordCount.toLocaleString()} words
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2 sm:justify-end">
                      <Badge variant={novel.status === "draft" ? "secondary" : "default"}>
                        {novel.status}
                      </Badge>
                      <Button asChild size="sm" variant="ghost">
                        <Link params={{ novelId: novel.id }} to="/write/$novelId/write">
                          Open
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}

                {recentNovels.length === 0 && (
                  <div className="py-8 text-center">
                    <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p className="mb-4 text-muted-foreground">No novels yet</p>
                    <Button asChild>
                      <Link to="/dashboard/novels">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Novel
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
                {activeNovels.slice(0, 3).map((novel: Novel) => {
                  const progress = novel.targetWordCount
                    ? Math.min((novel.currentWordCount / novel.targetWordCount) * 100, 100)
                    : 0

                  return (
                    <div className="space-y-2" key={novel.id}>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{novel.title}</p>
                        <p className="text-muted-foreground text-sm">{Math.round(progress)}%</p>
                      </div>
                      <Progress className="h-2" value={progress} />
                      <p className="text-muted-foreground text-xs">
                        {novel.currentWordCount.toLocaleString()} /{" "}
                        {novel.targetWordCount?.toLocaleString() || "∞"} words
                      </p>
                    </div>
                  )
                })}

                {activeNovels.length === 0 && (
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
