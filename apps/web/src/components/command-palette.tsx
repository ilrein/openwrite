import { useNavigate } from "@tanstack/react-router"
import {
  BookOpenIcon,
  FileTextIcon,
  HomeIcon,
  PaletteIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import { useEffect, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((isOpen) => !isOpen)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = (command: () => void) => {
    setOpen(false)
    command()
  }

  return (
    <CommandDialog onOpenChange={setOpen} open={open}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard" }))}>
            <HomeIcon />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard/novels" }))}>
            <BookOpenIcon />
            Novels
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard/ai" }))}>
            <PaletteIcon />
            AI Providers
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard/settings" }))}>
            <SettingsIcon />
            Settings
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate({ to: "/dashboard/team" }))}>
            <UsersIcon />
            Team
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // This would typically trigger a new novel creation modal
              })
            }
          >
            <PlusIcon />
            Create New Novel
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                // This would typically open a search modal
              })
            }
          >
            <SearchIcon />
            Search Novels
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick Links">
          <CommandItem onSelect={() => runCommand(() => window.open("/privacy", "_blank"))}>
            <FileTextIcon />
            Privacy Policy
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => window.open("/terms", "_blank"))}>
            <FileTextIcon />
            Terms of Service
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
