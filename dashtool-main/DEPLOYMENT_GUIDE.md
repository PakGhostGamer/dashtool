# Backend Deployment Guide

## Email Functionality Setup

Your backend has been configured and is ready for deployment. Here are the steps to deploy it:

### Option 1: Deploy to Render.com (Recommended - Free)

1. **Go to [Render.com](https://render.com)** and sign up/login
2. **Click "New +"** and select "Web Service"
3. **Connect your GitHub repository**: `PakGhostGamer/dashtool`
4. **Configure the service**:
   - **Name**: `amazon-dashboard-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free

5. **Add Environment Variables**:
   - `NODE_ENV` = `production`
   - `SMTP_HOST` = `smtp.hostinger.com`
   - `SMTP_PORT` = `465`
   - `SMTP_SECURE` = `true`
   - `SMTP_USER` = `portal@ecomgliders.com`
   - `SMTP_PASS` = `Ecomgliders.llc.11`
   - `CORS_ORIGIN` = `https://pakghostgamer.github.io`

6. **Deploy** and wait for the service to be live

### Option 2: Deploy to Railway.app (Alternative - Free)

1. **Go to [Railway.app](https://railway.app)** and sign up/login
2. **Click "New Project"** and select "Deploy from GitHub repo"
3. **Select your repository**: `PakGhostGamer/dashtool`
4. **Configure the service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables** (same as above)
6. **Deploy**

### Option 3: Deploy to Heroku (Alternative)

1. **Install Heroku CLI**: `npm install -g heroku`
2. **Login**: `heroku login`
3. **Create app**: `heroku create amazon-dashboard-backend`
4. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set SMTP_HOST=smtp.hostinger.com
   heroku config:set SMTP_PORT=465
   heroku config:set SMTP_SECURE=true
   heroku config:set SMTP_USER=portal@ecomgliders.com
   heroku config:set SMTP_PASS=Ecomgliders.llc.11
   heroku config:set CORS_ORIGIN=https://pakghostgamer.github.io
   ```
5. **Deploy**: `git push heroku main`

## After Deployment

Once deployed, your backend will be available at:
- **Render**: `https://amazon-dashboard-backend.onrender.com`
- **Railway**: `https://your-app-name.railway.app`
- **Heroku**: `https://amazon-dashboard-backend.herokuapp.com`

## Test the Email Functionality

1. **Visit your dashboard**: https://pakghostgamer.github.io/dashtool/
2. **Upload a file** (Business Report or Search Term Report)
3. **Check your email**: `rizwan@ecomgliders.com` should receive a notification
4. **Check the backend health**: Visit `https://your-backend-url/api/health`

## Troubleshooting

### If emails aren't sending:
1. Check the backend logs in your deployment platform
2. Verify SMTP credentials are correct
3. Check if the backend URL is accessible
4. Ensure CORS is properly configured

### If backend won't deploy:
1. Check the build logs for errors
2. Verify all environment variables are set
3. Ensure the backend directory structure is correct

## Security Notes

- The SMTP password is currently hardcoded for convenience
- For production, consider using environment variables for sensitive data
- The backend is configured to only accept requests from your GitHub Pages domain

## Support

If you need help with deployment, you can:
1. Check the deployment platform's documentation
2. Review the backend logs for error messages
3. Test the backend health endpoint: `/api/health` 