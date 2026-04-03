const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send({ message: "Socket.IO Chat Server is running" });
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const users = new Map();

function getOnlineUsers() {
  return Array.from(users.values()).sort((a, b) => a.localeCompare(b));
}

function buildMessage({ type = "chat", username = "System", text, socketId = null }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    type,
    socketId,
    username,
    text,
    timestamp: new Date().toISOString(),
  };
}

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`);

  socket.on("register-user", (username) => {
    const safeName = String(username || "").trim().slice(0, 20);
    if (!safeName) {
      return;
    }

    users.set(socket.id, safeName);

    socket.emit(
      "system-message",
      buildMessage({
        type: "system",
        text: `Welcome, ${safeName}!`,
      })
    );

    socket.broadcast.emit(
      "system-message",
      buildMessage({
        type: "system",
        text: `${safeName} joined the chat`,
      })
    );

    io.emit("online-users", getOnlineUsers());
  });

  socket.on("send-message", (text) => {
    const username = users.get(socket.id);
    const safeText = String(text || "").trim().slice(0, 500);

    if (!username || !safeText) {
      return;
    }

    io.emit(
      "receive-message",
      buildMessage({
        type: "chat",
        socketId: socket.id,
        username,
        text: safeText,
      })
    );
  });

  socket.on("typing-start", () => {
    const username = users.get(socket.id);
    if (!username) {
      return;
    }

    socket.broadcast.emit("user-typing", { socketId: socket.id, username, isTyping: true });
  });

  socket.on("typing-stop", () => {
    const username = users.get(socket.id);
    if (!username) {
      return;
    }

    socket.broadcast.emit("user-typing", { socketId: socket.id, username, isTyping: false });
  });

  socket.on("disconnect", () => {
    const username = users.get(socket.id);
    users.delete(socket.id);

    if (username) {
      socket.broadcast.emit(
        "system-message",
        buildMessage({
          type: "system",
          text: `${username} left the chat`,
        })
      );
    }

    io.emit("online-users", getOnlineUsers());
    io.emit("user-typing", { socketId: socket.id, username: username || "", isTyping: false });

    console.log(`Disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
