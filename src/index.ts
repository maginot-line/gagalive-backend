import http from 'http';
import express from 'express';
import { Server } from 'socket.io';
import { instrument } from '@socket.io/admin-ui';

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: ['https://admin.socket.io'], credentials: true } });
instrument(io, { auth: false });
const adminNamespace = io.of('/admin');

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
    users.set(socket.id, room);
    io.emit('concurrent_users', users.size);
    console.log(`${socket.id} is joined to room ${room}`);
  });
  socket.on('leave_room', () => {
    const room = users.get(socket.id);
    if (room === undefined) {
      return;
    } else {
      socket.leave(room);
      users.delete(socket.id);
      io.emit('concurrent_users', users.size);
    }
    if (io.sockets.adapter.rooms.get(room)?.size === 1) {
      socket.to(room).emit('break_room');
    }
    console.log(`${socket.id} is leaved from room ${room}`);
  });
  socket.on('send_message', (msg) => {
    const room = users.get(socket.id);
    socket.to(room).emit('receive_message', msg);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:8000`);
httpServer.listen(8000, handleListen);
