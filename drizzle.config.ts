import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

console.log(`.env.${process.env.NODE_ENV || "development"}`);
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL no está definida. Revisa tu archivo .env correspondiente al NODE_ENV actual.",
  );
}

export default defineConfig({
  schema: "./src/infra/dataAccess/db/schema/",
  out: "./src/infra/dataAccess/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
