import { setup } from "@nuxt/test-utils/e2e";

beforeAll(async () => {
  await setup({
    rootDir: ".",
    server: true,
    port: 4000
  });
});
