module.exports = {
  apps: [
    {
      name: 'buscaappia',
      script: 'dist/backend/server.js',
      cwd: 'C:/Apps/BuscaapIA',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
