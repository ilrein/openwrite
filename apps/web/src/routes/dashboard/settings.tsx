import { createFileRoute } from "@tanstack/react-router"
import { Palette } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import themes from "./themes.json" with { type: "json" }

function OrganizationSettingsPage() {
  const [selectedTheme, setSelectedTheme] = useState("caffeine")

  const applyTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId)
    if (!theme) {
      return
    }

    const root = document.documentElement
    const isDark = root.classList.contains("dark")
    const colorMode = isDark ? "dark" : "light"
    const colors = theme.colors[colorMode]

    for (const [property, value] of Object.entries(colors)) {
      root.style.setProperty(property, value)
    }

    setSelectedTheme(themeId)
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl">Organization Settings</h1>
        <p className="text-muted-foreground">Manage your organization preferences and appearance</p>
      </div>

      <div className="grid gap-6">
        <Card>
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
              <Select onValueChange={applyTheme} value={selectedTheme}>
                <SelectTrigger id="theme-select">
                  <SelectValue placeholder="Select a theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
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
        </Card>

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
