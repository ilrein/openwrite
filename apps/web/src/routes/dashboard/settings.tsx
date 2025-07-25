import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function OrganizationSettingsPage() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization preferences and appearance</p>
      </div>

      <div className="grid gap-6">
        {/* Theme selection temporarily disabled */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>Theme</CardTitle>
            </div>
            <CardDescription>Choose your preferred color theme for the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme-select">Color Theme</Label>
              <Select onValueChange={handleThemeChange} value={selectedTheme}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {availableThemes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id}>
                      <div>
                        <div className="font-medium">{theme.name}</div>
                        <div className="text-muted-foreground text-xs">{theme.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-muted-foreground text-sm">
              Theme changes apply immediately and work with both light and dark modes
            </p>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Organization management features coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Configure organization members, roles, and permissions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export const Route = createFileRoute("/dashboard/settings")({
  component: OrganizationSettingsPage,
})
