// @vitest-environment node
import { describe, expect, it, vi, afterEach, beforeAll } from "vitest";

vi.mock("../../node_modules/nuxt/dist/app/nuxt.js", () => {
  const mockUseRuntimeConfig = vi.fn(() => ({
    pingUrl: "https://mock-ping-server.com/health",
  }));

  (global as any).__mockUseRuntimeConfig = mockUseRuntimeConfig;

  return {
    useRuntimeConfig: mockUseRuntimeConfig,
  };
});

(global as any).defineTask = (task: any) => task;

let pingTask: any;

beforeAll(async () => {
  pingTask = (await import("../../server/tasks/ping/server")).default;
});

describe("ping:server task", () => {
  const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  afterEach(() => {
    consoleLogSpy.mockClear();
    vi.restoreAllMocks();
  });

  it("should fetch PING_URL and log response status when PING_URL is set", async () => {
    const useRuntimeConfigMock = (global as any).__mockUseRuntimeConfig;
    useRuntimeConfigMock.mockReturnValue({
      pingUrl: "https://mock-ping-server.com/health",
    });

    const mockResponse = { status: 200 } as Response;
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue(mockResponse);

    const result = await pingTask.run({ payload: {} });

    expect(fetchSpy).toHaveBeenCalledWith("https://mock-ping-server.com/health");
    expect(consoleLogSpy).toHaveBeenCalledWith("[task:ping:server] https://mock-ping-server.com/health → 200");
    expect(result).toEqual({ result: 200 });
  });

  it("should skip if PING_URL is not set", async () => {
    const useRuntimeConfigMock = (global as any).__mockUseRuntimeConfig;
    useRuntimeConfigMock.mockReturnValue({
      pingUrl: "",
    });

    const fetchSpy = vi.spyOn(global, "fetch");

    const result = await pingTask.run({ payload: {} });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result).toEqual({ result: "skipped: PING_URL not set" });
  });
});
