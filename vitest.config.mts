import { defineConfig } from "vitest/config";
import path from "node:path";

// 정책 테스트(PRD 8장 M3·M5): 테스트 전용 DB(goodsshop_test)를 시드로 채운 뒤 lib/ 함수를 직접 부른다.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    fileParallelism: false, // 같은 DB를 쓰므로 파일을 순서대로
    testTimeout: 30_000,
  },
});
