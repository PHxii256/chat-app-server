import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | undefined = undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initializeSocket(httpServer: any) {

  io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
  },
});

console.log("Socket.IO file is running");

io.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("message", (msg) => {
    console.log("Message from client:", msg);
    io!.emit("message", `Server received: ${msg}`); // Broadcast to all connected clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});
}

export default { initializeSocket, io };
