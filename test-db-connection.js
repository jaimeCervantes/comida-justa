import pkg from 'pg';
import * as dotenv from 'dotenv';
const { Client } = pkg;

dotenv.config({ path: '.env.development' });

async function testConnection() {
  console.log("Intentando conectar a:", process.env.DATABASE_URL ? "DATABASE_URL encontrada" : "DATABASE_URL es UNDEFINED");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("¡CONEXIÓN EXITOSA CON SUPABASE!");
    const res = await client.query('SELECT NOW()');
    console.log("Hora del servidor de base de datos:", res.rows[0].now);
    await client.end();
  } catch (error) {
    console.error("❌ ERROR DETALLADO DE CONEXIÓN:");
    console.error(error);
  }
}

testConnection();