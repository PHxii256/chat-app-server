import mongoose from "mongoose";

function connectToDatabase() {

mongoose.connect(process.env.MONGODB_URL as string)
  .then(() => {
    console.log("Connected to MongoDB Successfully");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
}

export default connectToDatabase;
