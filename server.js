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
  // Limit per-message size to a reasonable value for binary chunks
  maxHttpBufferSize: 50 * 1024 * 1024, // 50 MB
  // Disable per-message deflate to avoid CPU overhead for binary payloads
  perMessageDeflate: false
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Store connected users and message history
const users = new Map();
let messageHistory = []; // Store all messages
const MAX_MESSAGES = 500; // Keep last 500 messages
const CHUNK_SIZE = 256 * 1024; // Default 256KB chunks (client controls actual size)

// Simple disk persistence for message history
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const CLIENTS_CSV = path.join(DATA_DIR, 'clients.csv');
const PAIRS_CSV = path.join(DATA_DIR, 'pairs.csv');

function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    // Ensure CSV files exist with headers
    if (!fs.existsSync(CLIENTS_CSV)) {
      fs.writeFileSync(CLIENTS_CSV, 'timestamp,id,username,ip,event\n');
    }
    if (!fs.existsSync(PAIRS_CSV)) {
      fs.writeFileSync(PAIRS_CSV, 'timestamp,id1,username1,ip1,id2,username2,ip2\n');
    }
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.messages)) {
        // keep only last MAX_MESSAGES
        messageHistory = parsed.messages.slice(-MAX_MESSAGES);
        console.log(`Loaded ${messageHistory.length} messages from disk`);
      }
    }
  } catch (err) {
    console.error('Failed to load messages:', err);
  }
}

let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveMessages, 300);
}

function saveMessages() {
  try {
    const payload = JSON.stringify({ messages: messageHistory.slice(-MAX_MESSAGES) }, null, 2);
    fs.writeFile(MESSAGES_FILE, payload, (err) => {
      if (err) {
        console.error('Failed to save messages:', err);
      }
    });
  } catch (err) {
    console.error('Error preparing messages for save:', err);
  }
}

// Initialize persistence
ensureDataDir();
loadMessages();

// Simple pairing state (supports exactly two peers)
let currentPair = null; // { aId, bId }

function logClientEvent(id, username, ip, event) {
  const line = `${new Date().toISOString()},${id},${(username||'').replace(/,/g,'_')},${ip},${event}\n`;
  fs.appendFile(CLIENTS_CSV, line, () => {});
}

function logPair(a, b) {
  const line = `${new Date().toISOString()},${a.id},${(a.username||'').replace(/,/g,'_')},${a.ip},${b.id},${(b.username||'').replace(/,/g,'_')},${b.ip}\n`;
  fs.appendFile(PAIRS_CSV, line, () => {});
}

function tryEstablishPair() {
  if (currentPair) return;
  if (users.size === 2) {
    const ids = Array.from(users.keys());
    const a = users.get(ids[0]);
    const b = users.get(ids[1]);
    if (a && b) {
      currentPair = { aId: a.id, bId: b.id };
      logPair(a, b);
      // Tell clients to begin P2P handshake; first user is initiator
      io.to(a.id).emit('p2p-begin', { role: 'initiator', peerId: b.id, peerUsername: b.username });
      io.to(b.id).emit('p2p-begin', { role: 'receiver', peerId: a.id, peerUsername: a.username });
    }
  }
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join', (username) => {
    const ip = (socket.handshake && (socket.handshake.headers['x-forwarded-for'] || socket.handshake.address)) || '';
    const ipAddr = Array.isArray(ip) ? ip[0] : (typeof ip === 'string' ? ip.split(',')[0].trim() : String(ip));
    users.set(socket.id, { id: socket.id, username, ip: ipAddr, connectedAt: new Date() });
    logClientEvent(socket.id, username, ipAddr, 'join');
    
    // Send message history to the newly joined user
    socket.emit('message-history', messageHistory);
    
    // Notify all users
    io.emit('users-updated', Array.from(users.values()));
    console.log(`User ${username} joined. Total users: ${users.size}`);
    tryEstablishPair();
  });

  // Handle text messages
  socket.on('message', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        username: user.username,
        text: data.text,
        timestamp: new Date(),
        userId: socket.id
      };
      
      // Store in message history
      messageHistory.push(message);
      
      // Keep only the last MAX_MESSAGES
      if (messageHistory.length > MAX_MESSAGES) {
        messageHistory.shift();
      }
      // Persist to disk (debounced)
      scheduleSave();
      
      io.emit('message', message);
      console.log(`Message from ${user.username}: ${data.text}`);
    }
  });
  
  // Handle private messages
  socket.on('private-message', (data) => {
    const user = users.get(socket.id);
    if (user && data.to) {
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        username: user.username,
        text: data.text,
        timestamp: new Date(),
        userId: socket.id,
        from: socket.id,
        to: data.to,
        isPrivate: true
      };
      
      // Store in message history
      messageHistory.push(message);
      
      // Keep only the last MAX_MESSAGES
      if (messageHistory.length > MAX_MESSAGES) {
        messageHistory.shift();
      }
      // Persist to disk (debounced)
      scheduleSave();
      
      // Send to recipient
      io.to(data.to).emit('private-message', message);
      
      // Echo back to sender
      socket.emit('private-message', message);
      
      console.log(`Private message from ${user.username} to ${data.to}: ${data.text}`);
    }
  });

  // Handle file transfer start
  socket.on('file-start', (fileInfo) => {
    const user = users.get(socket.id);
    if (user) {
      io.emit('file-start', {
        fileId: fileInfo.fileId,
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        username: user.username,
        userId: socket.id,
        totalChunks: fileInfo.totalChunks
      });
      console.log(`File transfer started: ${fileInfo.fileName} (${fileInfo.fileSize} bytes, ${fileInfo.totalChunks} chunks)`);
    }
  });

  // Handle file chunks (binary-friendly, no compression)
  socket.on('file-chunk', (data) => {
    // Broadcast without compression to maximize throughput
    io.compress(false).emit('file-chunk', {
      fileId: data.fileId,
      chunkIndex: data.chunkIndex,
      chunk: data.chunk,
      total: data.total
    });
  });

  // Handle file transfer complete
  socket.on('file-complete', (fileInfo) => {
    io.emit('file-complete', {
      fileId: fileInfo.fileId,
      fileName: fileInfo.fileName
    });
    console.log(`File transfer completed: ${fileInfo.fileName}`);
  });

  // Handle file transfer error
  socket.on('file-error', (fileInfo) => {
    io.emit('file-error', {
      fileId: fileInfo.fileId,
      error: fileInfo.error
    });
  });

  // Handle file transfer cancellation
  socket.on('file-cancel', (data) => {
    io.emit('file-cancel', {
      fileId: data.fileId
    });
    console.log(`File transfer cancelled: ${data.fileId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      users.delete(socket.id);
      logClientEvent(socket.id, user.username, user.ip || '', 'disconnect');
      // Reset pair if one member leaves
      if (currentPair && (currentPair.aId === socket.id || currentPair.bId === socket.id)) {
        currentPair = null;
      }
      io.emit('users-updated', Array.from(users.values()));
      console.log(`User ${user.username} disconnected. Total users: ${users.size}`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });

  // Handle P2P connection request
  socket.on('request-p2p', ({ peerId }) => {
    console.log(`P2P request from ${socket.id} to ${peerId}`);
    const requester = users.get(socket.id);
    const target = users.get(peerId);
    
    if (requester && target) {
      // Notify both users to begin P2P
      socket.emit('p2p-begin', { role: 'initiator', peerId });
      io.to(peerId).emit('p2p-begin', { role: 'receiver', peerId: socket.id });
      console.log(`Initiated P2P between ${requester.username} and ${target.username}`);
    }
  });

  // WebRTC signaling (non-trickle: full SDP exchange only)
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', users: users.size, messages: messageHistory.length });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================`);
  console.log(`Local Chat Server Running`);
  console.log(`=================================`);
  console.log(`Server started on port ${PORT}`);
  console.log(`\nAccess the app from:`);
  console.log(`  PC: http://localhost:${PORT}`);
  console.log(`  Other devices: http://<YOUR_PC_IP>:${PORT}`);
  console.log(`\nTo find your PC IP, run: ipconfig (Windows) or ifconfig (Mac/Linux)`);
  console.log(`=================================\n`);
});
