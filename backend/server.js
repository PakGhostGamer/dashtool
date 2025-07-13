const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../dist')));

// SMTP Configuration - Hostinger Email
const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true for SSL on port 465
  auth: {
    user: 'portal@ecomgliders.com',
    pass: 'Ecomgliders.llc.11'
  }
};

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { smtpConfig, emailPayload } = req.body;
    
    // Use provided SMTP config or fallback to default
    const config = smtpConfig || SMTP_CONFIG;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: emailPayload.from,
      to: emailPayload.to,
      subject: emailPayload.subject,
      html: emailPayload.html,
      attachments: emailPayload.attachments
    });

    console.log('Email sent successfully:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
    
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Email endpoint: http://localhost:${PORT}/api/send-email`);
}); 