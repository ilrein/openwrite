import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/dashboard/ai")({
  component: () => <div>AI model management coming soon!</div>,
})
