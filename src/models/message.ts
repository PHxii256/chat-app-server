import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    roomId: { type: Schema.Types.ObjectId, ref: "Room", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;