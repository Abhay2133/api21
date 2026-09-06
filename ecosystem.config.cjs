module.exports = {
  apps: [
    {
      name: "apps21-backend",
      script: "./apps/api/dist/main.js",
      node_args: "--import ./apps/api/dist/instrument.js",
      exec_mode: "cluster",
      instances: "max",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "apps21-worker",
      script: "./apps/api/dist/worker.js",
      node_args: "--import ./apps/api/dist/instrument.js",
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
