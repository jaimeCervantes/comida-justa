import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

console.log(`.env.${process.env.NODE_ENV || "development"}`);
dotenv.config({ path: `.env.${process.env.NODE_ENV || "development"}` });

console.log("DATABASE_URL:", process.env.DATABASE_URL);
export default defineConfig({
  schema: "./src/infra/dataAccess/db/schema/",
  out: "./src/infra/dataAccess/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: {
      rejectUnauthorized: false,
    },
  },
});
