import { execSync } from "node:child_process";

export default function setup() {
  const env = { ...process.env, DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/goodsshop_test" };
  execSync("npx prisma migrate deploy", { stdio: "ignore", env });
  execSync("npx tsx prisma/seed.ts", { stdio: "ignore", env });
}
