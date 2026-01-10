# Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start the Server
```bash
npm start
```

You'll see:
```
=================================
Local Chat Server Running
=================================
Server started on port 3000
```

### Step 3: Find Your IP Address

**Windows (Command Prompt/PowerShell):**
```bash
ipconfig
```
Look for "IPv4 Address" like: `192.168.1.100`

**Mac/Linux (Terminal):**
```bash
ifconfig
```
Look for "inet" like: `192.168.1.100`

### Step 4: Open the App

- **On Your PC:** http://localhost:3000
- **On Phone/Tablet:** http://192.168.1.100:3000 (replace with YOUR IP)

### Step 5: Join & Chat

1. Enter your name
2. Click "Join"
3. Start messaging!
4. Click 📎 to share files

## 💡 Tips

- Keep the server running in a terminal/command prompt
- All devices must be on the same WiFi network
- File sharing works instantly on LAN
- No configuration needed!

## ❓ Common Issues

**Can't access from phone?**
- Check you're using the correct IP address
- Ensure phone is on same WiFi as PC
- Try disabling VPN

**Port 3000 already in use?**
```bash
set PORT=3001
npm start
```

Need more help? Check README.md for detailed troubleshooting.
