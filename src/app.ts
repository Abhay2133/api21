import express from "express";
import { loggerMiddleware } from "./middlewares/logger.middleware";
import { errorMiddleware } from "./middlewares/error.middleware";
import { globalLimiter } from "./middlewares/rate-limit.middleware";
import routes from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);
// Delegate to globalLimiter at request time (assigned after Redis connects)
app.use((req, res, next) => globalLimiter(req, res, next));

app.use("/api/v1", routes);

app.use(errorMiddleware);

export default app;
