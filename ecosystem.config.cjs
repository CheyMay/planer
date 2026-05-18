module.exports = {
  apps: [
    {
      name: "planer",
      script: "server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        HOST: "127.0.0.1",
        PORT: "4174",
        MAX_BACKUPS: "100",
      },
    },
  ],
};
