# Experiment 7.3 - Real-Time Chat with Socket.IO

This experiment demonstrates bidirectional real-time communication using WebSocket (Socket.IO) with:

- Username registration
- Instant message broadcasting
- Online user tracking
- Typing indicators
- Join/leave system notifications
- Responsive React + Material UI interface

## Project Structure

- `server/` - Express + Socket.IO backend
- `client/` - React + Vite + Material UI frontend

## Requirements

- Node.js v18+
- npm v9+

## Run Locally

### 1. Start server

```bash
cd server
npm install
npm run dev
```

Server runs on `http://localhost:5000`.

### 2. Start client

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Client runs on `http://localhost:5173`.

## Socket Events Used

- `register-user`
- `send-message`
- `receive-message`
- `online-users`
- `typing-start`
- `typing-stop`
- `user-typing`
- `system-message`

## Testing Real-Time Behavior

1. Open two browser tabs at `http://localhost:5173`
2. Join chat with different usernames
3. Verify:
   - Join/leave notifications
   - Instant message delivery
   - Online user list updates
   - Typing indicator appears/disappears
