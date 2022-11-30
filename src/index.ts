import http from 'http';
import { Server } from 'socket.io';
import express from 'express';

const app = express();

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('enter_room', (msg, done) => {
    console.log(msg);
  });
});

const handleListen = () => console.log(`Listening on http://localhost:8000`);
httpServer.listen(8000, handleListen);
