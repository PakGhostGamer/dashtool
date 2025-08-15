# 🚀 Quick Discord Setup

## ⚡ Get Downloadable CSV Files on Discord in 3 Steps

### 1. Create Discord Webhook
1. Go to your Discord server
2. Right-click on a channel → "Edit Channel"
3. Go to "Integrations" → "Create Webhook"
4. Copy the webhook URL

### 2. Add Webhook to Your Backend
Edit `backend/config.js` and add your webhook URL:

```javascript
discord: {
  webhookUrl: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE'
}
```

### 3. Restart Server
```bash
cd backend
npm run dev
```

## 🧪 Test It Works
Visit: `http://localhost:3001/api/test-discord`

## 🎯 What You'll Get
- ✅ **Direct download links** for CSV files on Discord
- ✅ **Business Reports** - Downloadable CSV files
- ✅ **Search Term Reports** - Downloadable CSV files (converted from Excel)
- ✅ **One-click download** - No copying and pasting needed
- ✅ **Excel compatible** - Open directly in Excel or Google Sheets
- ✅ **Real-time file monitoring** of all dashboard activity

## 📱 Discord Notifications Include:
1. **📥 Download Link** - Direct link to download your CSV file
2. **📊 File Information** - Record counts, upload times, file types
3. **💾 Download Instructions** - Simple steps to save and open files
4. **🔗 Direct Access** - Click the link to download immediately

## 📊 File Handling
- **CSV format** preserved exactly as uploaded
- **No data loss** - you get everything the client uploaded
- **Direct download** - Click link, save file, open in Excel
- **Automatic cleanup** - Files are removed after download
- **Temporary storage** - Files available for 1 hour after upload

## 💾 How to Download Files:
1. **Click the download link** in Discord
2. **File downloads automatically** to your computer
3. **Save with .csv extension** (if prompted)
4. **Open in Excel** or Google Sheets
5. **Ready to use!** - All data preserved exactly as uploaded

## 🚀 New Features:
- **Direct Download Endpoint**: `/api/download/:fileId`
- **Temporary File Storage**: Files stored securely for 1 hour
- **Automatic Cleanup**: Old files removed automatically
- **Excel Compatibility**: CSV files open perfectly in Excel

Your dashboard will now send **direct download links** for CSV files on Discord every time someone uploads data! 🎉
