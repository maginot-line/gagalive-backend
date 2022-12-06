import http from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

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

io.on('connection', (socket) => {
  socket.emit('room_list', getRooms());
  socket.on('join_room', () => {
    const roomList = getRooms();
    let roomId = '';
    if (roomList.length === 0) {
      const getTime = new Date().getTime().toString(36);
      const randomString = Math.random().toString(36).substring(2, 11);
      roomId = getTime + randomString;
      socket.join(roomId);
      socket.emit('welcome', roomId);
    } else {
      roomId = roomList[0];
      socket.join(roomId);
      socket.emit('welcome', roomId);
    }
    console.log(`room ${roomId} joined`);
  });
  socket.on('leave_room', (roomId) => {
    if (roomId) {
      socket.leave(roomId);
      console.log(`room ${roomId} left`);
    }
    socket.to(roomId).emit('break_room');
  });
  socket.on('send_message', (roomId, socketId, msg) => {
    socket.to(roomId).emit('receive_message', socketId, msg);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:8000`);
httpServer.listen(8000, handleListen);
