import { mock, describe, expect, test, spyOn, afterEach } from "bun:test";

// Set PING_URL before import to ensure it is captured
process.env.PING_URL = "https://mock-ping-server.com/health";

import { pingJob } from "../../src/jobs/ping.job";

describe("ping.job", () => {
  const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});

  afterEach(() => {
    consoleLogSpy.mockClear();
  });

  test("should fetch PING_URL and log response status when PING_URL is set", async () => {
    const mockResponse = { status: 200 } as Response;
    const fetchSpy = spyOn(global, "fetch").mockResolvedValue(mockResponse);

    await pingJob.handler();

    expect(fetchSpy).toHaveBeenCalledWith("https://mock-ping-server.com/health");
    expect(consoleLogSpy).toHaveBeenCalledWith("[cron:ping-server] https://mock-ping-server.com/health → 200");

    fetchSpy.mockRestore();
  });
});
