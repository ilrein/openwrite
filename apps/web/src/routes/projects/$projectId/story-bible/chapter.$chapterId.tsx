import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { GenerateOptionsDialog } from "@/components/story-bible/generate-options-dialog"
import { StoryBiblePageHeader } from "@/components/story-bible/page-header"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { api, storyBibleApi } from "@/lib/api"

export const Route = createFileRoute("/projects/$projectId/story-bible/chapter/$chapterId")({
  component: ChapterStoryBiblePage,
})

function ChapterStoryBiblePage() {
  const { projectId, chapterId } = Route.useParams()
  const queryClient = useQueryClient()

  const { data: chapters, isLoading } = useQuery({
    queryKey: ["chapters", projectId],
    queryFn: () => api.chapters.list(projectId),
  })
  const chapter = chapters?.find((ch) => ch.id === chapterId)

  const [summary, setSummary] = useState("")
  const [braindump, setBraindump] = useState("")
  const [synopsisPickerOpen, setSynopsisPickerOpen] = useState(false)

  useEffect(() => {
    if (chapter) {
      setSummary(chapter.summary ?? "")
      setBraindump(chapter.braindump ?? "")
    }
  }, [chapter])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["chapters", projectId] })

  const saveSummary = useMutation({
    mutationFn: () => api.chapters.update(projectId, chapterId, { summary: summary.trim() }),
    onSuccess: () => {
      refresh()
      toast.success("Synopsis saved")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveBraindump = useMutation({
    mutationFn: () => api.chapters.update(projectId, chapterId, { braindump }),
    onSuccess: () => {
      refresh()
      toast.success("Braindump saved")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const generateBraindump = useMutation({
    mutationFn: () => storyBibleApi.generateChapterBraindump(projectId, chapterId),
    onSuccess: (text) => {
      if (!text) {
        toast.error("The model returned nothing. Try again.")
        return
      }
      setBraindump((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text))
    },
    onError: (error: Error) => toast.error(error.message),
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  if (!chapter) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          That chapter doesn't exist anymore.{" "}
          <Link className="underline" params={{ projectId }} to="/projects/$projectId/write">
            Back to the manuscript
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <StoryBiblePageHeader projectId={projectId} subtitle="Chapter" title={chapter.title} />

      <div className="space-y-8 p-6">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="chapter-synopsis">Synopsis</Label>
            <Button
              onClick={() => setSynopsisPickerOpen(true)}
              size="sm"
              type="button"
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Synopsis this chapter
            </Button>
          </div>
          <Textarea
            className="min-h-[130px]"
            id="chapter-synopsis"
            onChange={(event) => setSummary(event.target.value)}
            placeholder="What happens in this chapter, in a few sentences."
            value={summary}
          />
          <div className="flex justify-end">
            <Button
              disabled={saveSummary.isPending}
              onClick={() => saveSummary.mutate()}
              size="sm"
              type="button"
            >
              {saveSummary.isPending ? "Saving…" : "Save synopsis"}
            </Button>
          </div>
        </section>

        <section className="space-y-3 border-t pt-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="chapter-braindump">Braindump</Label>
            <Button
              disabled={generateBraindump.isPending}
              onClick={() => generateBraindump.mutate()}
              size="sm"
              type="button"
              variant="outline"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {generateBraindump.isPending ? "Thinking…" : "Braindump ideas"}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm">
            Write anything for this chapter — loose ideas, what-ifs, images, snatches of dialogue.
          </p>
          <Textarea
            className="min-h-[300px]"
            id="chapter-braindump"
            onChange={(event) => setBraindump(event.target.value)}
            placeholder="Just write. Hit “Braindump ideas” to let the AI riff, too."
            value={braindump}
          />
          <div className="flex justify-end">
            <Button
              disabled={saveBraindump.isPending}
              onClick={() => saveBraindump.mutate()}
              size="sm"
              type="button"
            >
              {saveBraindump.isPending ? "Saving…" : "Save braindump"}
            </Button>
          </div>
        </section>
      </div>

      <GenerateOptionsDialog
        description="A synopsis of the whole chapter, from its current text."
        onGenerate={async (instructions) => {
          const result = await storyBibleApi.generateChapterSynopsis(
            projectId,
            chapterId,
            instructions
          )
          return result.options
        }}
        onOpenChange={setSynopsisPickerOpen}
        onPick={setSummary}
        open={synopsisPickerOpen}
        title="Generate a synopsis"
      />
    </div>
  )
}
