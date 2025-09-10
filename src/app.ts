import express from "express";
import homeRoute from "./routers/homeRoute";

const app = express();
app.use(express.json());
app.use("/", homeRoute);

export default app;