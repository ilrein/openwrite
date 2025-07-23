import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import AppHeader from "@/components/app-header"
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

  const isDashboard = location === "/dashboard"

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
          // Dashboard uses its own layout with sidebar
          <div className="h-svh">{isFetching ? <Loader /> : <Outlet />}</div>
        ) : (
          // Other pages use header layout
          <div className="min-h-svh">
            <AppHeader />
            <main className="flex-1">
              {isFetching ? <Loader /> : <Outlet />}
            </main>
          </div>
        )}
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
    </>
  )
}
