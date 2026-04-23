import pg from "pg";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getPostgresPool() {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL nao definido para DATA_PROVIDER=postgres");
  }

  pool = new Pool({
    connectionString,
    ssl: connectionString.includes("localhost")
      ? false
      : {
          rejectUnauthorized: false,
        },
  });

  return pool;
}

export async function pingPostgres() {
  const activePool = getPostgresPool();
  const client = await activePool.connect();

  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}
