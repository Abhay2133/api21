import http from 'http';
import https from 'https';
import { config } from '../config/env.js';

let pingInterval: NodeJS.Timeout | null = null;

export const startPingWorker = () => {
  if (!config.pingUrl) {
    console.log('[PingService] No PING_URL configured. Worker disabled.');
    return;
  }

  console.log(`[PingService] Starting background ping worker for: ${config.pingUrl}`);

  const ping = () => {
    const client = config.pingUrl.startsWith('https') ? https : http;
    client
      .get(config.pingUrl, (res) => {
        console.log(`[PingService] Self ping response status: ${res.statusCode}`);
      })
      .on('error', (err) => {
        console.warn(`[PingService] Self ping failed: ${err.message}`);
      });
  };

  // Initial ping and repeat every 5 minutes
  ping();
  pingInterval = setInterval(ping, 5 * 60 * 1000);
};

export const stopPingWorker = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
};
