module.exports = {
  apps: [
    {
      name: "api21",
      script: "./bin/api21_buffalo",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        PORT: "3000",
        GO_ENV: "production",
      },
    },
  ],
};
