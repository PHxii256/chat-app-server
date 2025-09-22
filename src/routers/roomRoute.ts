import express from "express";
import Room from "../models/room";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the Chat App!");
});

// Create a new chat room
router.post("/:code", async (req, res) => {
  const { name, description, code } = req.body;
  const room = new Room({
    name,
    description,
    code,
    members: [],
    createdAt: new Date(),
  });
  try {
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get a room by code
router.get("/:code", async (req, res) => {
  const roomCode = req.params.code;
  try {
    const room = await Room.findOne({ code: roomCode });
    if (!room) {
      return res.status(404).send("Room not found");
    }
    res.status(200).json(room);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Get chat history 
router.get("/chat-history/:roomCode", async (req, res) => {
  const roomCode = req.params.roomCode;
  try {
    let room = await Room.findOne({ code: roomCode });
    if (!room) {
      // Create a new room if not found
      room = new Room({ code: roomCode, members: [], messages: [], createdAt: new Date() });
      await room.save();
    }
    res.status(200).json(room.messages);
  } catch (error) {
    console.error("Error fetching room:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:code/deleteMsg/:msgId", async (req, res) => {
  console.log("Delete message endpoint hit");
  const roomCode = req.params.code;
  const msgId = req.params.msgId;

  try {
    const result = await Room.updateOne({
      code: roomCode,
      "messages._id": msgId
    },
    { $pull: { messages: { _id: msgId } } });
    
    console.log(result);
    if (result.modifiedCount === 0) {
      return res.status(404).send("Message or Room not found");
    } else {
      res.status(200).json({ message: "Message deleted successfully" });
    }
  } catch (e) {
    res.status(501).send(e);
    console.log(e);
  }
})

router.patch("/:code/editMsg/:msgId", async (req, res) => {
  console.log("Edit message endpoint hit");
  const roomCode = req.params.code;
  const msgId = req.params.msgId;
  const { content } = req.body;

  if (!content) {
    return res.status(400).send("Content is required");
  }
  try {
    const result = await Room.updateOne(
      { code: roomCode, "messages._id": msgId },
      { $set: { "messages.$.content": content ,  "messages.$.updatedAt": new Date()} }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).send("Message not found");
    }

    res.status(200).json({ message: "Message edited successfully" });
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).send("Internal Server Error");
  }
});

export default router;