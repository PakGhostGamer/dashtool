// Environment configuration
const config = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
      user: process.env.SMTP_USER || 'portal@ecomgliders.com',
      pass: process.env.SMTP_PASS || 'Ecomgliders.llc.11'
    }
  },
  server: {
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || 'https://tool.ecomgliders.com'
  }
};

module.exports = config; 