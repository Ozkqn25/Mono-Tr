const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const {
  createPlayer, createGame,
  actionRollDice, actionBuyProperty, actionDeclineBuy,
  actionEndTurn, actionBuyHouse, actionSellHouse,
  actionMortgage, actionUnmortgage,
  actionPayJailFine, actionUseGetOutCard,
  SQUARES, COLOR_GROUPS
} = require('./Src/gameEngine');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const rooms = {}; // roomId -> game
const playerRooms = {}; // socketId -> roomId

function broadcastRoom(roomId) {
  const game = rooms[roomId];
  if (!game) return;
  io.to(roomId).emit('gameState', sanitizeGame(game));
}

function sanitizeGame(game) {
  return {
    roomId: game.roomId,
    hostId: game.hostId,
    players: game.players,
    state: game.state,
    currentPlayerIndex: game.currentPlayerIndex,
    diceRoll: game.diceRoll,
    properties: game.properties,
    freeParking: game.freeParking,
    log: game.log.slice(0, 20),
    pendingAction: game.pendingAction,
    turn: game.turn,
    winner: game.winner
  };
}

io.on('connection', (socket) => {
  console.log(`🔌 Bağlandı: ${socket.id}`);

  // Oda oluştur
  socket.on('createRoom', ({ playerName }, cb) => {
    const roomId = Math.random().toString(36).substr(2, 5).toUpperCase();
    const game = createGame(roomId, socket.id);
    const player = createPlayer(socket.id, playerName || 'Oyuncu1', 0);
    game.players.push(player);
    rooms[roomId] = game;
    playerRooms[socket.id] = roomId;
    socket.join(roomId);
    console.log(`🏠 Oda oluşturuldu: ${roomId} - Host: ${playerName}`);
    cb?.({ ok: true, roomId, playerId: socket.id });
    broadcastRoom(roomId);
  });

  // Odaya katıl
  socket.on('joinRoom', ({ roomId, playerName }, cb) => {
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oda bulunamadı!' });
    if (game.state !== 'lobby') return cb?.({ error: 'Oyun başladı!' });
    if (game.players.length >= 6) return cb?.({ error: 'Oda dolu!' });
    if (game.players.find(p => p.id === socket.id)) return cb?.({ error: 'Zaten buradasın!' });

    const player = createPlayer(socket.id, playerName || `Oyuncu${game.players.length + 1}`, game.players.length);
    game.players.push(player);
    playerRooms[socket.id] = roomId;
    socket.join(roomId);
    console.log(`👤 ${playerName} odaya katıldı: ${roomId}`);
    cb?.({ ok: true, playerId: socket.id });
    broadcastRoom(roomId);
  });

  // Oyunu başlat
  socket.on('startGame', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oda yok!' });
    if (game.hostId !== socket.id) return cb?.({ error: 'Sadece host başlatabilir!' });
    if (game.players.length < 2) return cb?.({ error: 'En az 2 oyuncu gerek!' });
    game.state = 'playing';
    game.log = [`🎮 Oyun başladı! İlk sıra: ${game.players[0].name}`];
    console.log(`🎮 Oyun başladı: ${roomId}`);
    cb?.({ ok: true });
    broadcastRoom(roomId);
  });

  // Zar at
  socket.on('rollDice', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game || game.state !== 'playing') return cb?.({ error: 'Oyun yok!' });
    const result = actionRollDice(game, socket.id);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Mülk satın al
  socket.on('buyProperty', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionBuyProperty(game, socket.id);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Satın almayı reddet
  socket.on('declineBuy', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionDeclineBuy(game, socket.id);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Sırayı bitir
  socket.on('endTurn', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionEndTurn(game, socket.id);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Ev/otel al
  socket.on('buyHouse', ({ squareId }, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionBuyHouse(game, socket.id, squareId);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Ev sat
  socket.on('sellHouse', ({ squareId }, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionSellHouse(game, socket.id, squareId);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // İpotek
  socket.on('mortgage', ({ squareId }, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionMortgage(game, socket.id, squareId);
    cb?.(result);
    broadcastRoom(roomId);
  });

  socket.on('unmortgage', ({ squareId }, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionUnmortgage(game, socket.id, squareId);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Hapisten çıkış
  socket.on('payJailFine', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionPayJailFine(game, socket.id);
    cb?.(result);
    broadcastRoom(roomId);
  });

  socket.on('useGetOutCard', (_, cb) => {
    const roomId = playerRooms[socket.id];
    const game = rooms[roomId];
    if (!game) return cb?.({ error: 'Oyun yok!' });
    const result = actionUseGetOutCard(game, socket.id);
    cb?.(result);
    broadcastRoom(roomId);
  });

  // Bağlantı kesildi
  socket.on('disconnect', () => {
    const roomId = playerRooms[socket.id];
    if (!roomId) return;
    const game = rooms[roomId];
    if (!game) return;

    const player = game.players.find(p => p.id === socket.id);
    if (player) {
      player.isActive = false;
      console.log(`❌ ${player.name} ayrıldı: ${roomId}`);
      if (game.state === 'playing') {
        game.log.unshift({ msg: `⚠️ ${player.name} bağlantısını kesti!`, time: new Date().toLocaleTimeString('tr-TR') });
      }
    }

    // Tüm oyuncular ayrıldıysa odayı sil
    const active = game.players.filter(p => p.isActive);
    if (active.length === 0) {
      delete rooms[roomId];
      console.log(`🗑️ Oda silindi: ${roomId}`);
    } else {
      // Host değişimi
      if (game.hostId === socket.id) {
        game.hostId = active[0].id;
      }
      broadcastRoom(roomId);
    }
    delete playerRooms[socket.id];
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Monopoly Türkiye sunucusu: http://localhost:${PORT}`);
});
