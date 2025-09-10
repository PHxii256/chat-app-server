import app from "./app";
import http from "http";
import connectToDatabase from "./database";
import dotenv from 'dotenv'; 
import socket from "./socket";

dotenv.config();  

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

connectToDatabase();
socket.initializeSocket(server);

