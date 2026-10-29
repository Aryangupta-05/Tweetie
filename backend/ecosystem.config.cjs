module.exports = {
  apps: [
    {
      name: "tweetie-api",
      script: "server.js",
      instances: "max",       // Utilize all available CPU cores on EC2
      exec_mode: "cluster",   // Cluster mode for high availability
      autorestart: true,      // Automatically restart if application crashes
      watch: false,           // Do not watch files in production
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};
