import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import oauthRoutes from './routes/oauthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import adminCohortRoutes from './routes/adminCohortRoutes.js';
import cohortRoutes from './routes/cohortRoutes.js';
import channelRoutes from './routes/channelRoutes.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Warning: Missing environment variables:', missingEnvVars.join(', '));
  console.warn('⚠️  GitHub OAuth may not work. Please check your .env file.');
}

// Log that env vars are loaded (without showing secrets)
console.log('✓ Environment loaded');
console.log('✓ GitHub OAuth configured:', !!process.env.GITHUB_CLIENT_ID ? 'Yes' : 'No');

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: [
    "https://becults.in",
    "https://www.becults.in",
    "https://becults-frontend.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected');
  })
  .catch((err) => {
    console.error('✗ MongoDB connection failed:', err.message);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/cohorts', adminCohortRoutes);
app.use('/api/cohorts', cohortRoutes);
app.use('/api/channels', channelRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Server is running',
    githubConfigured: !!process.env.GITHUB_CLIENT_ID,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

const PORT = process.env.PORT || 5000;

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log(`✓ User connected: ${socket.id}`);

  // Join a channel room
  socket.on('join-channel', (channelKey, userId) => {
    socket.join(`channel-${channelKey}`);
    console.log(`✓ User ${userId} joined channel: ${channelKey}`);
    
    // Notify others that user joined
    io.to(`channel-${channelKey}`).emit('user-joined', {
      userId,
      timestamp: new Date(),
    });
  });

  // Leave a channel room
  socket.on('leave-channel', (channelKey, userId) => {
    socket.leave(`channel-${channelKey}`);
    console.log(`✓ User ${userId} left channel: ${channelKey}`);
    
    io.to(`channel-${channelKey}`).emit('user-left', {
      userId,
      timestamp: new Date(),
    });
  });

  // Receive message and broadcast to channel
  socket.on('send-message', (channelKey, messageData) => {
    io.to(`channel-${channelKey}`).emit('new-message', messageData);
  });

  // Typing indicator
  socket.on('typing', (channelKey, userId, userName) => {
    socket.to(`channel-${channelKey}`).emit('user-typing', {
      userId,
      userName,
    });
  });

  // Stop typing
  socket.on('stop-typing', (channelKey, userId) => {
    socket.to(`channel-${channelKey}`).emit('user-stop-typing', {
      userId,
    });
  });

  socket.on('disconnect', () => {
    console.log(`✗ User disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
