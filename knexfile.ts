import type { Knex } from "knex";
import "dotenv/config";

const databaseUrl =
  process.env.DATABASE_URL && process.env.DATABASE_URL !== ""
    ? process.env.DATABASE_URL
    : "./server/db/dev.sqlite3";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: databaseUrl,
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./server/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./server/db/seeds",
    },
  },
  test: {
    client: "sqlite3",
    connection: {
      filename: "./server/db/test.sqlite3",
    },
    useNullAsDefault: true,
    migrations: {
      directory: "./server/db/migrations",
      extension: "ts",
    },
    seeds: {
      directory: "./server/db/seeds",
    },
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: databaseUrl,
    },
    useNullAsDefault: true,
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
