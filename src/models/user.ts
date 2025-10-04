import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    profilePic: { type: String },
    auth: {
        email: { 
            type: String, 
            required: true,
            unique: true, 
            lowercase: true, 
            trim: true 
        },
        password: { 
            type: String, 
            required: true,
            select: false // Never return this field in query results by default
        },
        // OAuth Fields
        googleId: { 
            type: String, 
            unique: true, 
            sparse: true 
        },
        // JWT/Session Management (Refresh Tokens)
        refreshTokens: [String], // Array to store multiple refresh tokens for multi-device login
        // Verification
        isVerified: { 
            type: Boolean, 
            default: false 
        }
    }
}, { 
    timestamps: true 
});

const User = mongoose.model("User", userSchema);

export default User;