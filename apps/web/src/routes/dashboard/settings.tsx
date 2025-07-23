import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/settings")({
  component: () => <div>Organization settings coming soon!</div>,
})
