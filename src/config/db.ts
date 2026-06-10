import knex from "knex";
import { env } from "./env";

const config = {
  client: "pg",
  connection: env.databaseUrl,
  pool: {
    min: 2,
    max: 10,
  },
};

export const db = knex(config);

export async function connectDB(): Promise<void> {
  try {
    await db.raw("SELECT 1");
    // Hide password in logged connection string
    const sanitizedUrl = env.databaseUrl.replace(/:[^:@\n]+@/, ':***@');
    console.log("[pg] connected:", sanitizedUrl);
  } catch (err) {
    console.error("[pg] connection error:", err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  await db.destroy();
}
