import mongoose, { Schema } from "mongoose";
import Message from "./message";
import User from "./user";

const roomSchema = new Schema({
    name : { type: String },
    code : { type: String, unique: true , required: true },
    description : { type: String },
    members : [User.schema],
    messages: [Message.schema]
})

const Room = mongoose.model("Room", roomSchema);

export default Room;
