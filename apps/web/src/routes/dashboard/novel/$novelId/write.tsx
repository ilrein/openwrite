import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import TiptapEditor from "@/components/tiptap-editor"
import { rpc } from "@/utils/orpc"

export const Route = createFileRoute("/dashboard/novel/$novelId/write")({
  component: NovelWritePage,
})

function NovelWritePage() {
  const { novelId: id } = Route.useParams()

  // Fetch novel content
  const { data: novel, isLoading } = useQuery({
    queryKey: ["novel", id],
    queryFn: async () => {
      const result = await rpc.novel.get.query({ id })
      return result
    },
  })

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-pulse">Loading editor...</div>
      </div>
    )
  }

  if (!novel) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 font-semibold text-2xl text-gray-900">Novel not found</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Writing Interface */}
      <div className="flex-1 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="prose prose-lg min-h-[600px] max-w-none">
            <TiptapEditor
              content={novel.content || ""}
              onUpdate={(_content) => {
                // TODO: Implement auto-save functionality
              }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="border-t px-8 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between text-sm opacity-75">
          <div className="flex items-center space-x-6">
            <span>Words: {novel.currentWordCount.toLocaleString()}</span>
            {novel.targetWordCount && (
              <span>
                Goal: {novel.targetWordCount.toLocaleString()}(
                {Math.round((novel.currentWordCount / novel.targetWordCount) * 100)}%)
              </span>
            )}
          </div>
          <div>Last saved: Just now</div>
        </div>
      </div>
    </div>
  )
}
