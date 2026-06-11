import knex from "knex";

const config = useRuntimeConfig();

const db = knex({
  client: "pg",
  connection: config.databaseUrl,
  pool: {
    min: 2,
    max: 10,
  },
});

export { db };

export async function connectDB(): Promise<void> {
  try {
    await db.raw("SELECT 1");
    // Hide password in logged connection string
    const sanitizedUrl = config.databaseUrl.replace(/:[^:@\n]+@/, ":***@");
    console.log("[pg] connected:", sanitizedUrl);
  } catch (err) {
    console.error("[pg] connection error:", err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await db.destroy();
}
