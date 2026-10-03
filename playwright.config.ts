import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    env: {
      NEXTAUTH_URL: "http://127.0.0.1:3100",
      NEXTAUTH_SECRET:
        "only-for-automated-tests-not-for-real-deployments-12345",
      BLOG_USERS: JSON.stringify([
        {
          username: "test-writer",
          password: "test-writer-password",
          name: "Test Writer",
        },
        { username: "plain-writer", password: "pw" },
      ]),
    },
  },
});
