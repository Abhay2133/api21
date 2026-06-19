module.exports = {
  apps: [
    {
      name: "api21-backend",
      script: "./bin/api21_server",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: "3000",
        GO_ENV: "production",
        SSR_SERVER_URL: "http://localhost:8081",
      },
    },
    {
      name: "api21-ssr",
      script: "./frontend/server.ts",
      interpreter: "bun",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: "8081",
        NODE_ENV: "production",
      },
    },
  ],
};
