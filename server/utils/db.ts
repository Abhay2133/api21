import knex from "knex";

const config = useRuntimeConfig();

const db = knex({
  client: "sqlite3",
  connection: {
    filename: config.databaseUrl || "./server/db/dev.sqlite3",
  },
  useNullAsDefault: true,
});

export { db };

export async function connectDB(): Promise<void> {
  try {
    await db.raw("SELECT 1");
    console.log("[sqlite] connected to:", config.databaseUrl || "./server/db/dev.sqlite3");
  } catch (err) {
    console.error("[sqlite] connection error:", err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await db.destroy();
}
