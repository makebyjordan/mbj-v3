module.exports = {
  apps: [
    {
      name: 'mbj-v3-api',
      cwd: '/var/www/mbj-v3/server',
      script: 'src/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
