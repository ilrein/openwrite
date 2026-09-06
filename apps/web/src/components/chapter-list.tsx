import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { ArrowDown, ArrowUp, Network, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, type Chapter } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ChapterListProps {
  chapters: Chapter[]
  onSelect: (chapterId: string) => void
  projectId: string
  selectedChapterId: string | null
}

export function ChapterList({
  projectId,
  chapters,
  selectedChapterId,
  onSelect,
}: ChapterListProps) {
  const queryClient = useQueryClient()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["chapters", projectId] })

  const createMutation = useMutation({
    mutationFn: async () => await api.chapters.create(projectId),
    onSuccess: (result) => {
      refresh()
      onSelect(result.id)
    },
    onError: () => toast.error("Failed to create chapter"),
  })

  const renameMutation = useMutation({
    mutationFn: async ({ chapterId, title }: { chapterId: string; title: string }) =>
      await api.chapters.update(projectId, chapterId, { title }),
    onSuccess: refresh,
    onError: () => toast.error("Failed to rename chapter"),
  })

  const reorderMutation = useMutation({
    mutationFn: async (chapterIds: string[]) => await api.chapters.reorder(projectId, chapterIds),
    onSuccess: refresh,
    onError: () => toast.error("Failed to reorder chapters"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (chapterId: string) => await api.chapters.delete(projectId, chapterId),
    onSuccess: (_, deletedId) => {
      refresh()
      if (selectedChapterId === deletedId) {
        const remaining = chapters.filter((ch) => ch.id !== deletedId)
        const next = remaining.at(0)
        if (next) {
          onSelect(next.id)
        }
      }
    },
    onError: () => toast.error("Failed to delete chapter"),
  })

  const startRename = (ch: Chapter) => {
    setEditingId(ch.id)
    setEditingTitle(ch.title)
  }

  const commitRename = () => {
    if (editingId && editingTitle.trim()) {
      renameMutation.mutate({ chapterId: editingId, title: editingTitle.trim() })
    }
    setEditingId(null)
  }

  const move = (chapterId: string, direction: -1 | 1) => {
    const ids = chapters.map((ch) => ch.id)
    const index = ids.indexOf(chapterId)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ids.length) {
      return
    }
    ids[index] = ids[target]
    ids[target] = chapterId
    reorderMutation.mutate(ids)
  }

  return (
    <div className="flex h-full w-60 flex-col border-r bg-muted/20" data-tour="chapters">
      <div className="flex items-center justify-between border-b p-3">
        <span className="font-medium text-sm">Chapters</span>
        <Button
          className="h-7 w-7 p-0"
          disabled={createMutation.isPending}
          onClick={() => createMutation.mutate()}
          size="sm"
          title="New chapter"
          type="button"
          variant="ghost"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {chapters.length === 0 && (
          <p className="px-2 py-4 text-muted-foreground text-xs">
            No chapters yet. Create one to start writing.
          </p>
        )}

        {chapters.map((ch, index) => (
          <div
            className={cn(
              "group flex items-center gap-1 rounded-md px-2 py-1.5",
              selectedChapterId === ch.id ? "bg-background shadow-sm" : "hover:bg-background/60"
            )}
            key={ch.id}
          >
            {editingId === ch.id ? (
              <Input
                autoFocus
                className="h-7 text-sm"
                onBlur={commitRename}
                onChange={(e) => setEditingTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    commitRename()
                  }
                  if (e.key === "Escape") {
                    setEditingId(null)
                  }
                }}
                value={editingTitle}
              />
            ) : (
              <>
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(ch.id)}
                  type="button"
                >
                  <span className="block truncate font-medium text-sm">{ch.title}</span>
                  <span className="block text-muted-foreground text-xs">
                    {ch.wordCount.toLocaleString()} words
                  </span>
                </button>

                <div className="hidden shrink-0 items-center group-hover:flex">
                  <Button
                    asChild
                    className="h-6 w-6 p-0"
                    size="sm"
                    title="Synopsis & braindump"
                    variant="ghost"
                  >
                    <Link
                      params={{ projectId, chapterId: ch.id }}
                      to="/projects/$projectId/story-bible/chapter/$chapterId"
                    >
                      <Sparkles className="h-3 w-3" />
                    </Link>
                  </Button>
                  <Button
                    className="h-6 w-6 p-0"
                    disabled={index === 0 || reorderMutation.isPending}
                    onClick={() => move(ch.id, -1)}
                    size="sm"
                    title="Move up"
                    type="button"
                    variant="ghost"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    className="h-6 w-6 p-0"
                    disabled={index === chapters.length - 1 || reorderMutation.isPending}
                    onClick={() => move(ch.id, 1)}
                    size="sm"
                    title="Move down"
                    type="button"
                    variant="ghost"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    className="h-6 w-6 p-0"
                    onClick={() => startRename(ch)}
                    size="sm"
                    title="Rename"
                    type="button"
                    variant="ghost"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <ConfirmDialog
                    confirmText="Delete"
                    description={`Delete "${ch.title}" and its content? This cannot be undone.`}
                    onConfirm={() => deleteMutation.mutate(ch.id)}
                    title="Delete chapter"
                    variant="destructive"
                  >
                    <Button
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      size="sm"
                      title="Delete"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="border-t p-2" data-tour="story-map">
        <Button
          asChild
          className="w-full justify-start text-muted-foreground"
          size="sm"
          variant="ghost"
        >
          <Link params={{ projectId }} to="/projects/$projectId/canvas">
            <Network className="mr-2 h-4 w-4" />
            Map your story
          </Link>
        </Button>
      </div>
    </div>
  )
}
