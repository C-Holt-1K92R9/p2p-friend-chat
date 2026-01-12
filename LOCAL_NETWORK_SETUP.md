# Local Network Messaging Setup Guide

## Problem
Messages only work when both devices are on the same WiFi network, but connecting to `localhost` restricts communication to the same machine.

## Solution
Use your computer's local IP address to enable messaging across devices on the same network.

## Steps

### 1. Find Your Computer's IP Address

**On Windows:**
```powershell
ipconfig
```
Look for "IPv4 Address" (usually starts with 192.168.x.x or 10.0.x.x)

**On Mac/Linux:**
```bash
ifconfig
```
Look for "inet" address under your WiFi connection

### 2. Make Sure Server is Running

The Node.js backend server should be running on port 3001:
```bash
npm start
```

Your server is ready when you see: `Server running on port 3001`

### 3. Connect Devices to Server

**On each device:**
1. Open the Friend Chat app
2. When the "🔗 Server Setup" screen appears, enter:
   ```
   http://YOUR_COMPUTER_IP:3001
   ```
   Replace `YOUR_COMPUTER_IP` with the IP from step 1
   
   Example: `http://192.168.1.100:3001`

4. Click "Connect"

### 4. Verify Connection

- The server config screen should disappear
- You should see "Connecting..." then "Ready to chat"
- In server console, you'll see connection logs

### 5. Add Friends and Start Chatting

- Use the 6-digit friend code system to add friends
- Messages, files, and media will now work across devices!

## Troubleshooting

**Can't connect?**
- Make sure both devices are on the **same WiFi network**
- Check Windows Firewall allows port 3001:
  - Go to Settings > Security > Firewall > Allow an app through firewall
  - Allow Node.js (or your app) on Private networks

**Connection drops?**
- If devices are far from router, move closer
- Check router doesn't have WiFi isolation enabled

**Found your IP but doesn't work?**
- Verify IP is correct: `ping 192.168.x.x` on other device
- Ensure server is still running with `npm start`
- Check if port 3001 is in use: `netstat -ano | findstr :3001`

## For Remote Access (Different Networks)

If you want to chat across different networks (e.g., friend in another city):
1. Deploy server to Railway or similar cloud service
2. Use the Railway URL instead: `https://your-app.railway.app`
3. Friends can connect from anywhere

## Notes

- IP addresses can change when you restart your router
- For static IP, configure it in your router settings
- The "Change server" link lets you switch servers anytime
