import "dotenv/config";

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/api21",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
};

