import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import ReactDOM from "react-dom/client"
import Loader from "./components/loader"
import { initializeTheme } from "./lib/theme"
import { routeTree } from "./routeTree.gen"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  context: { queryClient },
  Wrap({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  },
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById("app")

if (!rootElement) {
  throw new Error("Root element not found")
}

if (!rootElement.innerHTML) {
  // Initialize theme system
  initializeTheme()

  const root = ReactDOM.createRoot(rootElement)
  root.render(<RouterProvider router={router} />)
}
