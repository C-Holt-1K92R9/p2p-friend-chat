# Friend-Based P2P Chat System

A modern, friend-based peer-to-peer chat application where users can connect with friends using unique codes and chat directly without a central server storing messages.

## System Overview

### Key Features

1. **Simple Registration** - No email or password required, just enter your name
2. **Friend Codes** - Generate 6-digit codes to add friends
3. **P2P Communication** - Direct peer-to-peer messaging between friends
4. **Local Storage** - All chat history stored locally on your device
5. **Real-time Updates** - See when friends come online/offline
6. **No Refresh Needed** - WebSocket & WebRTC for seamless communication

## How It Works

### 1. Registration
- Users enter just their name (no email/password)
- System generates a unique user ID
- User data is stored both on server and locally

### 2. Adding Friends
- Click "Add Friend" button
- Two options:
  - **Generate Code**: Creates a 6-digit code (valid for 5 minutes)
  - **Enter Code**: Enter a friend's code to connect

### 3. Connection Process
- When a code is entered, both users are paired
- Connection is bidirectional and stored permanently
- Friend list is saved locally on each device
- Server maintains the connection pairs

### 4. Chatting
- Select a friend from your friends list
- If online: Direct P2P connection is established via WebRTC
- If offline: Messages will be delivered when they come online
- All messages are stored locally on both devices

### 5. P2P Communication
- When both users are online, they communicate directly (P2P)
- Server only helps with initial WebRTC handshake
- No messages pass through the server
- Lower latency and more privacy

## Technical Architecture

### Server (`server.js`)
- **Socket.IO** for real-time communication
- **WebRTC signaling** for P2P setup
- **Data Storage**:
  - `data/users.json` - Registered users
  - `data/friends.json` - Friend connections
  - `data/pending_codes.csv` - Temporary friend codes (log only)
  - `data/pairs.csv` - Connection pairs (log only)

### Client (`index.html`)
- **Registration screen** - Simple name entry
- **Friends sidebar** - List of connected friends with online status
- **Chat interface** - WhatsApp-style messaging
- **Friend modal** - Code generation and entry
- **Local Storage**:
  - User credentials (userId, username)
  - Chat history per friend (last 100 messages)

### P2P Technology
- **WebRTC DataChannel** for direct communication
- **ICE/STUN** for NAT traversal
- **Automatic reconnection** if connection drops

## Data Flow

```
User A                    Server                    User B
  |                         |                         |
  |-- Register ------------->|                         |
  |<-- userId, username -----|                         |
  |                         |<-- Register -------------|
  |                         |---- userId, username -->|
  |                         |                         |
  |-- Generate Code -------->|                         |
  |<-- 6-digit code ---------|                         |
  |                         |                         |
  |                         |<-- Enter Code -----------|
  |                         |                         |
  |<-- Friend Added ---------|---- Friend Added ------>|
  |                         |                         |
  |-- Request Address ------>|                         |
  |                         |<-- Request Address ------|
  |<-- P2P Begin ------------|---- P2P Begin --------->|
  |                         |                         |
  |<======= WebRTC Handshake via Server =============>|
  |                         |                         |
  |<=============== Direct P2P Connection ===========>|
  |                         |                         |
  |  (All messages now go directly between devices)  |
```

## Privacy & Security

- **No message storage on server** - All messages stored locally
- **P2P encryption** - WebRTC provides built-in encryption
- **Temporary codes** - Friend codes expire in 5 minutes
- **Local data** - You control your chat history

## Usage

### Starting the Server
```bash
node server.js
```

Server starts on port 3001 by default.

### Accessing the App
- **On same device**: http://localhost:3001
- **On network**: http://YOUR_PC_IP:3001

### Adding Your First Friend
1. Open the app on two devices
2. Both users register with their names
3. User A clicks "Add Friend" → "Generate My Code"
4. User A shares the 6-digit code with User B
5. User B clicks "Add Friend" → enters the code → "Add"
6. Both users are now connected!

### Starting a Chat
1. Select a friend from the sidebar
2. If they're online, a P2P connection is established automatically
3. Start chatting! Messages are sent directly between devices
4. All messages are saved locally on both devices

## File Structure

```
share file/
├── server.js                 # Backend server
├── package.json             # Dependencies
├── data/                    # Server data
│   ├── users.json          # Registered users
│   ├── friends.json        # Friend connections
│   ├── pending_codes.csv   # Temporary codes log
│   └── pairs.csv           # Connection pairs log
└── public/
    ├── index.html          # Main client app
    └── index-old.html      # Previous version (backup)
```

## API Reference

### Socket Events (Client → Server)

- `register(username)` - Register a new user
- `login(userId)` - Login with existing user ID
- `generate-friend-code()` - Generate a 6-digit friend code
- `enter-friend-code(code)` - Enter a friend's code to connect
- `request-friend-address(friendUserId)` - Request P2P connection with online friend
- `webrtc-offer({to, sdp})` - WebRTC offer for P2P setup
- `webrtc-answer({to, sdp})` - WebRTC answer for P2P setup

### Socket Events (Server → Client)

- `registered({userId, username, friends})` - Successful registration
- `logged-in({userId, username, friends})` - Successful login
- `login-failed({error})` - Login failed
- `friend-code-generated({code, expiresAt})` - Friend code created
- `friend-code-error({error})` - Error with friend code
- `friend-added({userId, username, online})` - New friend added
- `friend-online({userId, username})` - Friend came online
- `friend-offline({userId, username})` - Friend went offline
- `p2p-begin({role, peerId, friendUserId, friendUsername})` - Start P2P connection
- `webrtc-offer({from, sdp})` - WebRTC offer received
- `webrtc-answer({from, sdp})` - WebRTC answer received

## Local Storage Keys

- `chatUser` - Current user credentials `{userId, username}`
- `msgs_{userId}_{friendUserId}` - Messages for each friend (last 100)

## Future Enhancements

- File sharing via P2P
- Group chats
- Voice/video calls
- Push notifications
- Message read receipts
- Profile pictures
- End-to-end encryption option
- Export/import chat history

## Troubleshooting

### Can't connect to friend
- Ensure both users are online
- Check if firewall is blocking WebRTC
- Try refreshing the page

### Friend code not working
- Codes expire in 5 minutes - generate a new one
- Ensure code is entered correctly (6 digits)
- Can't add yourself as a friend

### Messages not delivering
- Check internet connection
- Ensure friend is online for P2P
- Messages are stored locally and will sync when both online

## Credits

Built with:
- Node.js & Express
- Socket.IO for WebSocket
- WebRTC for P2P communication
- Vanilla JavaScript (no frameworks!)

---

**Version**: 1.0.0 (Friend-Based System)
**Last Updated**: January 2026
