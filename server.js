import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initGridFS } from './backend/utils/gridfs.js';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './backend/routes/authRoutes.js';
import userRoutes from './backend/routes/userRoutes.js';
import recordingRoutes from './backend/routes/recordingRoutes.js';
import predictionRoutes from './backend/routes/predictionRoutes.js';
import evaluationRoutes from './backend/routes/evaluationRoutes.js';
import adminRoutes from './backend/routes/adminRoutes.js';
import downloadRoutes from './backend/routes/downloadRoutes.js';
import pdfRoutes from './backend/routes/pdfRoutes.js';

// Import middleware
import { errorHandler } from './backend/middleware/errorHandler.js';
import { requestLogger } from './backend/middleware/requestLogger.js';
import { corsConfig } from './backend/middleware/corsConfig.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet());
app.use(cors(corsConfig));
app.use(requestLogger);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== DATABASE CONNECTION ====================

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URL;
    if (!mongoUri) {
      throw new Error('MONGODB_URL environment variable is not defined');
    }

    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || 'voice_health_detection',
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB connected successfully');

    // Initialize GridFS for audio file storage
    initGridFS(mongoose.connection);
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// ==================== WEBSOCKET ====================

// Store connected clients
const connectedClients = new Map();

io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`);

  // Store user association
  socket.on('authenticate', ({ userId }) => {
    connectedClients.set(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`✓ User ${userId} authenticated on socket ${socket.id}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    // Remove from connected clients
    for (const [userId, socketId] of connectedClients.entries()) {
      if (socketId === socket.id) {
        connectedClients.delete(userId);
        break;
      }
    }
    console.log(`✗ Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Make io available globally for routes
app.set('io', io);

// ==================== ROUTES ====================

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    websocket: io.engine.clientsCount + ' clients connected'
  });
});

// API Routes - Version 1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/recordings', recordingRoutes);
app.use('/api/v1/recordings', downloadRoutes);
app.use('/api/v1/predictions', predictionRoutes);
app.use('/api/v1/evaluation', evaluationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/pdf', pdfRoutes);

// Backward compatibility - /api/ without version (deprecated)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recordings', recordingRoutes);
app.use('/api/recordings', downloadRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/admin', adminRoutes);

// Frontend static files (development)
if (NODE_ENV === 'development') {
  app.use(express.static('frontend'));

  // Serve HTML files for frontend routing
  app.get('/login', (req, res) => res.sendFile('./frontend/views/login.html', { root: '.' }));
  app.get('/register', (req, res) => res.sendFile('./frontend/views/register.html', { root: '.' }));
  app.get('/dashboard', (req, res) => res.sendFile('./frontend/views/homepage.html', { root: '.' }));
  app.get('/record', (req, res) => res.sendFile('./frontend/views/record.html', { root: '.' }));
  app.get('/results', (req, res) => res.sendFile('./frontend/views/prediction_result.html', { root: '.' }));
  app.get('/history', (req, res) => res.sendFile('./frontend/views/history.html', { root: '.' }));
  app.get('/evaluation', (req, res) => res.sendFile('./frontend/views/evaluation.html', { root: '.' }));
  app.get('/profile', (req, res) => res.sendFile('./frontend/views/profile.html', { root: '.' }));
  app.get('/admin', (req, res) => res.sendFile('./frontend/views/admin-dashboard.html', { root: '.' }));
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ==================== SERVER START ====================

const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════╗
║   Voice Health Detection System - Backend Server  ║
╚═══════════════════════════════════════════════════╝

🚀 Server running on http://localhost:${PORT}
🔌 WebSocket enabled for real-time updates
📝 Environment: ${NODE_ENV}
🗄️  Database: ${process.env.MONGODB_DB_NAME}
⏰ Started: ${new Date().toISOString()}

📚 API Documentation:
   - Auth: POST /api/v1/auth/register
   - Health: GET /api/health
   - Admin: GET /admin
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      httpServer.close(async () => {
        await mongoose.disconnect();
        console.log('Server closed and database disconnected');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received. Shutting down gracefully...');
      httpServer.close(async () => {
        await mongoose.disconnect();
        console.log('Server closed and database disconnected');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
