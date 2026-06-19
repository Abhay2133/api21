import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'
const port = process.env.PORT || 8081

async function startServer() {
  const app = express()
  const server = http.createServer(app)

  let vite: any = null
  if (!isProd) {
    // Create Vite server in middleware mode and pass our HTTP server
    // instance so Vite can bind the HMR WebSocket server to it.
    vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server }
      },
      appType: 'custom',
      root: __dirname,
    })
    // Use Vite's connect instance as middleware in development
    app.use(vite.middlewares)
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist/client'), { index: false }))
  }

  app.use(async (req, res) => {
    const url = req.originalUrl || '/'

    try {
      // Parse URL to extract the pathname (e.g. ignore query string / hash)
      const parsedUrl = new URL(url, `http://${req.headers.host || 'localhost'}`)
      const pathname = parsedUrl.pathname
      const is404 = pathname !== '/' && pathname !== '/index.html' && pathname !== '/offline.html'

      let template: string
      let render: (url: string) => Promise<{ html: string }>

      if (!isProd) {
        // Read index.html from disk in dev
        template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8')
        // Transform template with Vite HMR client
        template = await vite.transformIndexHtml(url, template)
        // Load the server entrypoint
        const module = await vite.ssrLoadModule('/src/entry-server.ts')
        render = module.render
      } else {
        // Read index.html from built client assets
        template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8')
        // Load built server entrypoint
        const module = await import('./dist/server/entry-server.js')
        render = module.render
      }

      // Render the app HTML passing the pathname component
      const { html: appHtml } = await render(pathname)

      // Inject rendered HTML into template
      const html = template.replace('<!--ssr-outlet-->', appHtml)

      res.status(is404 ? 404 : 200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e: any) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e)
      }
      console.error(e.stack)
      res.status(500).end(e.stack || 'Internal Server Error')
    }
  })

  server.listen(Number(port), () => {
    console.log(`[ssr] Server running at http://localhost:${port} in ${isProd ? 'production' : 'development'} mode`)
  })
}

startServer()
