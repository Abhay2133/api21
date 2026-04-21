import type { Request, Response, NextFunction } from "express";
import type { ApiResponse } from "../types";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const body: ApiResponse = {
    success: false,
    error: err.message ?? "Internal Server Error",
  };
  res.status(statusCode).json(body);
}
