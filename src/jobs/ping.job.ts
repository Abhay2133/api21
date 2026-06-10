import type { CronJob } from "./index";

// Pings PING_URL every 14 minutes to keep free-tier instances alive.
// Set PING_URL in .env to your deployed server URL.


export const pingJob: CronJob = {
  name: "ping-server",
  schedule: "*/1 * * * *",
  handler: async () => {
    const pingUrl = process.env.PING_URL;
    if (!pingUrl) return;

    const res = await fetch(pingUrl);
    console.log(`[cron:ping-server] ${pingUrl} → ${res.status}`);
  },
};
