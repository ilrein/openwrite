import { useEffect, useState } from "react"
import { AutocompleteToggle } from "@/components/autocomplete-toggle"
import { Separator } from "@/components/ui/separator"

interface StatusBarProps {
  wordCount: number
  lastSavedText?: string
}

export function StatusBar({
  wordCount,
  lastSavedText = "Last saved: 2 minutes ago",
}: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  )

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }, 60_000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="border-t px-6 py-2">
      <div className="flex items-center justify-between text-muted-foreground text-sm">
        <div className="flex items-center gap-4">
          <span>Words: {wordCount.toLocaleString()}</span>
          <Separator className="h-4" orientation="vertical" />
          <span>{lastSavedText}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{currentTime}</span>
          <div className="h-4 w-px bg-border" />
          <AutocompleteToggle />
        </div>
      </div>
    </footer>
  )
}
