const express = require("express");
const socketio = require("socket.io");
const { generateMessage } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./utils/users");

const app = express();

app.use(express.static("public"));
const port = 3000;

const server = app.listen(port, () => {
  console.log(`app is running on port ${port}`);
});

const io = socketio(server);

io.on("connection", (socket) => {
  console.log("client connected");

  socket.emit("message", generateMessage("Welcome"));

  socket.on("join", ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.broadcast
      .to(user.room)
      .emit("message", generateMessage(`${user.username} has joined`));

    io.to(user.room).emit("userListUpdated", {
      room: user.room,
      userList: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("send", (message, callback) => {
    const user = getUser(socket.id);
    io.to(user.room).emit("message", generateMessage(message, user.username));
    callback();
  });

  socket.on("shareLocation", (location) => {
    const user = getUser(socket.id);

    const { latitude, longitude } = location;
    const gmapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    io.to(user.room).emit(
      "location",
      generateMessage(gmapsLink, user.username)
    );
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      socket.broadcast
        .to(user.room)
        .emit("message", generateMessage(`${user.username} disconnected`));

      io.to(user.room).emit("userListUpdated", {
        room: user.room,
        userList: getUsersInRoom(user.room),
      });
    }
  });
});
