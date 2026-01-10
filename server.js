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
  maxHttpBufferSize: 1e8 // 100 MB
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Store connected users and message history
const users = new Map();
let messageHistory = []; // Store all messages
const MAX_MESSAGES = 500; // Keep last 500 messages
const CHUNK_SIZE = 512 * 1024; // 512KB chunks for faster LAN transfer

// Simple disk persistence for message history
const DATA_DIR = path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

function ensureDataDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('join', (username) => {
    users.set(socket.id, { id: socket.id, username, connectedAt: new Date() });
    
    // Send message history to the newly joined user
    socket.emit('message-history', messageHistory);
    
    // Notify all users
    io.emit('users-updated', Array.from(users.values()));
    console.log(`User ${username} joined. Total users: ${users.size}`);
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

  // Handle file chunks
  socket.on('file-chunk', (data) => {
    io.emit('file-chunk', {
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
      io.emit('users-updated', Array.from(users.values()));
      console.log(`User ${user.username} disconnected. Total users: ${users.size}`);
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
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
