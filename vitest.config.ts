import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin"
import { defineConfig } from "vitest/config"

// Worker tests run inside workerd with real (local) D1, KV and R2 bindings.
export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations")

  return {
    plugins: [
      cloudflareTest({
        main: "./worker/index.ts",
        wrangler: { configPath: "./wrangler.jsonc" },
        miniflare: { bindings: { TEST_MIGRATIONS: migrations } },
      }),
    ],
    test: {
      include: ["worker/**/*.test.ts"],
      setupFiles: ["./worker/test/apply-migrations.ts"],
    },
  }
})
