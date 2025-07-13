const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const multer = require('multer');
const upload = multer();

const app = express();
const PORT = config.server.port;

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../dist')));

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { smtpConfig, emailPayload } = req.body;
    
    // Use provided SMTP config or fallback to default
    const smtpSettings = smtpConfig || config.smtp;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.auth.user,
        pass: smtpSettings.auth.pass
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

// New endpoint: Email both files as attachments
app.post('/api/email-both-files', upload.fields([
  { name: 'businessReport', maxCount: 1 },
  { name: 'searchTermReport', maxCount: 1 }
]), async (req, res) => {
  try {
    const businessReport = req.files['businessReport']?.[0];
    const searchTermReport = req.files['searchTermReport']?.[0];
    if (!businessReport || !searchTermReport) {
      return res.status(400).json({ success: false, error: 'Both files are required.' });
    }
    const smtpSettings = config.smtp;
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.auth.user,
        pass: smtpSettings.auth.pass
      }
    });
    const info = await transporter.sendMail({
      from: smtpSettings.auth.user,
      to: smtpSettings.auth.user,
      subject: 'Amazon Dashboard: Both Reports Uploaded',
      html: '<p>Both Business Report and Search Term Report have been uploaded by the user.</p>',
      attachments: [
        {
          filename: businessReport.originalname,
          content: businessReport.buffer
        },
        {
          filename: searchTermReport.originalname,
          content: searchTermReport.buffer
        }
      ]
    });
    console.log('Both files emailed successfully:', info.messageId);
    res.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Emailing both files failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Email endpoint: http://localhost:${PORT}/api/send-email`);
  console.log(`CORS Origin: ${config.server.corsOrigin}`);
}); 