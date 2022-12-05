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
    if (rooms.get(key) != undefined && (rooms.get(key)?.size as number) === 1) {
      roomList.push(key);
    }
  });
  return roomList;
};

io.on('connection', (socket) => {
  socket.on('enter_room', (done) => {
    const roomList = getRooms();
    if (roomList.length === 0) {
      const getTime = new Date().getTime().toString(36);
      const randomString = Math.random().toString(36).substring(2, 11);
      const randomRoom = getTime + randomString;
      socket.join(randomRoom);
      console.log(`room ${randomRoom} created`);
    } else {
      socket.join(roomList[0]);
      socket.to(roomList[0]).emit('welcome');
      console.log(`room ${roomList[0]} joined`);
    }
  });
});

const handleListen = () => console.log(`Listening on http://localhost:8000`);
httpServer.listen(8000, handleListen);
