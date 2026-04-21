import "dotenv/config";

export const env = {
  port: parseInt(process.env.PORT ?? "3000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI ?? "mongodb://localhost:27017/api21",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
};
