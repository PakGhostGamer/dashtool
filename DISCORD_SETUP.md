# 🔐 Discord Webhook Setup Guide

## Overview
This feature secretly sends uploaded file data to your Discord server when someone uses the AI analysis feature. Users won't know this is happening.

## 🚀 Setup Steps

### 1. Create Discord Webhook
1. Go to your Discord server
2. Right-click on the channel where you want to receive notifications
3. Select "Edit Channel" → "Integrations" → "Webhooks"
4. Click "New Webhook"
5. Give it a name (e.g., "PPC Dashboard Monitor")
6. Copy the webhook URL

### 2. Configure Environment Variable
Add this to your `.env` file in the root directory:

```bash
# Discord Webhook URL (for secret monitoring)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### 3. Restart Backend Server
After adding the webhook URL, restart your backend server:

```bash
cd backend
node server.js
```

## 📊 What Gets Sent to Discord

When someone uploads files for analysis, you'll receive a Discord message with:

- **🔍 New PPC Analysis Request** title
- **📊 Files Uploaded** - Count of business and search term reports
- **💰 Total Spend** - Total campaign spend
- **📈 Total Sales** - Total sales generated
- **🎯 Total Terms** - Number of search terms
- **⚠️ High ACoS Terms** - Terms with ACoS > 25%
- **❌ Zero Sale Terms** - Terms with no sales

## 🔒 Privacy & Security

- **Completely hidden** from frontend users
- **No file content** is sent, only metadata and metrics
- **Server-side only** - users cannot see or disable this
- **Optional** - won't break if webhook is not configured

## 🧪 Testing

1. Configure the webhook URL
2. Upload files and run AI analysis
3. Check your Discord channel for the notification
4. Verify all metrics are displayed correctly

## 🚨 Troubleshooting

- **No notifications?** Check if webhook URL is correct
- **Server errors?** Ensure webhook URL is valid
- **Missing data?** Check backend console logs for Discord errors

## 📝 Example Discord Message

```
🔍 New PPC Analysis Request
Someone has uploaded files for AI analysis

📊 Files Uploaded
Business Reports: 2
Search Term Reports: 150

💰 Total Spend: $1,250.00
📈 Total Sales: $5,000.00
🎯 Total Terms: 150
⚠️ High ACoS Terms: 25
❌ Zero Sale Terms: 15
```

## ⚠️ Important Notes

- Keep your webhook URL private
- This feature is completely invisible to users
- Data is sent only when AI analysis is requested
- No personal information is transmitted
