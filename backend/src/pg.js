import pg from "pg";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const isPgConfigured = Boolean(
  connectionString &&
  (connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://"))
);

export const pool = isPgConfigured
  ? new pg.Pool({
      connectionString,
      ssl: connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
    })
  : null;

if (isPgConfigured) {
  console.log("[Render PostgreSQL] Live database pool initialized from DATABASE_URL");
}
