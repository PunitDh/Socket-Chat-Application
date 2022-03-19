const { instrument } = require("@socket.io/admin-ui");

const io = require("socket.io")(7000, {
  cors: {
    origin: [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://admin.socket.io",
    ],
  },
});

const userIo = io.of("/user");
userIo.on("connection", (socket) => {
  console.log(
    "You connected to user namespace with username:",
    socket.username
  );
});

userIo.use((socket, next) => {
  if (socket.handshake.auth.token) {
    socket.username = getUsernameFromToken(socket.handshake.auth.token);
    next();
  } else {
    next(new Error("Authentication error"));
  }
});

function getUsernameFromToken(token) {
  return token;
}

const users = {};

io.on("connection", (socket) => {
  console.log("New connection started with socketID:", socket.id);

  socket.on("new-user", (name) => {
    users[socket.id] = name;
    socket.broadcast.emit("user-connected", name);
    console.log("Current users connected:", users);
  });

  socket.on("send-chat-message", ({ username, message, room }) => {
    console.log({ message, username, room });
    if (room === "") {
      socket.broadcast.emit("receive-chat-message", {
        message,
        username: users[socket.id],
      });
    } else {
      socket.to(room).emit("receive-chat-message", {
        message,
        username: users[socket.id],
      });
    }
  });

  socket.on("join-room", ({ username, room }, cb) => {
    socket.join(room);
    cb(`You joined ${room}`);
  });

  socket.on("disconnect", () => {
    console.log(users[socket.id], "disconnected");
    socket.broadcast.emit("user-disconnected", users[socket.id]);
    delete users[socket.id];
  });

  socket.on("ping", (n) => console.log(n));
});

instrument(io, { auth: false });
