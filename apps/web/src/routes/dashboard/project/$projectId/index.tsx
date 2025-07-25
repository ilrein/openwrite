import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/project/$projectId/")({
  loader: ({ params }) => {
    throw redirect({
      to: "/dashboard/project/$projectId/write",
      params: { projectId: params.projectId },
    })
  },
})
