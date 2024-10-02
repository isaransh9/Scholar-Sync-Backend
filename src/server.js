import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes.js";
import profileRouter from "./routes/profile.routes.js";
import jobRouter from "./routes/job.routes.js";
import messageRouter from "./routes/messages.routes.js";
import machineLearningRouter from "./routes/machineLearning.routes.js";
import connectDB from "./db/index.js";
import { app, server } from "./socket/socket.js";
import cors from "cors";

dotenv.config({
  path: "./.env",
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(bodyParser.json());

connectDB()
  .then(() => {
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Server listening at port :${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDb Connection Failed", error);
  });

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/job", jobRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/machineLearning", machineLearningRouter);
// Actual url ==> http://localhost:8000/api/v1/user/register
