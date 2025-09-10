import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema({
    name : { type: String },
    description : { type: String },
    members : [{
        userId: { type: Schema.Types.ObjectId, ref: "User" },
        username: { type: String },
        profilePic: { type: String }
    }]
})

const Room = mongoose.model("Room", roomSchema);

export default Room;
