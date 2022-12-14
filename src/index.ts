import http from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: 'https://127.0.0.1:3000', methods: ['GET', 'POST'] } });

const getRooms = () => {
  const {
    sockets: {
      adapter: { rooms, sids },
    },
  } = io;
  const roomList: string[] = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined && (rooms.get(key)?.size as number) === 1) {
      roomList.push(key);
    }
  });
  return roomList;
};

const users = new Map();

io.on('connection', (socket) => {
  socket.on('join_room', () => {
    const roomList = getRooms();
    let roomId = '';
    if (roomList.length === 0) {
      const getTime = new Date().getTime().toString(36);
      const randomString = Math.random().toString(36).substring(2, 11);
      roomId = getTime + randomString;
      socket.join(roomId);
      socket.emit('welcome', 'create', roomId);
    } else {
      roomId = roomList[0];
      socket.join(roomId);
      socket.emit('welcome', 'join', roomId);
    }
    console.log(`room ${roomId} joined`);
    users.set(socket.id, roomId);
    socket.emit('concurrent_users', users.size);
  });
  socket.on('leave_room', (roomId, socketId) => {
    if (roomId) {
      socket.leave(roomId);
      console.log(`room ${roomId} left`);
      if (users.get(socket.id) !== roomId) {
        console.log('error');
      } else {
        users.delete(socket.id);
        socket.emit('concurrent_users', users.size);
      }
    }
    socket.to(roomId).emit('break_room', socketId);
  });
  socket.on('send_message', (roomId, socketId, msg) => {
    socket.to(roomId).emit('receive_message', socketId, msg);
  });
});

const handleListen = () => console.log(`Listening on http://127.0.0.1:8000`);
httpServer.listen(8000, handleListen);
