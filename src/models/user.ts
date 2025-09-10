import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username : {type: String, required : true},
    email : {type: String, unique: true}, //change to required: true later
    profilePic : {type:String}
});

const User = mongoose.model("User", userSchema);

export default User;