module.exports = {
  apps: [
    {
      name: "api21",
      // Nuxt build output — replaces old dist/server.js
      script: ".output/server/index.mjs",
      interpreter: "bun",
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
      },
    },
  ],
};
