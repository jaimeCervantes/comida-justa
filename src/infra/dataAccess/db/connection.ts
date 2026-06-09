import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const isProduction = process.env.NODE_ENV === "production";
console.log(`Process environment: ${process.env.NODE_ENV}`);
console.log(`Using DATABASE_URL: ${process.env.DATABASE_URL}`);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Opcional pero recomendado para el pooler en modo transacción. Evita que se queden conexiones colgadas en entornos serverless
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
export const db = drizzle(pool);
