module.exports = {
  apps: [
    {
      name: "api21",
      script: "dist/server.js",
      // Tell PM2 to use the Bun runtime to execute the script
      interpreter: "bun",
      // PM2's cluster mode is not natively supported by Bun (relies on Node's cluster module).
      // We use fork mode (default) to run Bun processes.
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      }
    },
  ],
};
