import express from "express";
import Room from "../models/room";
const router = express.Router();

router.get("/", (req, res) => {
  res.send("Welcome to the Chat App!");
});

// Route to create a new chat room
router.get("/room", async (req, res) => {
  const room = new Room(
    {
      name: "General",
      description: "A room for general chat",
      members: [],
    }
  );
  try {
    await room.save();
    console.log("Room created");
    res.status(201).send(`Welcome to the ${room.name} Chat Room!`);
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).send("Internal Server Error");
  }
});


export default router;