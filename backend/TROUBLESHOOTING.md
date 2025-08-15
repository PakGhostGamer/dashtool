# Backend Troubleshooting Guide

## Common Issues and Solutions

### 1. Server Stops Unexpectedly

**Symptoms:**
- Server appears to stop running
- Terminal shows no output
- Can't access API endpoints

**Solutions:**
- **Use the improved startup script**: `start-server.bat` (Windows) or `npm run dev`
- **Check for port conflicts**: Ensure port 3001 is not used by other services
- **Verify Node.js version**: Ensure you have Node.js 18+ installed
- **Check dependencies**: Run `npm install` in the backend directory

### 2. Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solutions:**
- **Kill existing process**: `netstat -ano | findstr :3001` then `taskkill /PID <PID>`
- **Change port**: Modify `config.js` to use a different port
- **Restart terminal**: Close and reopen your terminal

### 3. Dependencies Issues

**Error:** `Cannot find module 'express'`

**Solutions:**
- **Install dependencies**: `npm install` in backend directory
- **Clear cache**: `npm cache clean --force`
- **Delete node_modules**: Remove and reinstall with `npm install`

### 4. Permission Issues

**Error:** `EACCES: permission denied`

**Solutions:**
- **Run as Administrator**: Right-click terminal, "Run as Administrator"
- **Check file permissions**: Ensure you have write access to the directory
- **Use different port**: Change to port > 1024

### 5. Memory Issues

**Error:** `JavaScript heap out of memory`

**Solutions:**
- **Increase memory limit**: `node --max-old-space-size=4096 server.js`
- **Use PM2**: `npm install -g pm2` then `pm2 start ecosystem.config.js`
- **Optimize code**: Check for memory leaks in your application

## Startup Commands

### Development Mode (Recommended)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Debug Mode
```bash
npm run dev:debug
```

### With PM2 (Production)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
```

## Health Check

Test if your server is running:
```bash
curl http://localhost:3001/api/health
```

Or visit in browser: `http://localhost:3001/api/health`

## Log Files

If using PM2, check logs:
```bash
pm2 logs amazon-dashboard-backend
```

## Environment Variables

Create a `.env` file in the backend directory:
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_key_here
DISCORD_WEBHOOK_URL=your_webhook_here
```

## Still Having Issues?

1. **Check the terminal output** for specific error messages
2. **Verify all dependencies** are installed correctly
3. **Ensure Node.js version** is 18 or higher
4. **Check firewall settings** if accessing from other devices
5. **Review the server logs** for detailed error information
