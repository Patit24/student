module.exports = {
  apps : [{
    name: "antigravity-api",
    script: "./server/index.js",
    env: {
      NODE_ENV: "production",
      PORT: 4000
    },
    instances: "max",
    exec_mode: "cluster"
  }]
}
