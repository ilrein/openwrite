import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/write/$projectId/codex")({
  component: () => <Outlet />,
})
