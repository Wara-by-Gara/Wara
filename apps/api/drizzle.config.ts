import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// EC2: `set -a && source /home/ubuntu/.env.production && set +a` 후 migrate 실행.
// DATABASE_URL이 이미 있으면 dotenv가 덮어쓰지 않음 (override 기본 false).
const envFile =
  process.env.DRIZZLE_ENV_FILE ??
  (process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env.development");
dotenv.config({ path: envFile });

export default {
  schema: "./src/database/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;