import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    setupFiles: ["./tests/setup/global.ts"],
    alias: {
      "~": new URL("./", import.meta.url).pathname,
      "~~": new URL("./", import.meta.url).pathname,
      "@": new URL("./", import.meta.url).pathname,
    },
    exclude: [
      "**/node_modules/**",
      "**/.nuxt/**",
      "**/dist/**",
      "tests/e2e/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
      include: ["server/**/*.ts", "app/**/*.ts"],
      exclude: [
        "node_modules",
        ".nuxt",
        "nuxt.config.ts",
        "**/*.d.ts",
        "**/index.ts",
        "server/plugins/**",
      ],
    },
  },
});
