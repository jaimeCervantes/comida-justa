import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const isProduction = process.env.NODE_ENV === "production";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Opcional pero recomendado para el pooler en modo transacción. Evita que se queden conexiones colgadas en entornos serverless
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
export const db = drizzle(pool);
