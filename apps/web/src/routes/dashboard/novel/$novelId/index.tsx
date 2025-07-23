import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/novel/$novelId/")({
  loader: ({ params }) => {
    throw redirect({
      to: "/dashboard/novel/$novelId/write",
      params: { novelId: params.novelId },
    })
  },
})
