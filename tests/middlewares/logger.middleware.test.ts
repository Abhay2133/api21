import { describe, expect, test, mock, spyOn, afterEach } from "bun:test";
import type { Request, Response, NextFunction } from "express";
import { loggerMiddleware } from "../../src/middlewares/logger.middleware";

describe("logger.middleware", () => {
  const consoleSpy = spyOn(console, "log").mockImplementation(() => {});

  afterEach(() => {
    consoleSpy.mockClear();
  });

  test("should register finish listener and call next()", () => {
    const req = {
      method: "GET",
      originalUrl: "/api/v1/test",
    } as Request;

    const listeners: Record<string, () => void> = {};
    const res = {
      on: mock((event: string, callback: () => void) => {
        listeners[event] = callback;
      }),
      statusCode: 200,
    } as unknown as Response;

    const next = mock() as NextFunction;

    loggerMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));

    // Simulate response finishing
    if (listeners.finish) {
      listeners.finish();
    }

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0][0];
    expect(logCall).toContain("GET");
    expect(logCall).toContain("/api/v1/test");
    expect(logCall).toContain("200");
  });
});
