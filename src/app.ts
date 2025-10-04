import express from "express";
import cors from "cors"
import roomRoute from "./routers/roomRoute";
import authRoute from "./routers/authRoute";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/room", roomRoute);
app.use("/auth", authRoute);

export default app;