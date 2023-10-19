import { Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

 const rooms = {};
export const roomHandler = (socket) => {
    const createRoom = () => {
      const roomId = uuidv4();
      rooms[roomId] = [];
      socket.emit("room-created", { roomId });
      console.log("User created the room");
    };
    const joinRoom = ({ roomId, peerId }) => {
      console.log(roomId);
      console.log(rooms);
      if (roomId in rooms) {
        console.log("iaminsideif")
        socket.join(roomId);
        rooms[roomId].push(peerId); // storing the ids' of the paricipants which are joining
        console.log("User joined the room, his/her id:", roomId, peerId);
  
        // for sending user-joined event to every participants and his/her id (of new user who joined)
        socket.to(roomId).emit("user-joined", { peerId });
  
        // for showing the list of joined paricipants to everyone in the room
        socket.emit("get-users", {
          roomId,
          participants: rooms[roomId],
        });
      }
      else{
        console.log("ifconditionisfalsse");
      }
      // if the user leaves the meet
      socket.on("disconnect", () => {
        console.log("user left the room", peerId);
        leaveRoom({ roomId, peerId });
      });
    };
    const leaveRoom = ({ roomId, peerId }) => {
      rooms[roomId] = rooms[roomId].filter((id) => id !== peerId);
      socket.to(roomId).emit("user-disconnected", peerId);
    };
    const validateRoomId = ({roomId})=>{
      console.log(rooms);
         if(rooms[roomId]){
          socket.emit("valid-roomId");
         }
         else{
          socket.emit("invalid-roomId");
         }
    }
    socket.on("create-room", createRoom);
    socket.on("join-room", joinRoom);
    socket.on("someone-trying-to-join-room", validateRoomId);
  };