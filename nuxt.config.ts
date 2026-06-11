import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",

  // SSR enabled (default, explicit)
  ssr: true,

  app: {
    head: {
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" }
      ]
    }
  },

  // Global CSS
  css: ["~/assets/css/main.css"],

  // Nuxt Modules
  modules: ["@vite-pwa/nuxt"],

  // PWA configuration
  pwa: {
    strategies: "injectManifest",
    srcDir: "public",
    filename: "sw.js",
    registerType: "prompt",
    manifest: {
      name: "Abhay Bisht | Portfolio & API",
      short_name: "Abhay Bisht",
      description: "Software Engineer specializing in Full Stack Web Applications",
      theme_color: "#6366f1",
      background_color: "#0a0a0a",
      display: "standalone",
      orientation: "any",
      start_url: "/",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        },
        {
          src: "/icon-192x192-maskable.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "maskable"
        },
        {
          src: "/icon-512x512-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable"
        }
      ]
    },
    injectManifest: {
      globPatterns: ["**/*.{js,css,ico,png,svg,webmanifest}"]
    },
    devOptions: {
      enabled: true,
      type: "module"
    }
  },

  // Tailwind via Vite plugin (same as old vite.config.ts)
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
  },

  // Path aliases
  alias: {
    "@": "~/",
  },

  // Nitro configuration
  nitro: {
    preset: "bun",

    experimental: {
      tasks: true,
    },

    // Scheduled tasks (replaces node-cron)
    scheduledTasks: {
      // Ping server every minute to keep free-tier instances alive
      "*/1 * * * *": ["ping:server"],
    },
  },

  // Runtime config — server-only (not exposed to client)
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/api21",
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    pingUrl: process.env.PING_URL || "",
    nodeEnv: process.env.NODE_ENV || "development",
  },
});
