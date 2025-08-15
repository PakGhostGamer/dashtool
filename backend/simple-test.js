import nodemailer from 'nodemailer';

// SMTP Configuration - Hostinger Email
const SMTP_CONFIG = {
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: 'portal@ecomgliders.com',
    pass: 'Ecomgliders.llc.11'
  }
};

async function testSMTP() {
  try {
    console.log('🔍 Testing SMTP connection...');
    console.log('Host:', SMTP_CONFIG.host);
    console.log('Port:', SMTP_CONFIG.port);
    console.log('User:', SMTP_CONFIG.auth.user);
    
    // Create transporter
    const transporter = nodemailer.createTransport(SMTP_CONFIG);
    
    // Verify connection
    console.log('📡 Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
    
    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: 'portal@ecomgliders.com',
      to: 'rizwan@ecomgliders.com',
      subject: 'SMTP Test - Amazon Dashboard',
      html: `
        <h2>SMTP Test Successful!</h2>
        <p>This email confirms that your SMTP configuration is working correctly.</p>
        <p><strong>From:</strong> portal@ecomgliders.com</p>
        <p><strong>To:</strong> rizwan@ecomgliders.com</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        <hr>
        <p><em>Your email system is now ready for file upload notifications!</em></p>
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  }
}

// Run the test
testSMTP(); 