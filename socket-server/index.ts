import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

const app = express();
// Allow Next.js to communicate with this server
app.use(cors({ origin: process.env.NEXT_APP_URL || 'http://localhost:3000' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.NEXT_APP_URL || 'http://localhost:3000' },
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Client joins a specific "room" to only hear about their own event
  socket.on('join:event', (eventId: string) => {
    socket.join(`event:${eventId}`);
    console.log(`Socket ${socket.id} joined event:${eventId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use(express.json());

app.post('/emit/checkin', (req, res) => {
  const { eventId, registration } = req.body;
  // Broadcast ONLY to organizers looking at this specific event
  io.to(`event:${eventId}`).emit('checkin', registration);
  res.json({ ok: true });
});

app.post('/emit/announcement', (req, res) => {
  const { message } = req.body;
  // Broadcast to everyone currently connected
  io.emit('announcement', message);
  res.json({ ok: true });
});

const PORT = process.env.SOCKET_PORT || 4000;
httpServer.listen(PORT, () => console.log(`Socket server running on port :${PORT}`));