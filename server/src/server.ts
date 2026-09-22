import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'placerise_jwt_secret_key_change_in_production_2026';

async function startServer() {
  await connectDB();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization
        ? (socket.handshake.headers.authorization as string).replace('Bearer ', '')
        : undefined);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        (socket as any).user = decoded;
      } catch (e) {
        // Token invalid or expired, continue as unauthenticated socket
      }
    }
    next();
  });


  io.on('connection', (socket) => {
    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  // Attach io to app locals
  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` Placerise Server listening on http://localhost:${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
}

startServer();
