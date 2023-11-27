import express from "express";
import http from "http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { roomHandler } from "./room/index.js";
import authRoute from "./routes/auth.js";

const app = express();
app.use(cors());

dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB Disconnected");
});

const server = http.createServer(app);

// we need to pass options for the cors to our server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// middlewares
app.use(cookieParser());
app.use(express.json());

app.use("/auth", authRoute);

io.on("connection", (socket) => {
  roomHandler(socket);
  console.log("User is connected");

  socket.on("disconnect", () => {
    console.log("User is disconnected");
  });
});

const port = 8000;
server.listen(port, () => {
  connect();
  console.log(`Connected to back-end & listening at port ${port}`);
});
