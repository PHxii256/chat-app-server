import { Server as SocketIOServer } from "socket.io";
import Room from "./models/room";
import mongoose from "mongoose";

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

// In-memory user tracking: { socketId: { username, roomCode } }
const users: Record<string, { username: string; roomCode: string }> = {};

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Handle joining a room
  socket.on("join-room", ({ roomCode, username }) => {
    console.log(`${username} is trying to join room: ${roomCode}`);
    if (!roomCode || !username) return;
    socket.join(roomCode);
    users[socket.id] = { username, roomCode };
    // Welcome the user
    socket.emit("chat-message", JSON.stringify({ serverMsg: `Welcome ${username}! You joined room ${roomCode}.` }));
    // Notify others in the room
    socket.to(roomCode).emit("chat-message",  JSON.stringify({ serverMsg: `${username} has joined the room.` }));
    console.log(`${username} joined room ${roomCode}`);
  });

  // Handle chat messages
  socket.on("chat-message", async ({ content , username , type = "text" , replyTo}) => {
    const user = users[socket.id];
    if (user && user.roomCode) {

      //update to use the message model
      const messageId = new mongoose.Types.ObjectId();
      const messageData = {
        _id: messageId,
        senderId: socket.id,
        username,
        content,
        type,
        replyTo,
        createdAt: Date.now()
      };

      console.log("Message to be saved:", JSON.stringify(messageData));

      io!.to(user.roomCode).emit("chat-message", JSON.stringify(messageData));

      // Save message to the room's messages array
      try {
        await Room.findOneAndUpdate(
          { code: user.roomCode },
          {
            $push: {
              messages: messageData
            }
          },
          { upsert: true }
        );
      } catch (err) {
        console.error("Error saving message to room:", err);
      }
    } else {
      socket.emit("chat-message", "You must join a room first.");
    }
  });

  socket.on("message-update", async ({ newContent , messageId, roomCode}) => {
  if (!newContent) {
      console.log("content is null");
  }
  try {
    const result = await Room.updateOne(
      { code: roomCode, "messages._id": messageId },
      { $set: { "messages.$.content": newContent ,  "messages.$.updatedAt": new Date()} }
    );

    if (result.modifiedCount === 0) {
      io!.to(roomCode).emit("message-update", JSON.stringify({"newContent" : newContent, "messageId":messageId }));
    }

   console.log("Message edited successfully");
  } catch (error) {
    console.error("Error editing message:", error);
  }
});

  socket.on("message-reaction", async ({ messageId, roomCode, emoji, senderUsername, action, timestamp }) => {
    console.log(`Reaction ${action}: ${emoji} on message ${messageId} by ${senderUsername}`);
    
    try {
      const reaction = {
        emoji,
        senderUsername,
        senderId: socket.id,
        timestamp: new Date(timestamp)
      };

      console.log(`Attempting to ${action} reaction:`, reaction);

      let result;
      if (action === 'add') {
        // First remove any existing reaction with same emoji and user to ensure only one per user
        const removeResult = await Room.updateOne(
          { code: roomCode, "messages._id": messageId },
          { $pull: { "messages.$.reactions": { emoji, senderUsername: senderUsername } } }
        );
        console.log(`Remove existing reaction result:`, removeResult);
        
        // Then add the new reaction
        result = await Room.updateOne(
          { code: roomCode, "messages._id": messageId },
          { $push: { "messages.$.reactions": reaction } }
        );
        console.log(`Add reaction result:`, result);
      } else if (action === 'remove') {
        // Remove reaction from the message's reactions array
        result = await Room.updateOne(
          { code: roomCode, "messages._id": messageId },
          { $pull: { "messages.$.reactions": { emoji, senderUsername: senderUsername } } }
        );
        console.log(`Remove reaction result:`, result);
      }

      if (result && result.modifiedCount > 0) {
        // Broadcast the reaction update to all users in the room
        io!.to(roomCode).emit("message-reaction", JSON.stringify({
          messageId,
          emoji,
          senderUsername,
          senderId: socket.id,
          action,
          timestamp
        }));
        console.log(`Reaction ${action} successful`);
      } else {
        console.log(`Reaction ${action} failed - message not found, res: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error("Error processing reaction:", error);
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    const user = users[socket.id];
    if (user && user.roomCode) {
      socket.to(user.roomCode).emit("chat-message", JSON.stringify({ serverMsg: `${user.username} has left the room.` }));
      delete users[socket.id];
    }
    console.log("User disconnected:", socket.id);
  });
});
}

export default { initializeSocket, io };
