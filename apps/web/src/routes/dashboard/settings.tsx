import { createFileRoute } from "@tanstack/react-router"
import { Settings } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

function OrganizationSettingsPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization preferences and appearance</p>
      </div>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          Organization settings are coming soon! You'll be able to configure themes, manage members,
          set permissions, and customize your workspace.
        </AlertDescription>
      </Alert>
    </div>
  )
}

export const Route = createFileRoute("/dashboard/settings")({
  component: OrganizationSettingsPage,
})
