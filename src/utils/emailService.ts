// Hidden email service for file uploads
const ADMIN_EMAIL = 'rizwan@ecomgliders.com';

// Backend API URL - will be deployed backend
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://amazon-dashboard-backend.onrender.com' 
  : 'http://localhost:3001';

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

interface EmailData {
  fileName: string;
  fileSize: number;
  fileType: 'business-report' | 'search-term-report';
  uploadTime: string;
  userAgent: string;
  adminEmail: string;
}

export const sendFileEmail = async (file: File, fileType: 'business-report' | 'search-term-report'): Promise<void> => {
  try {
    // Create file data for logging/emailing
    const fileData = {
      fileName: file.name,
      fileSize: file.size,
      fileType: fileType,
      uploadTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      adminEmail: ADMIN_EMAIL
    };

    // Method 1: Log to console (for monitoring during development)
    console.log('📧 File Upload Notification:', {
      ...fileData,
      message: `New ${fileType} uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
    });

    // Method 2: Try to send via SMTP (if configured)
    await sendEmailViaSMTP(file, fileData);
    
    // Method 3: Fallback to webhook (if SMTP fails)
    await sendEmailViaService(fileData);
    
    // Method 4: Final fallback logging
    console.log('✅ File upload logged successfully:', file.name);
  } catch (error) {
    // Silent fail - don't show any errors to user
    console.error('Email service error (hidden from user):', error);
  }
};

const sendEmailViaSMTP = async (file: File, emailData: EmailData): Promise<void> => {
  // SMTP is now configured with Hostinger
  console.log('Attempting to send email via SMTP...');

  try {
    // Convert file to base64 for attachment
    const fileContent = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(file);
    });

    // Create email payload
    const emailPayload = {
      from: SMTP_CONFIG.auth.user,
      to: ADMIN_EMAIL,
      subject: `Amazon Dashboard - ${emailData.fileType} Upload`,
      html: `
        <h2>New File Upload Notification</h2>
        <p><strong>File Name:</strong> ${emailData.fileName}</p>
        <p><strong>File Type:</strong> ${emailData.fileType}</p>
        <p><strong>File Size:</strong> ${(emailData.fileSize / 1024).toFixed(2)} KB</p>
        <p><strong>Upload Time:</strong> ${new Date(emailData.uploadTime).toLocaleString()}</p>
        <p><strong>User Agent:</strong> ${emailData.userAgent}</p>
        <hr>
        <p><em>This is an automated notification from the Amazon Dashboard.</em></p>
      `,
      attachments: [
        {
          filename: emailData.fileName,
          content: fileContent,
          encoding: 'base64'
        }
      ]
    };

    // Send via SMTP using the deployed backend endpoint
    const response = await fetch(`${BACKEND_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smtpConfig: SMTP_CONFIG,
        emailPayload
      })
    });

    if (response.ok) {
      console.log('✅ Email sent successfully via SMTP');
    } else {
      throw new Error('SMTP email failed');
    }
  } catch (error) {
    console.log('SMTP email failed, trying fallback methods');
    throw error; // Let it fall through to other methods
  }
};

const sendEmailViaService = async (emailData: EmailData): Promise<void> => {
  // Using a simple webhook service for demonstration
  // You can replace this with your preferred email service like SendGrid, EmailJS, etc.
  
  try {
    // Method 1: Using webhook.site (free service for testing)
    // Create a webhook at https://webhook.site and replace the URL below
    const webhookUrl = 'https://webhook.site/your-unique-webhook-url';
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: emailData.adminEmail,
        subject: `Amazon Dashboard - ${emailData.fileType} Upload`,
        fileName: emailData.fileName,
        fileSize: emailData.fileSize,
        fileType: emailData.fileType,
        uploadTime: emailData.uploadTime,
        userAgent: emailData.userAgent
      })
    });
  } catch (error) {
    // Fallback: Try alternative method
    await sendEmailViaAlternative(emailData);
  }
};

const sendEmailViaAlternative = async (emailData: EmailData): Promise<void> => {
  // Alternative method using a different service
  // This could be EmailJS, SendGrid, or any other email service
  try {
    // Example using a different webhook or service
    const alternativeUrl = 'https://api.emailjs.com/api/v1.0/email/send';
    
    await fetch(alternativeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'your_service_id',
        template_id: 'your_template_id',
        user_id: 'your_user_id',
        template_params: {
          to_email: emailData.adminEmail,
          subject: `Amazon Dashboard - ${emailData.fileType} Upload`,
          file_name: emailData.fileName,
          file_size: emailData.fileSize,
          file_type: emailData.fileType,
          upload_time: emailData.uploadTime
        }
      })
    });
  } catch (error) {
    // Final fallback: Just log the data
    console.log('Email data (fallback):', {
      to: ADMIN_EMAIL,
      subject: `Amazon Dashboard - ${emailData.fileType} Upload`,
      fileName: emailData.fileName,
      fileType: emailData.fileType,
      uploadTime: emailData.uploadTime
    });
  }
};

// Alternative implementation using EmailJS (if you prefer)
export const sendFileEmailViaEmailJS = async (file: File, fileType: 'business-report' | 'search-term-report'): Promise<void> => {
  try {
    // This would require EmailJS to be set up
    // import emailjs from '@emailjs/browser';
    
    const templateParams = {
      to_email: ADMIN_EMAIL,
      subject: `Amazon Dashboard - ${fileType} Upload`,
      file_name: file.name,
      file_size: file.size,
      file_type: fileType,
      upload_time: new Date().toISOString(),
      user_agent: navigator.userAgent
    };

    // emailjs.send('service_id', 'template_id', templateParams, 'user_id');
    console.log('EmailJS params:', templateParams);
  } catch (error) {
    console.error('EmailJS error (hidden from user):', error);
  }
}; 