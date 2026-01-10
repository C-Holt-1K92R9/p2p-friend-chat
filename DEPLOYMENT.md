# Deployment Guide

## Architecture Overview

This app has two parts:
1. **Frontend** (HTML/CSS/JS) - Can be deployed on Vercel
2. **Backend** (Node.js server) - Runs locally or on a server that supports WebSockets

## Option 1: Deploy Frontend to Vercel + Local Backend (Recommended)

This setup allows you to access the chat from anywhere, but it connects to your local server.

### Step 1: Deploy Frontend to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Your app is now live!** You'll get a URL like: `https://your-app.vercel.app`

### Step 2: Run Local Backend

1. **Start your local server:**
   ```bash
   npm start
   ```

2. **Find your public IP** (if you want access from outside your network):
   - Visit: https://whatismyipaddress.com/
   - Note: You'll need to configure port forwarding on your router (port 3000)

3. **Configure the frontend to connect to your local backend:**
   - Open the deployed Vercel app in browser
   - Open browser console (F12)
   - Run:
     ```javascript
     setBackendUrl('http://YOUR_LOCAL_IP:3000')
     // Example: setBackendUrl('http://192.168.1.100:3000')
     ```
   - Reload the page

### Step 3: Allow Firewall Access (Windows)

See FIREWALL_GUIDE.md for detailed instructions.

## Option 2: Deploy Both Frontend and Backend

For a fully hosted solution, deploy the backend to a platform that supports WebSockets:

### Recommended Platforms:
- **Railway** (https://railway.app) - Easy WebSocket support
- **Render** (https://render.com) - Free tier available
- **Fly.io** (https://fly.io) - Good for real-time apps
- **Heroku** (https://heroku.com) - Classic choice

### Example: Deploy to Railway

1. **Create account on Railway.app**

2. **Create new project from GitHub repo**

3. **Add environment variable:**
   - `PORT` = 3000

4. **Deploy!** Railway automatically detects Node.js and runs `npm start`

5. **Get your Railway URL** (e.g., `https://your-app.up.railway.app`)

6. **Update frontend configuration:**
   ```javascript
   setBackendUrl('https://your-app.up.railway.app')
   ```

## Option 3: Local-Only Setup (No Deployment)

Just run the server locally:

```bash
npm start
```

Access from devices on same network:
- PC: `http://localhost:3000`
- Phone: `http://YOUR_PC_IP:3000`

## PWA Installation

Once deployed or running locally:

1. **On Mobile (Android):**
   - Open the app in Chrome
   - Tap the menu (⋮)
   - Select "Install app" or "Add to Home Screen"

2. **On Mobile (iOS):**
   - Open the app in Safari
   - Tap the Share button
   - Select "Add to Home Screen"

3. **On Desktop:**
   - Open the app in Chrome/Edge
   - Look for the install icon (⊕) in the address bar
   - Click "Install"

## Backend URL Configuration

The app can connect to any backend URL. This is useful for:
- Deploying frontend on Vercel
- Running backend locally
- Running backend on a different server

### Set Custom Backend URL

Open browser console (F12) and run:
```javascript
// Set custom backend
setBackendUrl('http://192.168.1.100:3000')

// Check current backend
getBackendUrl()

// Reset to default (same origin)
clearBackendUrl()
```

## Environment Variables

### Backend (server.js)
- `PORT` - Server port (default: 3000)

### Frontend
- Configured via browser console using `setBackendUrl()`
- Stored in browser's localStorage

## Testing Deployment

1. **Check server is running:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok","users":0}`

2. **Test from another device:**
   - Ensure both devices are on same network
   - Visit: `http://YOUR_PC_IP:3000`

3. **Check WebSocket connection:**
   - Open browser console (F12)
   - Look for: "Connected to server"
   - Should see connection status: "Connected"

## Troubleshooting Deployment

### Vercel: "Cannot GET /"
- Check vercel.json is present
- Ensure public folder exists with index.html

### Cannot connect to backend
- Verify backend URL is correct
- Check server is running: `npm start`
- Test health endpoint: `http://YOUR_IP:3000/health`
- Check firewall settings (see FIREWALL_GUIDE.md)

### PWA not installing
- Ensure HTTPS (required for PWA on public domains)
- Check manifest.json is accessible
- Verify service worker is registered (check console)

### WebSocket connection fails
- Backend must support WebSocket protocol
- Vercel serverless functions don't support WebSockets
- Use Railway, Render, or Fly.io for backend with WebSockets

## Production Considerations

For production deployment, consider:

1. **Security:**
   - Add authentication
   - Use HTTPS/WSS (secure WebSocket)
   - Rate limiting
   - Input validation

2. **Persistence:**
   - Use a database (MongoDB, PostgreSQL, Redis)
   - Current implementation stores messages in memory

3. **Scalability:**
   - Use Redis adapter for Socket.IO
   - Load balancing
   - CDN for static assets

4. **Monitoring:**
   - Error logging (Sentry)
   - Analytics
   - Uptime monitoring

## Next Steps

1. Deploy frontend to Vercel
2. Run backend locally or on Railway
3. Configure backend URL
4. Install as PWA on your devices
5. Start chatting!

Need help? Check FIREWALL_GUIDE.md for Windows firewall setup.
