import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"

async function fetchSession() {
  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin

  const response = await fetch(`${baseUrl}/api/session`, {
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error("Failed to fetch session")
  }

  return response.json()
}

async function signOut() {
  const baseUrl =
    import.meta.env.DEV && import.meta.env.VITE_SERVER_URL
      ? import.meta.env.VITE_SERVER_URL
      : window.location.origin

  const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  })

  return response.ok
}

export default function UserMenu() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { setTheme, theme } = useTheme()

  const sessionQuery = useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    retry: 2,
    staleTime: 0, // Always consider stale
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      // Invalidate session query to refresh UI
      queryClient.invalidateQueries({ queryKey: ["session"] })
      navigate({ to: "/" })
    } catch (_error) {
      // Ignore logout errors - user will be redirected anyway
    }
  }

  if (sessionQuery.isLoading) {
    return <Skeleton className="h-9 w-24" />
  }

  if (!sessionQuery.data?.authenticated) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">Sign In</Link>
      </Button>
    )
  }

  const session = sessionQuery.data.session

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{session.user.name || "User"}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>{session.user.email}</DropdownMenuItem>
        <DropdownMenuSeparator />

        {/* Theme Selection */}
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light
          {theme === "light" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
          {theme === "dark" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          System
          {theme === "system" && <span className="ml-auto">✓</span>}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Button className="w-full" onClick={handleSignOut} variant="destructive">
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
