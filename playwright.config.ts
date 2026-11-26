import { defineConfig, devices } from "@playwright/test";

// 핵심 흐름 E2E(PRD 8장 M2): 시나리오 1–3을 데스크톱·모바일에서, 시나리오 5(1–2단계)를 데스크톱에서.
// 테스트 DB(goodsshop_test)를 시드로 초기화하고 운영 빌드를 3200 포트로 띄운다.
const DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/goodsshop_test";
process.env.DATABASE_URL = DATABASE_URL;

export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3200", trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /admin\.spec/ },
  ],
  webServer: {
    command: "npm run build && npx next start -p 3200",
    url: "http://localhost:3200/api/health",
    timeout: 180_000,
    reuseExistingServer: false,
    env: { DATABASE_URL, PORT: "3200" },
  },
});
