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
  supportsPKCE?: boolean
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
  supportsPKCE: _supportsPKCE,
  onConnect,
  onDelete,
  children,
}: AiProviderCardProps) {
  return (
    <Card className={enabled ? "" : "opacity-60"}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className={enabled ? "" : "text-muted-foreground"}>{name}</CardTitle>
            {recommended && <Badge variant="secondary">Recommended</Badge>}
            {isConnected && <Badge variant="default">Connected</Badge>}
            {!enabled && <Badge variant="outline">Coming Soon</Badge>}
          </div>
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
                <Button disabled={!enabled} onClick={onConnect}>
                  <Plus className="mr-2 h-4 w-4" />
                  {enabled ? "Connect" : "Coming Soon"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect {name}</DialogTitle>
                  <DialogDescription>Connect to {name} to access their models</DialogDescription>
                </DialogHeader>
                {children}
              </DialogContent>
            </Dialog>
          )}
        </div>
        <CardDescription className={enabled ? "" : "text-muted-foreground/70"}>
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}
