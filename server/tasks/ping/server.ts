// Nitro Task: ping:server
// Replaces the node-cron ping.job.ts
// Scheduled every minute via scheduledTasks in nuxt.config.ts
// Can be manually triggered in dev: GET /_nitro/tasks/ping:server

export default defineTask({
  meta: {
    name: "ping:server",
    description: "Ping PING_URL every minute to keep free-tier instances alive.",
  },
  async run({ payload }) {
    const config = useRuntimeConfig();
    const pingUrl = config.pingUrl;

    if (!pingUrl) {
      return { result: "skipped: PING_URL not set" };
    }

    const res = await fetch(pingUrl);
    console.log(`[task:ping:server] ${pingUrl} → ${res.status}`);

    return { result: res.status };
  },
});
