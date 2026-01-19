// Environment configuration
const config = {
  server: {
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || '*', // Allow all origins for deployment; restrict in production if needed
    downloadDomain: process.env.DOWNLOAD_DOMAIN || 'http://localhost:3001' // Domain for download URLs
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyB2TYXIwocrojS7EIMqPt0m0KFQLOCdfes'
  },
  discord: {
    webhookUrl: process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1405309205140865106/pnhcTcOcXQs2Aed4-iPOQwt9Z_w22fcd1Do-3anH3CdiYiByhs-7Eb9nSKbpmCFs6FMx'
  },
  vercel: {
    blobToken: process.env.BLOB_READ_WRITE_TOKEN || 'vercel_blob_rw_v1CVyA3jdnWIxCgp_AZ7jVWCCGghjlt9WNmVaIiFY7g2I6A',
    blobStoreId: process.env.BLOB_STORE_ID || null // Optional, uses default if not specified
  }
};

module.exports = config; 