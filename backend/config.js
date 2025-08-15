// Environment configuration
const config = {
  server: {
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || '*', // Allow all origins for deployment; restrict in production if needed
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyB2TYXIwocrojS7EIMqPt0m0KFQLOCdfes'
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1405309205140865106/pnhcTcOcXQs2Aed4-iPOQwt9Z_w22fcd1Do-3anH3CdiYiByhs-7Eb9nSKbpmCFs6FMx'
  }
};

module.exports = config; 