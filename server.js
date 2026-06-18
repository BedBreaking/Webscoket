const http = require("http");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;

const server = http.createServer();

const wss = new WebSocketServer({
  server,
});

const rooms = {};

wss.on("connection", (socket) => {
  console.log("Player Connected");

  socket.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "join":
        joinRoom(socket, data.payload);
        break;

      case "move":
        sendMove(socket, data.payload);
        break;
    }
  });

  socket.on("close", () => {
    console.log("Player Disconnected");

    if (socket.roomId && rooms[socket.roomId]) {
      rooms[socket.roomId] = rooms[socket.roomId].filter(
        (player) => player !== socket,
      );
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket Server Running on ${PORT}`);
});
