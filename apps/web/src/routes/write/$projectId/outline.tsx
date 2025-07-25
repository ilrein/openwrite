import { createFileRoute } from "@tanstack/react-router"
import { FileText, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/write/$projectId/outline")({
  component: OutlineInterface,
})

function OutlineInterface() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl">Project Outline</h1>
            <p className="mt-2 text-muted-foreground">Plan your story structure</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Chapter
          </Button>
        </div>

        <div className="space-y-6">
          {/* Chapter 1 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chapter 1: The Beginning
                  </CardTitle>
                  <CardDescription>The hero's introduction and call to adventure</CardDescription>
                </div>
                <Badge variant="secondary">3 scenes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-l-2 border-l-blue-500 pl-4">
                  <div>
                    <p className="font-medium">Scene 1: Opening</p>
                    <p className="text-muted-foreground text-sm">
                      Character introduction and world setup
                    </p>
                  </div>
                  <Badge variant="outline">Draft</Badge>
                </div>
                <div className="flex items-center justify-between border-l-2 border-l-yellow-500 pl-4">
                  <div>
                    <p className="font-medium">Scene 2: The Conflict</p>
                    <p className="text-muted-foreground text-sm">Initial problem presents itself</p>
                  </div>
                  <Badge variant="outline">In Progress</Badge>
                </div>
                <div className="flex items-center justify-between border-l-2 border-l-gray-300 pl-4">
                  <div>
                    <p className="font-medium">Scene 3: The Decision</p>
                    <p className="text-muted-foreground text-sm">Hero decides to take action</p>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapter 2 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chapter 2: The Journey Begins
                  </CardTitle>
                  <CardDescription>First steps on the adventure</CardDescription>
                </div>
                <Badge variant="secondary">2 scenes</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between border-l-2 border-l-gray-300 pl-4">
                  <div>
                    <p className="font-medium">Scene 1: Departure</p>
                    <p className="text-muted-foreground text-sm">
                      Leaving the familiar world behind
                    </p>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
                <div className="flex items-center justify-between border-l-2 border-l-gray-300 pl-4">
                  <div>
                    <p className="font-medium">Scene 2: First Challenge</p>
                    <p className="text-muted-foreground text-sm">Initial obstacle on the journey</p>
                  </div>
                  <Badge variant="outline">Planned</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
