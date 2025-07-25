import { Plus } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AiProviderCardProps {
  name: string
  description: string
  enabled: boolean
  recommended?: boolean
  isConnected: boolean
  onConnect: () => void
  onDelete?: () => void
  children?: React.ReactNode // For the AddProviderForm
}

export function AiProviderCard({
  name,
  description,
  enabled,
  recommended,
  isConnected,
  onConnect,
  onDelete,
  children,
}: AiProviderCardProps) {
  return (
    <Card className={`${enabled ? "" : "opacity-60"} transition-all duration-200 hover:shadow-md`}>
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <CardTitle className={`text-base sm:text-lg ${enabled ? "" : "text-muted-foreground"}`}>
              {name}
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {recommended && (
                <Badge className="text-xs" variant="secondary">
                  Recommended
                </Badge>
              )}
              {isConnected && (
                <Badge className="text-xs" variant="default">
                  Connected
                </Badge>
              )}
              {!enabled && (
                <Badge className="text-xs" variant="outline">
                  Coming Soon
                </Badge>
              )}
            </div>
          </div>
          <div className="flex w-full justify-end sm:w-auto">
            {isConnected ? (
              onDelete ? (
                <ConfirmDialog
                  confirmText="Delete"
                  description="Are you sure you want to delete this AI provider? This action cannot be undone."
                  onConfirm={onDelete}
                  title="Delete AI Provider"
                  variant="destructive"
                >
                  <Button size="sm" variant="destructive">
                    Delete
                  </Button>
                </ConfirmDialog>
              ) : (
                <Button disabled size="sm" variant="destructive">
                  Delete
                </Button>
              )
            ) : (
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto" disabled={!enabled} onClick={onConnect}>
                    <Plus className="mr-2 h-4 w-4" />
                    {enabled ? "Connect" : "Coming Soon"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Connect {name}</DialogTitle>
                    <DialogDescription>Connect to {name} to access their models</DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[calc(90vh-8rem)] overflow-y-auto pr-2">{children}</div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        <CardDescription className={`text-sm ${enabled ? "" : "text-muted-foreground/70"}`}>
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
