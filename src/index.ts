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
  const { token } = socket.handshake.auth;
  socket.on('disconnect', () => {
    users.delete(token);
  });
  socket.on('join_room', () => {
    const roomList = getRooms();
    let room = '';
    if (roomList.length === 0) {
      const getTime = new Date().getTime().toString(36);
      const randomString = Math.random().toString(36).substring(2, 11);
      room = getTime + randomString;
      socket.join(room);
      socket.emit('welcome', 'create', room);
    } else {
      room = roomList[0];
      socket.join(room);
      socket.emit('welcome', 'join', room);
    }
    console.log(`room ${room} joined`);
    users.set(token, room);
    io.emit('concurrent_users', users.size);
  });
  socket.on('leave_room', () => {
    const room = users.get(token);
    if (room === undefined) {
      return;
    } else {
      socket.leave(room);
      console.log(`room ${room} left`);
      users.delete(token);
      socket.emit('concurrent_users', users.size);
    }
    socket.to(room).emit('break_room', token);
  });
  socket.on('send_message', (msg) => {
    const room = users.get(token);
    socket.to(room).emit('receive_message', token, msg);
  });
});

const handleListen = () => console.log(`Listening on http://127.0.0.1:8000`);
httpServer.listen(8000, handleListen);
