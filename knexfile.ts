import type { Knex } from "knex";
import "dotenv/config";

const databaseUrl =
  process.env.DATABASE_URL && process.env.DATABASE_URL !== ""
    ? process.env.DATABASE_URL
    : "postgres://postgres:postgres@localhost:5432/api21";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: databaseUrl,
    migrations: {
      directory: "./server/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./server/db/seeds",
    },
  },
  test: {
    client: "pg",
    connection: databaseUrl,
    migrations: {
      directory: "./server/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./server/db/seeds",
    },
  },
  production: {
    client: "pg",
    connection: {
      connectionString: databaseUrl,
      ssl:
        process.env.DATABASE_SSL === "true" || process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
    },
    migrations: {
      directory: "./server/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./server/db/seeds",
    },
  },
};

export default config;
