import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Sparkles } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { GenerateOptionsDialog } from "@/components/story-bible/generate-options-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Chapter, storyBibleApi } from "@/lib/api"

interface ChapterInspectorDialogProps {
  chapter: Chapter
  onOpenChange: (open: boolean) => void
  open: boolean
  projectId: string
}

/**
 * Per-chapter Story Bible panel: an AI synopsis of the whole chapter (with the
 * Sudowrite-style options picker) and a freeform braindump the AI can riff on.
 */
export function ChapterInspectorDialog({
  chapter,
  open,
  onOpenChange,
  projectId,
}: ChapterInspectorDialogProps) {
  const queryClient = useQueryClient()
  const [summary, setSummary] = useState("")
  const [braindump, setBraindump] = useState("")
  const [synopsisPickerOpen, setSynopsisPickerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setSummary(chapter.summary ?? "")
      setBraindump(chapter.braindump ?? "")
    }
  }, [open, chapter])

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["chapters", projectId] })

  const saveSummary = useMutation({
    mutationFn: () => api.chapters.update(projectId, chapter.id, { summary: summary.trim() }),
    onSuccess: () => {
      refresh()
      toast.success("Synopsis saved")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveBraindump = useMutation({
    mutationFn: () => api.chapters.update(projectId, chapter.id, { braindump: braindump.trim() }),
    onSuccess: () => {
      refresh()
      toast.success("Braindump saved")
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const generateBraindump = useMutation({
    mutationFn: () => storyBibleApi.generateChapterBraindump(projectId, chapter.id),
    onSuccess: (text) => {
      if (!text) {
        toast.error("The model returned nothing. Try again.")
        return
      }
      setBraindump((prev) => (prev.trim() ? `${prev.trim()}\n\n${text}` : text))
    },
    onError: (error: Error) => toast.error(error.message),
  })

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{chapter.title}</DialogTitle>
            <DialogDescription>
              A synopsis and a braindump for this chapter — both AI-assisted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
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
              className="min-h-[110px]"
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
          </div>

          <div className="space-y-3 border-t pt-4">
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
            <Textarea
              className="min-h-[160px]"
              id="chapter-braindump"
              onChange={(event) => setBraindump(event.target.value)}
              placeholder="Loose ideas, what-ifs, images, snatches of dialogue. Hit “Braindump ideas” to let the AI riff."
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
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GenerateOptionsDialog
        description="A synopsis of the whole chapter, from its current text."
        onGenerate={async (instructions) => {
          const result = await storyBibleApi.generateChapterSynopsis(
            projectId,
            chapter.id,
            instructions
          )
          return result.options
        }}
        onOpenChange={setSynopsisPickerOpen}
        onPick={setSummary}
        open={synopsisPickerOpen}
        title="Generate a synopsis"
      />
    </>
  )
}
