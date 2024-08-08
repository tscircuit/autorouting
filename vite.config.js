import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "node:path"

export default defineConfig({
  // TODO: we're currently duplicating the frontend code for every single page
  // that we output, which is super wasteful. To make this more efficient, we
  // should fix the dev-server to allow serving vite chunks properly.
  plugins: [react()],
  root: "frontend",
  build: {
    outDir: "../frontend-dist",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/index.js',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./frontend"),
    },
  },
})
