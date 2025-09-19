import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username : {type: String, required : true, unique: true},
    email : {type: String, unique: true, required: false}, //change to true in production
    profilePic : {type:String}
});

const User = mongoose.model("User", userSchema);

export default User;