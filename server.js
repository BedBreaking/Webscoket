// server.js

const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 8080 });

const rooms = {};

wss.on("connection", (socket) => {
  console.log("Player Connected");
  socket.on("message", (message) => {
    console.log("Received:", JSON.parse(message));
    const data = JSON.parse(message);
    switch (data.type) {
      case "join":
        joinRoom(socket, data?.payload);
        break;

      case "move":
        sendMove(socket, data?.payload);
        break;
    }
  });

  socket.on("close", () => {
    console.log("Player Disconnected");
  });
});

function joinRoom(socket, data) {
  console.log(data, "Data");
  const { roomId, name } = data;
  console.log(roomId, "Room ID");
  console.log(name, "Player Name");
  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }

  rooms[roomId].push(socket);
  socket.roomId = roomId;
  socket.name = name;

  console.log(`Player joined room ${roomId}`);

  socket.send(
    JSON.stringify({
      type: "joined",
      roomId,
      name: name,
    }),
  );
  socket;
}

function sendMove(socket, data) {
  console.log(rooms[socket.roomId], "room");
  const room = rooms[socket.roomId];
  if (!room) return;
  room.forEach((player) => {
    console.log(player, "player");
    if (player !== socket) {
      player.send(
        JSON.stringify({
          type: "move",
          x: data.x,
          y: data.y,
          name: data.player,
        }),
      );
    }
  });
}

console.log("WebSocket running on port 8080");
