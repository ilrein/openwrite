import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router"
import AppHeader from "@/components/app-header"
import { CommandPalette } from "@/components/command-palette"
import Loader from "@/components/loader"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import "../index.css"

export interface RouterAppContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "openwrite",
      },
      {
        name: "description",
        content: "openwrite is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
})

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  })

  const location = useRouterState({
    select: (s) => s.location.pathname,
  })

  const isDashboard =
    location.startsWith("/dashboard") ||
    location.startsWith("/write") ||
    location.startsWith("/projects")

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        {isDashboard ? (
          // Dashboard and write pages use their own layouts with sidebars
          <div className="h-svh">{isFetching ? <Loader /> : <Outlet />}</div>
        ) : (
          // Landing and other pages use the consolidated header layout
          <div className="min-h-svh">
            <AppHeader />
            <main className="flex-1">{isFetching ? <Loader /> : <Outlet />}</main>
          </div>
        )}
        <CommandPalette />
        <Toaster richColors />
      </ThemeProvider>
    </>
  )
}
