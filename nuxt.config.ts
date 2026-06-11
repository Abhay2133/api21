import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",

  // SSR enabled (default, explicit)
  ssr: true,

  // Global CSS
  css: ["~/assets/css/main.css"],

  // Tailwind via Vite plugin (same as old vite.config.ts)
  vite: {
    plugins: [tailwindcss()],
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
