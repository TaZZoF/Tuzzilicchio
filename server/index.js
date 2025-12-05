// Tuzzilicchio Server - Express + Socket.io
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { TuzzilicchioGame } = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Game rooms storage
const rooms = new Map();

// Generate a short room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Broadcast game state to all players in a room
function broadcastGameState(roomId) {
  const game = rooms.get(roomId);
  if (!game) return;

  for (const player of game.players) {
    const state = game.getGameState(player.socketId);
    io.to(player.socketId).emit('gameState', state);
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create a new room
  socket.on('createRoom', ({ playerName }) => {
    const roomCode = generateRoomCode();
    const game = new TuzzilicchioGame(roomCode);
    const playerId = uuidv4();

    const player = game.addPlayer(playerId, playerName, socket.id);
    if (!player) {
      socket.emit('error', { message: 'Impossibile creare la stanza' });
      return;
    }

    rooms.set(roomCode, game);
    socket.join(roomCode);
    socket.roomCode = roomCode;
    socket.playerId = playerId;

    socket.emit('roomCreated', {
      roomCode,
      playerId,
      gameState: game.getGameState(socket.id)
    });

    console.log(`Room ${roomCode} created by ${playerName}`);
  });

  // Join an existing room
  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const game = rooms.get(roomCode.toUpperCase());

    if (!game) {
      socket.emit('error', { message: 'Stanza non trovata' });
      return;
    }

    if (game.gamePhase !== 'waiting') {
      socket.emit('error', { message: 'Partita già in corso' });
      return;
    }

    const playerId = uuidv4();
    const player = game.addPlayer(playerId, playerName, socket.id);

    if (!player) {
      socket.emit('error', { message: 'Stanza piena (max 4 giocatori)' });
      return;
    }

    socket.join(roomCode.toUpperCase());
    socket.roomCode = roomCode.toUpperCase();
    socket.playerId = playerId;

    socket.emit('roomJoined', {
      roomCode: roomCode.toUpperCase(),
      playerId
    });

    broadcastGameState(roomCode.toUpperCase());

    io.to(roomCode.toUpperCase()).emit('notification', {
      type: 'playerJoined',
      message: `${playerName} è entrato nella stanza`
    });

    console.log(`${playerName} joined room ${roomCode.toUpperCase()}`);
  });

  // Player ready
  socket.on('playerReady', () => {
    const game = rooms.get(socket.roomCode);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (player) {
      player.isReady = !player.isReady;
      broadcastGameState(socket.roomCode);

      // Check if game can start
      if (game.canStart()) {
        io.to(socket.roomCode).emit('notification', {
          type: 'info',
          message: 'Tutti pronti! La partita inizierà tra 3 secondi...'
        });

        setTimeout(() => {
          if (game.canStart()) {
            game.startGame();
            broadcastGameState(socket.roomCode);
            io.to(socket.roomCode).emit('notification', {
              type: 'gameStart',
              message: 'La partita è iniziata!'
            });
          }
        }, 3000);
      }
    }
  });

  // Play a card
  socket.on('playCard', ({ cardId, captureChoice }) => {
    const game = rooms.get(socket.roomCode);
    if (!game) return;

    const result = game.playCard(socket.id, cardId, captureChoice);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    broadcastGameState(socket.roomCode);

    // Notify special events
    if (result.isScopa) {
      io.to(socket.roomCode).emit('notification', {
        type: 'scopa',
        message: `${game.lastAction.player} ha fatto SCOPA! 🧹`
      });
    }

    if (result.isAssoPigliaTutto) {
      io.to(socket.roomCode).emit('notification', {
        type: 'assoPigliaTutto',
        message: `${game.lastAction.player} - ASSO PIGLIA TUTTO! 🃏`
      });
    }

    // Check for round/game end
    if (game.gamePhase === 'roundEnd' || game.gamePhase === 'gameEnd') {
      const scores = game.calculateScores();
      io.to(socket.roomCode).emit('roundEnd', {
        scores,
        gamePhase: game.gamePhase
      });

      if (game.gamePhase === 'gameEnd') {
        const winner = game.players.reduce((a, b) =>
          a.totalScore > b.totalScore ? a : b
        );
        io.to(socket.roomCode).emit('gameEnd', {
          winner: winner.name,
          finalScores: scores
        });
      }
    }
  });

  // Declare Tozzolo
  socket.on('declareTozzolo', () => {
    const game = rooms.get(socket.roomCode);
    if (!game) return;

    const result = game.declareTozzolo(socket.id);

    if (!result.success) {
      socket.emit('error', { message: result.error });
      return;
    }

    broadcastGameState(socket.roomCode);

    const tozzoloType = result.tozzolo.type === 'napoli' ? 'NAPOLI (Tris)' : 'BUONGIOCO (Coppia)';
    io.to(socket.roomCode).emit('notification', {
      type: 'tozzolo',
      message: `${game.lastAction.player} ha bussato: ${tozzoloType}! 🎯 (+3 punti)`
    });
  });

  // Next round
  socket.on('nextRound', () => {
    const game = rooms.get(socket.roomCode);
    if (!game || game.gamePhase !== 'roundEnd') return;

    game.nextRound();
    broadcastGameState(socket.roomCode);

    io.to(socket.roomCode).emit('notification', {
      type: 'info',
      message: `Round ${game.roundNumber} iniziato!`
    });
  });

  // Request game state
  socket.on('requestState', () => {
    const game = rooms.get(socket.roomCode);
    if (game) {
      socket.emit('gameState', game.getGameState(socket.id));
    }
  });

  // Get possible captures for a card
  socket.on('getPossibleCaptures', ({ cardId }) => {
    const game = rooms.get(socket.roomCode);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    const card = player.hand.find(c => c.id === cardId);
    if (!card) return;

    const captures = game.findPossibleCaptures(card);
    socket.emit('possibleCaptures', { cardId, captures });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    if (socket.roomCode) {
      const game = rooms.get(socket.roomCode);
      if (game) {
        const player = game.getPlayer(socket.id);
        const playerName = player?.name || 'Un giocatore';

        game.removePlayer(socket.id);

        if (game.players.length === 0) {
          rooms.delete(socket.roomCode);
          console.log(`Room ${socket.roomCode} deleted (empty)`);
        } else {
          broadcastGameState(socket.roomCode);
          io.to(socket.roomCode).emit('notification', {
            type: 'playerLeft',
            message: `${playerName} ha lasciato la partita`
          });

          // If game was in progress, pause it
          if (game.gamePhase === 'playing') {
            game.gamePhase = 'waiting';
            io.to(socket.roomCode).emit('notification', {
              type: 'warning',
              message: 'Partita in pausa: un giocatore è uscito'
            });
          }
        }
      }
    }
  });

  // Chat message
  socket.on('chatMessage', ({ message }) => {
    const game = rooms.get(socket.roomCode);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    io.to(socket.roomCode).emit('chatMessage', {
      playerName: player.name,
      message: message.substring(0, 200) // Limit message length
    });
  });


  // Send Emoji
  // Inside io.on('connection', (socket) => { ... })

  socket.on('sendEmote', ({ emoji }) => {
    const game = rooms.get(socket.roomCode);
    if (!game) return;

    const player = game.getPlayer(socket.id);
    if (!player) return;

    io.to(socket.roomCode).emit('playerEmote', {
      playerId: socket.id,
      playerName: player.name,
      emoji
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🃏 Tuzzilicchio server running on port ${PORT}`);
  console.log(`   Open http://localhost:${PORT} to play`);
});
