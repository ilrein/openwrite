import { createFileRoute } from "@tanstack/react-router"
import { Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

function TeamPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">Team</h1>
        <p className="text-muted-foreground">Manage team members and collaboration</p>
      </div>

      <Alert>
        <Users className="h-4 w-4" />
        <AlertDescription>
          Team management features are coming soon! You'll be able to invite members, assign roles,
          and collaborate on your novels.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
})
