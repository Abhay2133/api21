import { defineVitestConfig } from "@nuxt/test-utils/config";
import path from "node:path";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    exclude: ["**/node_modules/**", "**/dist/**", "**/tests/e2e/**"],
  },
  resolve: {
    alias: {
      "bun:test": path.resolve(__dirname, "./tests/mock-bun-test.ts"),
    },
  },
  ssr: {
    external: ["bun:test"],
  },
  optimizeDeps: {
    exclude: ["bun:test"],
  },
});
