import express from "express";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import { globalLimiter } from "./middlewares/rate-limit.middleware";
import routes from "./routes";
import { AppError } from "./middlewares/error.middleware";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
// Delegate to globalLimiter at request time for API routes
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/")) {
    return globalLimiter(req, res, next);
  }
  next();
});

app.use("/api/v1", routes);

// Catch-all for API routes not found
app.use("/api/*", (req, res, next) => {
  next(new AppError(404, "API route not found"));
});

export default app;
