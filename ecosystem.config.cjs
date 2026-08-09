module.exports = {
  apps: [
    {
      name: "api21-backend",
      script: "./dist/server.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: "3000",
        NODE_ENV: "production",
      },
    },
    {
      name: "api21-worker",
      script: "./dist/worker.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
