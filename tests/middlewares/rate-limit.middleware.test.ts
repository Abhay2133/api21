// @vitest-environment node
import { vi, describe, it, expect, beforeEach, beforeAll } from "vitest";

// Mock the redis utility (using correct path relative to the test file)
const mockRedis = {
  incr: vi.fn(),
  expire: vi.fn(),
};
vi.mock("../../server/utils/redis", () => ({
  getRedisClient: () => mockRedis,
}));

vi.mock("h3", () => {
  const mockSetResponseHeader = vi.fn();
  const mockCreateError = vi.fn((errObj) => {
    const err = new Error(errObj.message);
    (err as any).statusCode = errObj.statusCode;
    return err;
  });

  const defineEventHandler = (handler: any) => handler;

  // Assign to global scope immediately during hoisting
  (global as any).defineEventHandler = defineEventHandler;
  (globalThis as any).defineEventHandler = defineEventHandler;

  (global as any).setResponseHeader = mockSetResponseHeader;
  (globalThis as any).setResponseHeader = mockSetResponseHeader;

  (global as any).createError = mockCreateError;
  (globalThis as any).createError = mockCreateError;

  (global as any).__mockSetResponseHeader = mockSetResponseHeader;
  (global as any).__mockCreateError = mockCreateError;

  return {
    defineEventHandler,
    setResponseHeader: mockSetResponseHeader,
    createError: mockCreateError,
  };
});

let rateLimitMiddleware: any;

beforeAll(async () => {
  rateLimitMiddleware = (await import("../../server/middleware/rate-limit")).default;
});

describe("rate-limit middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should ignore non-API routes", async () => {
    const mockEvent = {
      node: {
        req: { url: "/" },
      },
    } as any;

    await rateLimitMiddleware(mockEvent);

    expect(mockRedis.incr).not.toHaveBeenCalled();
  });

  it("should allow requests under rate limit", async () => {
    mockRedis.incr.mockResolvedValue(1); // First request
    mockRedis.expire.mockResolvedValue(true);

    const mockEvent = {
      node: {
        req: {
          url: "/api/v1/health",
          headers: { "x-forwarded-for": "1.2.3.4" },
        },
      },
    } as any;

    await rateLimitMiddleware(mockEvent);

    const mockSetResponseHeader = (global as any).__mockSetResponseHeader;

    expect(mockRedis.incr).toHaveBeenCalledWith("ratelimit:global:1.2.3.4");
    expect(mockRedis.expire).toHaveBeenCalledWith("ratelimit:global:1.2.3.4", 900); // 15 mins = 900s
    expect(mockSetResponseHeader).toHaveBeenCalledWith(mockEvent, "X-RateLimit-Limit", "200");
    expect(mockSetResponseHeader).toHaveBeenCalledWith(mockEvent, "X-RateLimit-Remaining", "199");
  });

  it("should block requests exceeding limit", async () => {
    mockRedis.incr.mockResolvedValue(201); // Exceeds 200

    const mockEvent = {
      node: {
        req: {
          url: "/api/v1/health",
          headers: { "x-forwarded-for": "1.2.3.4" },
        },
      },
    } as any;

    const mockCreateError = (global as any).__mockCreateError;

    await expect(rateLimitMiddleware(mockEvent)).rejects.toThrow("Too many requests, please slow down.");
    expect(mockCreateError).toHaveBeenCalledWith({
      statusCode: 429,
      message: "Too many requests, please slow down.",
    });
  });

  it("should fail open on redis errors", async () => {
    mockRedis.incr.mockRejectedValue(new Error("Redis error"));

    const mockEvent = {
      node: {
        req: {
          url: "/api/v1/health",
          headers: { "x-forwarded-for": "1.2.3.4" },
        },
      },
    } as any;

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should not throw, should just log and pass
    await rateLimitMiddleware(mockEvent);

    expect(consoleErrorSpy).toHaveBeenCalledWith("[rate-limit] Redis error, failing open:", "Redis error");
    consoleErrorSpy.mockRestore();
  });
});
