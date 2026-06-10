import { mock, describe, expect, test, spyOn, afterEach } from "bun:test";

const mockTask = {
  stop: mock(),
};

const mockCronSchedule = mock((_schedule: string, callback: () => void) => {
  return mockTask;
});

mock.module("node-cron", () => ({
  default: {
    schedule: mockCronSchedule,
  },
}));

import { registerJobs, stopAllJobs } from "../../src/jobs";

describe("jobs index (cron manager)", () => {
  const consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
  const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    mockTask.stop.mockClear();
    mockCronSchedule.mockClear();
    consoleLogSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  test("should register a job and start it", async () => {
    const handler = mock(() => {});
    const job = {
      name: "test-job",
      schedule: "* * * * *",
      handler,
    };

    registerJobs([job]);

    expect(mockCronSchedule).toHaveBeenCalledWith("* * * * *", expect.any(Function));
    expect(consoleLogSpy).toHaveBeenCalledWith('[cron] registered "test-job" → * * * * *');

    // Trigger the registered handler callback manually
    const callback = mockCronSchedule.mock.calls[0][1];
    await callback();

    expect(handler).toHaveBeenCalled();
  });

  test("should log errors thrown by job handlers", async () => {
    const handler = mock(() => {
      throw new Error("Job Failed");
    });
    const job = {
      name: "failing-job",
      schedule: "* * * * *",
      handler,
    };

    registerJobs([job]);

    const callback = mockCronSchedule.mock.calls[0][1];
    await callback();

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls[0][0];
    expect(errorLog).toContain("[cron:failing-job] error:");
  });

  test("should stop all registered jobs", () => {
    stopAllJobs();
    expect(mockTask.stop).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith("[cron] all jobs stopped");
  });
});
