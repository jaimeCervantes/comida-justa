import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const isProduction = process.env.NODE_ENV === "production";

// El bundle de Next puede evaluar este módulo más de una vez dentro del mismo proceso
// (los chunks `ssr` y `rsc` son distintos), y cada evaluación abriría su propio Pool.
// Guardarlo en globalThis garantiza una sola instancia por proceso; de paso evita fugas
// de conexiones con el hot reload en desarrollo.
const globalForDb = globalThis as unknown as { cjPool?: Pool };

const pool =
  globalForDb.cjPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    // En serverless el multiplicador es el número de instancias, no las conexiones por
    // instancia: cada lambda trae su propio Pool. Un `max` alto solo agota más rápido el
    // pooler de Supabase (topa en 15 clientes).
    max: 3,
    // Vercel congela la instancia entre peticiones, así que una conexión ociosa retiene
    // su lugar en el pooler sin dar servicio. Se sueltan pronto.
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });

globalForDb.cjPool = pool;

export const db = drizzle(pool);
