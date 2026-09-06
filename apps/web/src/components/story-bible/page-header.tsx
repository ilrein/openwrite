import { Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"

interface StoryBiblePageHeaderProps {
  actions?: ReactNode
  projectId: string
  subtitle?: string
  title: ReactNode
}

/**
 * Shared header for every Story Bible page — a consistent way back to the
 * manuscript plus a title/subtitle row and a slot for page-specific actions
 * (Save, Delete, Generate…). Every entity is edited on its own page now,
 * never in a popup.
 */
export function StoryBiblePageHeader({
  projectId,
  title,
  subtitle,
  actions,
}: StoryBiblePageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b p-6">
      <div className="min-w-0">
        <Link
          className="mb-2 inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          params={{ projectId }}
          to="/projects/$projectId/write"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to manuscript
        </Link>
        <h1 className="truncate font-bold text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}
