import { useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";

const SOCKET_SERVER_URL = "http://localhost:5000";

function formatTime(isoDate) {
  return new Date(isoDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default function App() {
  const socketRef = useRef(null);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState("");
  const [connected, setConnected] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const isLoggedIn = Boolean(username);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket"],
      autoConnect: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("system-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("user-typing", ({ socketId, username: name, isTyping }) => {
      setTypingUsers((prev) => {
        const withoutCurrent = prev.filter((item) => item.socketId !== socketId);
        return isTyping ? [...withoutCurrent, { socketId, username: name }] : withoutCurrent;
      });
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  const typingText = useMemo(() => {
    if (typingUsers.length === 0) {
      return "";
    }

    const names = typingUsers.map((item) => item.username);
    if (names.length === 1) {
      return `${names[0]} is typing...`;
    }

    return `${names.slice(0, 2).join(" and ")} are typing...`;
  }, [typingUsers]);

  const connectToChat = () => {
    const safeName = usernameInput.trim().slice(0, 20);
    if (!safeName || !socketRef.current) {
      return;
    }

    if (!socketRef.current.connected) {
      socketRef.current.connect();
    }

    socketRef.current.emit("register-user", safeName);
    setUsername(safeName);
    setUsernameInput("");
  };

  const sendMessage = () => {
    const text = messageInput.trim();
    if (!text || !socketRef.current || !socketRef.current.connected) {
      return;
    }

    socketRef.current.emit("typing-stop");
    socketRef.current.emit("send-message", text);
    setMessageInput("");
  };

  const handleMessageChange = (event) => {
    const value = event.target.value;
    setMessageInput(value);

    if (!socketRef.current || !socketRef.current.connected) {
      return;
    }

    socketRef.current.emit("typing-start");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("typing-stop");
    }, 700);
  };

  const handleMessageKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  if (!isLoggedIn) {
    return (
      <Box className="page-shell">
        <Container maxWidth="sm" className="login-wrap">
          <Card className="login-card" elevation={0}>
            <CardContent className="login-content">
              <ForumRoundedIcon className="hero-icon" />
              <Typography variant="h3" className="title">
                Live Chat Lab
              </Typography>
              <Typography className="subtitle">
                Enter your username to join the real-time Socket.IO chat room.
              </Typography>

              <TextField
                fullWidth
                label="Username"
                value={usernameInput}
                onChange={(event) => setUsernameInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    connectToChat();
                  }
                }}
                placeholder="e.g. Puneet"
                margin="normal"
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={connectToChat}
                startIcon={<LoginRoundedIcon />}
                className="enter-btn"
              >
                Enter Chat
              </Button>

              <Alert severity={connected ? "success" : "info"} className="status-alert">
                {connected ? "Socket connected" : "Socket will connect when you enter chat"}
              </Alert>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box className="page-shell">
      <Container maxWidth="md" className="chat-wrap">
        <Card className="chat-card" elevation={0}>
          <Box className="chat-header">
            <Box>
              <Typography variant="h5" className="chat-title">
                Welcome, {username}
              </Typography>
              <Typography className="chat-subtitle">Real-time WebSocket chat with Socket.IO</Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip label={connected ? "Online" : "Reconnecting..."} color={connected ? "success" : "warning"} />
              <Chip label={`${onlineUsers.length} users online`} color="primary" variant="outlined" />
            </Stack>
          </Box>

          <Divider />

          <Box className="online-users-strip">
            <Typography className="online-label">Online users:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {onlineUsers.map((name) => (
                <Chip key={name} size="small" label={name} className="user-chip" />
              ))}
            </Stack>
          </Box>

          <Divider />

          <List className="messages-area">
            {messages.map((message) => {
              const isSystem = message.type === "system";
              return (
                <ListItem key={message.id} className={isSystem ? "message-system" : "message-item"} alignItems="flex-start">
                  {!isSystem && (
                    <ListItemAvatar>
                      <Avatar className="avatar">{getInitials(message.username)}</Avatar>
                    </ListItemAvatar>
                  )}
                  <ListItemText
                    primary={
                      isSystem ? (
                        <Typography className="system-text">{message.text}</Typography>
                      ) : (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography className="message-user">{message.username}</Typography>
                          <Typography className="message-time">{formatTime(message.timestamp)}</Typography>
                        </Stack>
                      )
                    }
                    secondary={!isSystem ? <Typography className="message-text">{message.text}</Typography> : null}
                  />
                </ListItem>
              );
            })}

            {typingText && (
              <ListItem className="typing-indicator-row">
                <ListItemText primary={<Typography className="typing-indicator">{typingText}</Typography>} />
              </ListItem>
            )}
            <div ref={messageEndRef} />
          </List>

          <Divider />

          <Box className="composer">
            <TextField
              fullWidth
              multiline
              maxRows={3}
              value={messageInput}
              onChange={handleMessageChange}
              onKeyDown={handleMessageKeyDown}
              placeholder="Type your message"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={sendMessage} color="primary" aria-label="send message">
                      <SendRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Card>
      </Container>
    </Box>
  );
}
