const cluster = require('cluster');
const os = require('os');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { TuzzilicchioGame } = require('./gameLogic');

// High Availability: Supervisor Pattern
// We use a single worker to maintain in-memory state consistency,
// but the master process monitors it and restarts it if it crashes.
if (cluster.isPrimary) {
  console.log(`Master process ${process.pid} is running`);

  // Fork a single worker to handle traffic and game state
  cluster.fork();

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Starting a new one...`);
    cluster.fork();
  });
} else {
  // Worker process
  startServer();
}

function startServer() {
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

    // --- Persistence Helpers ---
    const DISCONNECT_TIMEOUT = 120000; // 2 minutes grace period

    const getRoomByPlayerSession = (sessionId) => {
      for (const [code, game] of rooms.entries()) {
        const player = game.players.find(p => p.sessionId === sessionId);
        if (player) return { game, player, code };
      }
      return null;
    };

    // Create a new room
    socket.on('createRoom', ({ playerName, sessionId }) => {
      const roomCode = generateRoomCode();
      const game = new TuzzilicchioGame(roomCode);
      const playerId = uuidv4(); // This is the player's unique ID for the game

      const player = game.addPlayer(playerId, playerName, socket.id, sessionId);
      if (!player) {
        socket.emit('error', { message: 'Impossibile creare la stanza' });
        return;
      }

      rooms.set(roomCode, game);
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.playerId = playerId; // Store the game's playerId on the socket

      socket.emit('roomCreated', {
        roomCode,
        playerId,
        gameState: game.getGameState(socket.id)
      });

      console.log(`Room ${roomCode} created by ${playerName}`);
    });

    // Join an existing room
    socket.on('joinRoom', ({ roomCode, playerName, sessionId }) => {
      const game = rooms.get(roomCode.toUpperCase());

      if (!game) {
        socket.emit('error', { message: 'Stanza non trovata' });
        return;
      }

      // Check if THIS session is already in the room (Reconnection)
      const existingPlayer = game.players.find(p => p.sessionId === sessionId);
      if (existingPlayer) {
        // It's a reconnection!
        if (existingPlayer.disconnectTimeout) {
          clearTimeout(existingPlayer.disconnectTimeout); // Cancel deletion
          delete existingPlayer.disconnectTimeout;
        }
        existingPlayer.socketId = socket.id; // Update socket
        existingPlayer.disconnected = false;

        socket.join(roomCode.toUpperCase());
        socket.roomCode = roomCode.toUpperCase();
        socket.playerId = existingPlayer.id; // Store the game's playerId on the socket

        socket.emit('roomJoined', {
          roomCode: roomCode.toUpperCase(),
          playerId: existingPlayer.id,
          gameState: game.getGameState(socket.id)
        });
        broadcastGameState(roomCode.toUpperCase());
        console.log(`Player ${playerName} (session ${sessionId}) reconnected to ${roomCode.toUpperCase()}`);
        return;
      }

      if (game.gamePhase !== 'waiting') {
        socket.emit('error', { message: 'Partita già in corso' });
        return;
      }

      const playerId = uuidv4();
      const player = game.addPlayer(playerId, playerName, socket.id, sessionId);

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

    socket.on('reconnectAttempt', ({ sessionId }) => {
      const found = getRoomByPlayerSession(sessionId);
      if (found) {
        const { game, player, code } = found;

        // Cancel timeout
        if (player.disconnectTimeout) {
          clearTimeout(player.disconnectTimeout);
          delete player.disconnectTimeout;
        }

        player.socketId = socket.id;
        player.disconnected = false;
        socket.join(code);
        socket.roomCode = code;
        socket.playerId = player.id; // Store the game's playerId on the socket

        socket.emit('reconnected', {
          roomCode: code,
          playerId: player.id,
          gameState: game.getGameState(socket.id)
        });
        broadcastGameState(code);
        console.log(`Session ${sessionId} auto-reconnected to ${code}`);
      } else {
        socket.emit('sessionExpired');
      }
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
    console.log(`   Worker ${process.pid} started`);
  });
}
