import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { QueryCache, QueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { appRouter } from "../../../server/src/routers/index"

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`, {
        action: {
          label: "retry",
          onClick: () => {
            queryClient.invalidateQueries()
          },
        },
      })
    },
  }),
})

export const link = new RPCLink({
  url: import.meta.env.DEV && import.meta.env.VITE_SERVER_URL ? 
    `${import.meta.env.VITE_SERVER_URL}/rpc` : 
    "/rpc",
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include",
    })
  },
})

export const client: RouterClient<typeof appRouter> = createORPCClient(link)

export const orpc = createTanstackQueryUtils(client)
