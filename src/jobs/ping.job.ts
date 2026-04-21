import type { CronJob } from "./index";

// Pings PING_URL every 14 minutes to keep free-tier instances alive.
// Set PING_URL in .env to your deployed server URL.
const PING_URL = process.env.PING_URL;

export const pingJob: CronJob = {
  name: "ping-server",
  schedule: "*/1 * * * *",
  handler: async () => {
    if (!PING_URL) return;

    const res = await fetch(PING_URL);
    console.log(`[cron:ping-server] ${PING_URL} → ${res.status}`);
  },
};
