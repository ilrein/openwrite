import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/projects/$projectId/story-bible")({
  component: () => <Outlet />,
})
