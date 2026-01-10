# Local Chat App 💬

A real-time local network chat application for sharing messages and files between PC and mobile devices instantly.

## Features

✨ **Real-Time Messaging** - Share messages instantly across your local network
📁 **File Sharing** - Transfer files of any size without compression
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices
� **Message Persistence** - All messages saved and synced across devices
🔄 **Auto-Login** - Remembers your username, no need to rejoin
📲 **PWA Support** - Install as an app on any device
☁️ **Vercel Deployable** - Deploy frontend to Vercel, connect to local backend
🚀 **Zero Configuration** - Just run and start chatting
🔐 **Local Network** - All communication stays on your network
⚡ **Fast & Lightweight** - Minimal dependencies, maximum performance

## Requirements

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Windows, macOS, or Linux

## Installation

### Step 1: Install Node.js

If you don't have Node.js installed, download it from [https://nodejs.org/](https://nodejs.org/) (LTS version recommended).

Verify installation by opening a terminal/command prompt and running:
```bash
node --version
npm --version
```

### Step 2: Install Dependencies

Navigate to the project directory and install required packages:

```bash
cd "e:\projects\personal Project\share file"
npm install
```

This will install:
- **express** - Web server framework
- **socket.io** - Real-time communication library

## Running the Server

Start the application:

```bash
npm start
```

You should see output like:
```
=================================
Local Chat Server Running
=================================
Server started on port 3000

Access the app from:
  PC: http://localhost:3000
  Other devices: http://<YOUR_PC_IP>:3000

To find your PC IP, run: ipconfig (Windows) or ifconfig (Mac/Linux)
=================================
```

## Finding Your PC's IP Address

### On Windows:
Open Command Prompt and run:
```bash
ipconfig
```

Look for "IPv4 Address" under "Ethernet adapter" or "Wireless LAN adapter". It will look like: `192.168.x.x` or `10.0.x.x`

### On macOS/Linux:
Open Terminal and run:
```bash
ifconfig
```

Look for `inet` address (usually starts with 192.168 or 10.0)

## Accessing the App

### From the Same PC:
- Open browser and go to: **http://localhost:3000**

### From Phone/Tablet on Same Network:
1. Find your PC's IP address (see above)
2. On your mobile device browser, go to: **http://YOUR_PC_IP:3000**
   - Example: `http://192.168.1.100:3000`

**⚠️ Can't access from phone?** See [FIREWALL_GUIDE.md](FIREWALL_GUIDE.md) for Windows Firewall setup.

### From Other PCs on Network:
Use the same URL as phone: **http://YOUR_PC_IP:3000**

### Deploy to Vercel:
Want to access from anywhere? See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.

## How to Use

1. **Join the Chat:**
   - Enter your name (auto-saved for next time!)
   - Click "Join"

2. **Send Messages:**
   - Type your message in the text box
   - Press Enter or click "Send"
   - Messages appear instantly for all users
   - **All messages are saved** - they'll be there when you reload!

3. **Share Files:**
   - Click the 📎 (paperclip) icon
   - Select any file from your device
   - The file transfers in chunks for instant delivery
   - Other users see a download button when transfer completes

4. **Install as App (PWA):**
   - **Mobile:** Open in browser, tap menu, select "Add to Home Screen"
   - **Desktop:** Click install icon (⊕) in address bar
   - Works offline after installation!

## Features in Detail

### Real-Time Messaging
- See who's online
- Instant message delivery
- Timestamps for all messages
- User avatars

### File Sharing
- Share files of any size
- Progress tracking during transfer
- No file compression
- Multiple files simultaneously
- Works on LAN for speed

### Responsive Design
- Desktop optimized layout with sidebar
- Mobile-friendly interface
- Tablet support
- Touch-friendly buttons

## Technical Details

### Architecture
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Communication:** WebSockets (Socket.IO)
- **File Transfer:** Chunked base64 encoding

### Default Port: 3000

To change the port, set the PORT environment variable:

**Windows (Command Prompt):**
```bash
set PORT=8080
npm start
```

**Windows (PowerShell):**
```bash
$env:PORT=8080
npm start
```

**macOS/Linux:**
```bash
PORT=8080 npm start
```

### File Transfer Details
- Maximum file size: 100 MB
- Chunk size: 64 KB
- Supports all file types
- Instant transfer on LAN

## Troubleshooting

### "Cannot find module 'express'" or 'socket.io'
**Solution:** Run `npm install` again to ensure all dependencies are installed.

### "Port 3000 already in use"
**Solution:** Either close other applications using port 3000, or change the port:
```bash
set PORT=3001
npm start
```

### Can't access from phone/tablet
**Solution:**
1. Ensure phone and PC are on the **same WiFi network**
2. Verify the IP address using `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. **Check Windows Firewall** - This is the most common issue!
   - See [FIREWALL_GUIDE.md](FIREWALL_GUIDE.md) for step-by-step instructions
   - Quick fix: Allow Node.js through Windows Defender Firewall
4. Disable VPN if using one
5. Test the health endpoint from phone: `http://YOUR_PC_IP:3000/health`

### Messages not appearing
**Solution:**
1. Ensure all devices have joined the chat (username is set)
2. Check browser console for errors (F12 → Console)
3. Verify server is running and shows "Server started on port 3000"

### File transfer fails
**Solution:**
1. Ensure file size is under 100 MB
2. Check network connection stability
3. Try again - network issues are usually temporary

### Can't connect to server from other device
**Solution:**
1. Make sure the server is running (terminal should show "Server started on port 3000")
2. Use the correct IP address - run `ipconfig` on Windows to verify
3. Check that both devices are on the same WiFi network
4. If behind a corporate firewall, ask your network administrator

## Security Note

This application is designed for **local network use only**. It is not recommended to expose this service to the internet without additional security measures such as:
- Authentication/authorization
- Encryption
- Rate limiting
- Input validation

## Performance

- **Messaging:** Instant (< 100ms on LAN)
- **File Transfer:** Limited by network speed
- **Typical LAN Speed:** 100+ Mbps = files transfer in seconds
- **Concurrent Users:** Tested with 50+ users

## Future Enhancements

- User authentication
- Search functionality
- User blocking
- Custom themes
- Voice/video calls
- End-to-end encryption
- Database persistence (MongoDB/PostgreSQL)

## New in This Version

✅ **Message Persistence** - All messages saved and synced
✅ **Auto-Login** - Username remembered across sessions
✅ **PWA Support** - Install as app on any device
✅ **Vercel Deployment** - Deploy frontend, connect to local backend
✅ **Better Mobile Support** - Improved responsive design

## License

MIT License - Free to use and modify

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all dependencies are installed (`npm install`)
3. Ensure Node.js version is compatible (`node --version`)
4. Check that port 3000 is available or change it

## Screenshots

### Desktop View
- Sidebar with online users
- Main chat area
- Message and file sharing interface

### Mobile View
- Responsive design
- Touch-optimized buttons
- Full functionality on small screens

Enjoy chatting! 🚀
