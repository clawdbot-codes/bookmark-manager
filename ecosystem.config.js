module.exports = {
  apps: [{
    name: 'bookmark-manager',
    script: 'npm',
    args: 'start',
    cwd: '/home/nkbblocks/clawd/bookmark-manager',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}