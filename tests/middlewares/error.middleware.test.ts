import { describe, expect, test, mock } from "bun:test";
import type { Request, Response, NextFunction } from "express";
import { AppError, errorMiddleware } from "../../src/middlewares/error.middleware";

describe("error.middleware", () => {
  describe("AppError", () => {
    test("should set statusCode and message correctly", () => {
      const error = new AppError(400, "Bad Request");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Bad Request");
      expect(error.name).toBe("AppError");
    });
  });

  describe("errorMiddleware", () => {
    test("should handle AppError and return custom status code and message", () => {
      const error = new AppError(404, "Not Found");
      const req = {} as Request;
      const res = {
        status: mock().mockReturnThis(),
        json: mock().mockReturnThis(),
      } as unknown as Response;
      const next = mock() as NextFunction;

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Not Found",
      });
    });

    test("should handle standard Error and return status 500", () => {
      const error = new Error("Something went wrong");
      const req = {} as Request;
      const res = {
        status: mock().mockReturnThis(),
        json: mock().mockReturnThis(),
      } as unknown as Response;
      const next = mock() as NextFunction;

      errorMiddleware(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Something went wrong",
      });
    });
  });
});
