const http = require("http");
const { WebSocketServer } = require("ws");
const { randomUUID } = require("crypto");
const PORT = process.env.PORT || 8080;

const server = http.createServer();

const wss = new WebSocketServer({
  server,
});

const rooms = {};

wss.on("connection", (socket) => {
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
    const roomId = socket.roomId;
    if (!roomId || !rooms[roomId]) return;
    rooms[roomId] = rooms[roomId].filter((player) => player !== socket);
    const players = getRoomPlayers(roomId);
    rooms[roomId].forEach((player) => {
      player.send(
        JSON.stringify({
          type: "room_players",
          roomId,
          players,
        }),
      );
    });

    console.log(`${socket.name} disconnected`);
  });
});

function getRoomPlayers(roomId) {
  return rooms[roomId].map((player) => ({
    id: player.playerId,
    name: player.name,
    points: player.points,
  }));
}

function joinRoom(socket, payload) {
  const { roomId, name } = payload;
  if (!roomId || !name) {
    socket.send(
      JSON.stringify({
        type: "error",
        message: "roomId and name are required",
      }),
    );
    return;
  }

  if (!rooms[roomId]) {
    rooms[roomId] = [];
  }

  const alreadyJoined = rooms[roomId].some((player) => player === socket);

  if (alreadyJoined) {
    return;
  }

  socket.roomId = roomId;
  socket.name = name;
  socket.playerId = randomUUID();
  socket.points = 0;

  rooms[roomId].push(socket);

  const players = getRoomPlayers(roomId);

  socket.send(
    JSON.stringify({
      type: "joined",
      roomId,
      player: {
        id: socket.playerId,
        name: socket.name,
        points: socket.points,
      },
      players,
    }),
  );

  rooms[roomId].forEach((player) => {
    player.send(
      JSON.stringify({
        type: "room_players",
        roomId,
        players,
      }),
    );
  });

  console.log(
    `${name} joined room ${roomId}. Total players: ${players.length}`,
  );
}

function sendMove(socket, data) {
  const roomId = socket.roomId;

  const room = rooms[roomId];

  if (!room) return;

  if (data.pointType === "increment") {
    socket.points += data.points;
  }

  if (data.pointType === "decrement") {
    socket.points -= data.points;
  }

  const players = getRoomPlayers(roomId);

  room.forEach((player) => {
    player.send(
      JSON.stringify({
        type: "room_players",
        roomId,
        players,
      }),
    );
  });
}
server.listen(PORT, () => {
  console.log(`WebSocket Server Running on ${PORT}`);
});
