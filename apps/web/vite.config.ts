import path from "node:path"
import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    tailwindcss(), 
    tanstackRouter({}), 
    react(), 
    // Disable cloudflare plugin in development to prevent EPIPE errors
    ...(process.env.NODE_ENV === "production" ? [cloudflare()] : [])
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    strictPort: true,
  },
})
