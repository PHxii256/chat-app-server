import express from "express";
import cors from "cors"
import roomRoute from "./routers/roomRoute";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/room", roomRoute);

export default app;