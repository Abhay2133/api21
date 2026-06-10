import type { Knex } from "knex";
import { env } from "./src/config/env";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: env.databaseUrl,
    migrations: {
      directory: "./src/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
  production: {
    client: "pg",
    connection: {
      connectionString: env.databaseUrl,
      ssl: process.env.DATABASE_SSL === "true" || env.nodeEnv === "production"
        ? { rejectUnauthorized: false }
        : false,
    },
    migrations: {
      directory: "./src/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
};

export default config;
