import { model, Schema } from "mongoose";

const messageSchema = new Schema({
    senderId: { type: String, ref: "User", required: true },
    username: { type: String, default: "Anonymous" },
    profilePic: { type: String },
    content: { type: String, required: true },
    type: { type: String , default: "text"},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    replyTo: {
        messageId: { type: String, required: true},
        content: { type: String, required: true },
    }
});

const Message = model("Message", messageSchema);

export default Message;