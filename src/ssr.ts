import express from "express";
import fs from "fs";
import path from "path";
import { env } from "./config/env";

export async function setupSSR(app: express.Application) {
  const isProd = env.nodeEnv === "production";
  const root = process.cwd();

  let vite: any;
  if (!isProd) {
    const { createServer } = await import("vite");
    vite = await createServer({
      root,
      server: {
        middlewareMode: true,
      },
      appType: "custom",
    });
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    console.log("[ssr] Vite dev middleware loaded");
  } else {
    // Serve static files from the client build directory
    app.use(
      express.static(path.resolve(root, "dist/client"), {
        index: false, // Prevents serving index.html as a static asset (we want to SSR it)
      })
    );
    console.log("[ssr] Serving static assets from dist/client");
  }

  // Wildcard SSR handler for page requests
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // Skip API routes
    if (url.startsWith("/api/")) {
      return next();
    }

    try {
      let template: string;
      let render: any;

      if (!isProd) {
        // 1. Read index.html in dev
        template = fs.readFileSync(path.resolve(root, "index.html"), "utf-8");
        // 2. Transform HTML with Vite HMR client
        template = await vite.transformIndexHtml(url, template);
        // 3. Load entry-server
        render = (await vite.ssrLoadModule("/client/entry-server.ts")).render;
      } else {
        // 1. Read pre-compiled index.html
        template = fs.readFileSync(
          path.resolve(root, "dist/client/index.html"),
          "utf-8"
        );
        // 2. Import production server entry bundle
        const entryServerPath = path.resolve(
          root,
          "dist/server/entry-server.mjs"
        );
        render = (await import(entryServerPath)).render;
      }

      // 4. Render application HTML
      const { html, isNotFound } = await render(url);

      // 5. Replace placeholder
      const htmlOutput = template.replace("<!--ssr-outlet-->", html);

      // 6. Return response
      res
        .status(isNotFound ? 404 : 200)
        .set({ "Content-Type": "text/html" })
        .end(htmlOutput);
    } catch (e: any) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error("[ssr] Error rendering page:", e);
      next(e); // Pass error to Express error middleware
    }
  });
}
