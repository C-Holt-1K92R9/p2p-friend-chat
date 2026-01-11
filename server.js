const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 50 * 1024 * 1024, // 50 MB
  perMessageDeflate: false
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// NEW SYSTEM: Store registered users, active connections, friend codes, and friend pairs
const registeredUsers = new Map(); // userId -> { userId, username, socketId (when online), address, registeredAt }
const friendCodes = new Map(); // code -> { userId, username, createdAt, expiresAt }
const friendPairs = new Map(); // userId -> Set of friend userIds
const activeSockets = new Map(); // socketId -> userId

// Simple disk persistence
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
const PENDING_CODES_CSV = path.join(DATA_DIR, 'pending_codes.csv');
const PAIRS_CSV = path.join(DATA_DIR, 'pairs.csv');


function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // Ensure CSV files exist with headers
    if (!fs.existsSync(PENDING_CODES_CSV)) {
      fs.writeFileSync(PENDING_CODES_CSV, 'timestamp,code,userId,username,expiresAt\n');
    }
    if (!fs.existsSync(PAIRS_CSV)) {
      fs.writeFileSync(PAIRS_CSV, 'timestamp,userId1,username1,userId2,username2\n');
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach(user => {
          registeredUsers.set(user.userId, user);
        });
        console.log(`Loaded ${registeredUsers.size} registered users`);
      }
    }
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

function saveUsers() {
  try {
    const users = Array.from(registeredUsers.values());
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Failed to save users:', err);
  }
}

function loadFriends() {
  try {
    if (fs.existsSync(FRIENDS_FILE)) {
      const raw = fs.readFileSync(FRIENDS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object') {
        Object.keys(parsed).forEach(userId => {
          friendPairs.set(userId, new Set(parsed[userId]));
        });
        console.log(`Loaded friend connections for ${friendPairs.size} users`);
      }
    }
  } catch (err) {
    console.error('Failed to load friends:', err);
  }
}

function saveFriends() {
  try {
    const obj = {};
    friendPairs.forEach((friends, userId) => {
      obj[userId] = Array.from(friends);
    });
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(obj, null, 2));
  } catch (err) {
    console.error('Failed to save friends:', err);
  }
}

function generateFriendCode() {
  // Generate a 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function logPendingCode(code, userId, username, expiresAt) {
  const line = `${new Date().toISOString()},${code},${userId},${(username||'').replace(/,/g,'_')},${expiresAt}\n`;
  fs.appendFile(PENDING_CODES_CSV, line, () => {});
}

function logFriendPair(user1, user2) {
  const line = `${new Date().toISOString()},${user1.userId},${(user1.username||'').replace(/,/g,'_')},${user2.userId},${(user2.username||'').replace(/,/g,'_')}\n`;
  fs.appendFile(PAIRS_CSV, line, () => {});
}

// Initialize persistence
ensureDataDir();
loadUsers();
loadFriends();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Handle user registration
  socket.on('register', (username) => {
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const user = {
      userId,
      username: username || 'Anonymous',
      socketId: socket.id,
      address: socket.handshake.address,
      registeredAt: new Date()
    };
    
    registeredUsers.set(userId, user);
    activeSockets.set(socket.id, userId);
    saveUsers();
    
    console.log(`User registered: ${username} (${userId})`);
    
    // Send back user info and their friends list
    const friends = friendPairs.get(userId) || new Set();
    const friendsList = Array.from(friends).map(fId => {
      const friend = registeredUsers.get(fId);
      return friend ? {
        userId: friend.userId,
        username: friend.username,
        online: !!friend.socketId
      } : null;
    }).filter(f => f);
    
    socket.emit('registered', { userId, username, friends: friendsList });
  });

  // Handle login (existing user reconnecting)
  socket.on('login', (userId) => {
    const user = registeredUsers.get(userId);
    if (user) {
      user.socketId = socket.id;
      user.address = socket.handshake.address;
      activeSockets.set(socket.id, userId);
      console.log(`User logged in: ${user.username} (${userId})`);
      
      // Send back user info and friends list with online status
      const friends = friendPairs.get(userId) || new Set();
      const friendsList = Array.from(friends).map(fId => {
        const friend = registeredUsers.get(fId);
        return friend ? {
          userId: friend.userId,
          username: friend.username,
          online: !!friend.socketId
        } : null;
      }).filter(f => f);
      
      socket.emit('logged-in', { userId, username: user.username, friends: friendsList });
      
      // Notify friends that this user is now online
      friends.forEach(friendId => {
        const friend = registeredUsers.get(friendId);
        if (friend && friend.socketId) {
          io.to(friend.socketId).emit('friend-online', { userId, username: user.username });
        }
      });
    } else {
      socket.emit('login-failed', { error: 'User not found' });
    }
  });

  // Handle friend code generation
  socket.on('generate-friend-code', () => {
    const userId = activeSockets.get(socket.id);
    const user = registeredUsers.get(userId);
    
    if (!user) {
      socket.emit('friend-code-error', { error: 'User not found' });
      return;
    }
    
    const code = generateFriendCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    
    friendCodes.set(code, {
      userId: user.userId,
      username: user.username,
      createdAt: new Date(),
      expiresAt
    });
    
    logPendingCode(code, user.userId, user.username, expiresAt.toISOString());
    
    // Auto-cleanup expired code
    setTimeout(() => {
      friendCodes.delete(code);
    }, 5 * 60 * 1000);
    
    socket.emit('friend-code-generated', { code, expiresAt });
    console.log(`Friend code generated: ${code} for ${user.username}`);
  });

  // Handle friend code entry (pairing)
  socket.on('enter-friend-code', (code) => {
    const userId = activeSockets.get(socket.id);
    const user = registeredUsers.get(userId);
    
    if (!user) {
      socket.emit('friend-code-error', { error: 'User not found' });
      return;
    }
    
    const codeData = friendCodes.get(code);
    
    if (!codeData) {
      socket.emit('friend-code-error', { error: 'Invalid or expired code' });
      return;
    }
    
    if (codeData.expiresAt < new Date()) {
      friendCodes.delete(code);
      socket.emit('friend-code-error', { error: 'Code expired' });
      return;
    }
    
    if (codeData.userId === userId) {
      socket.emit('friend-code-error', { error: 'Cannot add yourself' });
      return;
    }
    
    // Check if already friends
    const userFriends = friendPairs.get(userId) || new Set();
    if (userFriends.has(codeData.userId)) {
      socket.emit('friend-code-error', { error: 'Already friends' });
      return;
    }
    
    // Add friend connection (bidirectional)
    if (!friendPairs.has(userId)) {
      friendPairs.set(userId, new Set());
    }
    if (!friendPairs.has(codeData.userId)) {
      friendPairs.set(codeData.userId, new Set());
    }
    
    friendPairs.get(userId).add(codeData.userId);
    friendPairs.get(codeData.userId).add(userId);
    
    saveFriends();
    logFriendPair(user, { userId: codeData.userId, username: codeData.username });
    
    // Remove the used code
    friendCodes.delete(code);
    
    // Notify both users
    const friend = registeredUsers.get(codeData.userId);
    socket.emit('friend-added', { 
      userId: friend.userId, 
      username: friend.username,
      online: !!friend.socketId
    });
    
    if (friend.socketId) {
      io.to(friend.socketId).emit('friend-added', { 
        userId: user.userId, 
        username: user.username,
        online: true
      });
    }
    
    console.log(`Friend pair created: ${user.username} <-> ${codeData.username}`);
  });

  // Handle request for friend's P2P address
  socket.on('request-friend-address', (friendUserId) => {
    const userId = activeSockets.get(socket.id);
    const user = registeredUsers.get(userId);
    
    if (!user) {
      socket.emit('friend-address-error', { error: 'User not found' });
      return;
    }
    
    // Verify they are friends
    const userFriends = friendPairs.get(userId) || new Set();
    if (!userFriends.has(friendUserId)) {
      socket.emit('friend-address-error', { error: 'Not friends' });
      return;
    }
    
    const friend = registeredUsers.get(friendUserId);
    if (!friend || !friend.socketId) {
      socket.emit('friend-address-error', { error: 'Friend is offline' });
      return;
    }
    
    // Initiate P2P connection between friends
    socket.emit('p2p-begin', { 
      role: 'initiator', 
      peerId: friend.socketId,
      friendUserId: friend.userId,
      friendUsername: friend.username
    });
    
    io.to(friend.socketId).emit('p2p-begin', { 
      role: 'receiver', 
      peerId: socket.id,
      friendUserId: user.userId,
      friendUsername: user.username
    });
    
    console.log(`P2P initiated between ${user.username} and ${friend.username}`);
  });

  // WebRTC signaling
  socket.on('webrtc-offer', (payload) => {
    const { to, sdp } = payload || {};
    if (to && sdp) {
      io.to(to).emit('webrtc-offer', { from: socket.id, sdp });
    }
  });

  socket.on('webrtc-answer', (payload) => {
    const { to, sdp } = payload || {};
    if (to && sdp) {
      io.to(to).emit('webrtc-answer', { from: socket.id, sdp });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const userId = activeSockets.get(socket.id);
    if (userId) {
      const user = registeredUsers.get(userId);
      if (user) {
        user.socketId = null; // Mark as offline but keep user data
        console.log(`User disconnected: ${user.username} (${userId})`);
        
        // Notify friends that this user went offline
        const friends = friendPairs.get(userId) || new Set();
        friends.forEach(friendId => {
          const friend = registeredUsers.get(friendId);
          if (friend && friend.socketId) {
            io.to(friend.socketId).emit('friend-offline', { userId, username: user.username });
          }
        });
      }
      activeSockets.delete(socket.id);
    }
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    registeredUsers: registeredUsers.size, 
    onlineUsers: activeSockets.size,
    friendPairs: friendPairs.size
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================`);
  console.log(`Friend-Based P2P Chat Server`);
  console.log(`=================================`);
  console.log(`Server started on port ${PORT}`);
  console.log(`\nAccess the app from:`);
  console.log(`  PC: http://localhost:${PORT}`);
  console.log(`  Other devices: http://<YOUR_PC_IP>:${PORT}`);
  console.log(`\nTo find your PC IP, run: ipconfig (Windows) or ifconfig (Mac/Linux)`);
  console.log(`=================================\n`);
});
