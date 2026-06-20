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
        PORT: "8081",
        GO_ENV: "production",
      },
    },
  ],
};
