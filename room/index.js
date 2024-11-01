import { Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";

const rooms = {};
export const roomHandler = (socket) => {
    const createRoom = ({name}) => {
      const roomId = uuidv4();
      rooms[roomId] = [];
      console.log("thisi is name", name);
      socket.emit("enter-room", { name, roomId });
      console.log("User created the room");
    };
    const joinRoom = ({ roomId, peerId , name}) => {
      console.log(roomId);
      console.log(rooms);
      if (roomId in rooms) {
        console.log("iaminsideif")
        socket.join(roomId);
        rooms[roomId].push({name, peerId}); // storing the ids' of the paricipants which are joining
        console.log("User joined the room, his/her id:", roomId, peerId);
  
        // for sending user-joined event to every participants and his/her id (of new user who joined)
        socket.to(roomId).emit("user-joined", { peerId });
  
        // for showing the list of joined paricipants to everyone in the room
        socket.emit("get-users", {
          roomId,
          participants: rooms[roomId],
        });
        socket.to(roomId).emit("get-users", {
          roomId,
          participants: rooms[roomId],
        });
                  // message listener 
                  socket.on('message', ({userName, message}) => {
                    console.log('message received', userName);
                     socket.to(roomId).emit('createMessage', {userName, message});
                  })
      }
      else{
        console.log("ifconditionisfalsse");
      }


    // if the user leaves the meet
    socket.on("user-leaves", () => {
      console.log("user left the room", peerId);
      leaveRoom({ roomId, peerId });
    });
    socket.on("disconnect", () => {
      console.log("user left the room", peerId);
      leaveRoom({ roomId, peerId });
    });
  };
  const leaveRoom = ({ roomId, peerId }) => {
    rooms[roomId] = rooms[roomId].filter((user) => user.peerId !== peerId);
    socket.emit("get-users", {
      roomId,
      participants: rooms[roomId],
    });
    socket.to(roomId).emit("get-users", {
      roomId,
      participants: rooms[roomId],
    });

    socket.to(roomId).emit("user-disconnected", peerId);
  };
  const validateRoomId = ({ name, roomId }) => {
    console.log(rooms);
    if (rooms[roomId]) {
      socket.emit("enter-room", { name, roomId });
    } else {
      socket.emit("invalid-roomId");
    }
  };
  const startSharing = ({ peerId, roomId }) => {
    socket.to(roomId).emit("user-started-sharing", peerId);
  };
  const stopSharing = (roomId) => {
    socket.to(roomId).emit("user-stopped-sharing");
  };
  socket.on("create-room", createRoom);
  socket.on("join-room", joinRoom);
  socket.on("someone-trying-to-join-room", validateRoomId);
  socket.on("start-sharing", startSharing);
  socket.on("stop-sharing", stopSharing);
};
