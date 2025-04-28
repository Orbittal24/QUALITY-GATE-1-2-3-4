module.exports = {
    apps: [
      {
        name: 'nextjs-dev',
        script: 'npm',
        args: 'run start-pm2',
        env: {
          NODE_ENV: 'development',
        },
      },
    ],
  };
  