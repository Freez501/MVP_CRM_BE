/// <reference types="vitest" />
import path from "path"
import fs from "fs"
import react from "@vitejs/plugin-react"
import { defineConfig, Plugin } from "vite"

function localDbSyncPlugin(): Plugin {
  return {
    name: "local-db-sync",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === "/api/db" && req.method === "POST") {
          let body = ""
          req.on("data", (chunk) => {
            body += chunk
          })
          req.on("end", () => {
            try {
              const data = JSON.parse(body)
              const dbPath = path.resolve(__dirname, "./src/data/cocktails_db.json")
              fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf-8")
              res.statusCode = 200
              res.setHeader("Content-Type", "application/json")
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.setHeader("Content-Type", "application/json")
              res.end(
                JSON.stringify({
                  success: false,
                  error: err instanceof Error ? err.message : "Unknown error",
                })
              )
            }
          })
          return
        }
        if (req.url === "/api/db" && req.method === "GET") {
          try {
            const dbPath = path.resolve(__dirname, "./src/data/cocktails_db.json")
            const content = fs.readFileSync(dbPath, "utf-8")
            res.statusCode = 200
            res.setHeader("Content-Type", "application/json")
            res.end(content)
          } catch (err) {
            res.statusCode = 500
            res.setHeader("Content-Type", "application/json")
            res.end(
              JSON.stringify({
                success: false,
                error: err instanceof Error ? err.message : "Unknown error",
              })
            )
          }
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localDbSyncPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ["**/src/data/cocktails_db.json"],
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
})
