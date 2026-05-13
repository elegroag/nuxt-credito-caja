import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    setupFiles: ["./tests/setup/global.ts"],
    alias: {
      "~": new URL("./app/", import.meta.url).pathname,
      "~/**": new URL("./app/", import.meta.url).pathname,
      "~~": new URL("./", import.meta.url).pathname,
      "@": new URL("./app/", import.meta.url).pathname,
      "@/**": new URL("./app/", import.meta.url).pathname,
      "@tests": new URL("./tests/", import.meta.url).pathname
    },
    exclude: ["**/node_modules/**", "**/.nuxt/**", "**/dist/**", "tests/e2e/**"],
    include: ["tests/integration/**/*.spec.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      },
      include: ["server/**/*.ts", "app/**/*.ts"],
      exclude: [
        "node_modules",
        ".nuxt",
        "nuxt.config.ts",
        "**/*.d.ts",
        "**/index.ts",
        "server/plugins/**"
      ]
    }
  }
});
