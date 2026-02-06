# Discord Webhook Setup Guide

## 🎯 What You'll Get

When anyone uploads files to your tool, you'll receive **detailed notifications on Discord** including:

✅ **Summary Notification** - Overview of the upload with key metrics
✅ **Business Reports Data** - Complete business performance data
✅ **Search Term Reports Data** - Complete search term performance data
✅ **File Previews** - First 10 rows of each file for quick review
✅ **Real-time Alerts** - Instant notifications whenever files are uploaded

## 🔧 Setup Steps

### 1. Create a Discord Server (if you don't have one)
- Open Discord and create a new server
- Or use an existing server where you want to receive notifications

### 2. Create a Discord Channel
- Create a dedicated channel for dashboard notifications (e.g., `#dashboard-alerts`)
- This is where you'll receive all file upload notifications

### 3. Set Up Webhook
1. **Right-click** on your channel
2. Select **"Edit Channel"**
3. Go to **"Integrations"** tab
4. Click **"Create Webhook"**
5. Give it a name (e.g., "PPC Dashboard Monitor")
6. **Copy the Webhook URL** (looks like: `https://discord.com/api/webhooks/...`)

### 4. Configure Your Backend
You have **3 options** to set up the webhook:

#### Option A: Environment Variable (Recommended)
Create a `.env` file in your `backend` folder:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
```

#### Option B: Update config.js
Edit `backend/config.js` and add your webhook URL:
```javascript
const config = {
  server: {
    port: process.env.PORT || 3001,
    corsOrigin: process.env.CORS_ORIGIN || '*',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'your_gemini_key_here'
  },
  discord: {
    webhookUrl: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE'
  }
};
```

#### Option C: Set Environment Variable in Terminal
```bash
# Windows PowerShell
$env:DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE"

# Windows Command Prompt
set DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
```

### 5. Restart Your Backend Server
```bash
cd backend
npm run dev
```

## 🧪 Test Your Setup

### Test the Discord Webhook
1. Start your backend server
2. Visit: `http://localhost:3001/api/test-discord`
3. Check your Discord channel for the test message

### Test with Real Files
1. Upload files through your dashboard
2. Check Discord for detailed notifications
3. You should see:
   - Summary notification
   - Business reports data
   - Search term reports data
   - File previews

## 📱 What You'll See on Discord

### 1. Summary Notification (Green)
- 📊 Files uploaded count
- 💰 Total spend and sales
- 🎯 Key metrics overview
- ⚠️ Performance alerts

### 2. Business Reports (Blue)
- 📁 File type and record count
- 📅 Upload timestamp
- 📊 Data preview (first 10 rows)

### 3. Search Term Reports (Orange)
- 🔍 File type and record count
- 📅 Upload timestamp
- 📊 Data preview (first 10 rows)

## 🔒 Security Features

- **Secret Monitoring**: Only you see the notifications
- **Data Privacy**: Files are sent to your private Discord channel
- **No External Access**: Webhook only sends data to your server

## 🚨 Troubleshooting

### Webhook Not Working?
1. **Check URL**: Ensure the webhook URL is correct and complete
2. **Test Webhook**: Use the test endpoint first
3. **Check Permissions**: Ensure the webhook has permission to send messages
4. **Restart Server**: Restart your backend after configuration changes

### Not Receiving Notifications?
1. **Verify Webhook**: Check if the webhook URL is properly configured
2. **Check Server Logs**: Look for Discord-related error messages
3. **Test Endpoint**: Use `/api/test-discord` to verify webhook functionality

### Files Too Large?
- Discord has a 4000 character limit for embed descriptions
- The system automatically shows first 10 rows to stay within limits
- Full data is always available in your dashboard

## 🎉 You're All Set!

Once configured, you'll receive **instant Discord notifications** every time someone uploads files to your tool, giving you complete visibility into all dashboard activity!

## 📞 Need Help?

If you encounter any issues:
1. Check the backend console for error messages
2. Verify your webhook URL is correct
3. Test with the `/api/test-discord` endpoint
4. Ensure your Discord server and channel permissions are correct
