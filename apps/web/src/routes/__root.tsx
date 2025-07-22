import { createORPCClient } from "@orpc/client"
import type { RouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import type { QueryClient } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { useState } from "react"
import Header from "@/components/header"
import Loader from "@/components/loader"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { link, type orpc } from "@/utils/orpc"
import type { appRouter } from "../../../server/src/routers"
import "../index.css"

export interface RouterAppContext {
  orpc: typeof orpc
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

  const [client] = useState<RouterClient<typeof appRouter>>(() => createORPCClient(link))
  const [orpcUtils] = useState(() => createTanstackQueryUtils(client))

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="grid h-svh grid-rows-[auto_1fr]">
          <Header />
          {isFetching ? <Loader /> : <Outlet />}
        </div>
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
      <ReactQueryDevtools buttonPosition="bottom-right" position="bottom" />
    </>
  )
}
