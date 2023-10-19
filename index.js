import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { roomHandler } from "./room/index.js";

const port = 8000;
const app = express();
app.use(cors);
const server = http.createServer(app);

// we need to pass options for the cors to our server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//Creating map to store which email id is belonging to which socketid
const emailToSocketIdMap = new Map();

//Creating map to store which socket id is belonging to which email id
const socketIdToEmailMap = new Map();
io.on("connection", (socket) => {
    console.log("User is connected");
  roomHandler(socket);
  socket.on("disconnect", () => {
    console.log("User is disconnected");
  });  
  });

  server.listen(port, () => {
    console.log(`Listening to the server at ${port}`);
  });