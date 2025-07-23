import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/write/$novelId/codex")({
  component: () => <Outlet />,
})
