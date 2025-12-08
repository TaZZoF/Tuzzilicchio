// Tuzzilicchio - Game Logic
// Basato sulla Scopa napoletana con varianti speciali
// VERSIONE 2.0 - Refactoring completo logica presa con priorità corrette

const SUITS = ['denari', 'coppe', 'bastoni', 'spade'];
const VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 8=Fante, 9=Cavallo, 10=Re
const SUIT_COLORS = {
  denari: '#FFD700',
  coppe: '#DC143C',
  bastoni: '#228B22',
  spade: '#4169E1'
};

// Mappatura semi per codice immagine
const SUIT_CODES = {
  denari: 'D',
  coppe: 'C',
  bastoni: 'B',
  spade: 'S'
};

// Valori per la Primiera
const PRIMIERA_VALUES = {
  7: 21,
  6: 18,
  1: 16, // Asso
  5: 15,
  4: 14,
  3: 13,
  2: 12,
  8: 10, // Fante
  9: 10, // Cavallo
  10: 10 // Re
};

class Card {
  constructor(value, suit) {
    this.value = value;
    this.suit = suit;
    this.id = `${value}_${suit}`;
    this.imageCode = `${value}${SUIT_CODES[suit]}`;
  }

  getDisplayName() {
    const names = { 1: 'A', 8: 'F', 9: 'C', 10: 'R' };
    return names[this.value] || this.value.toString();
  }

  getImagePath() {
    return `/assets/cards/${this.imageCode}.jpg`;
  }
}

class Deck {
  constructor() {
    this.cards = [];
    this.reset();
  }

  reset() {
    this.cards = [];
    for (const suit of SUITS) {
      for (const value of VALUES) {
        this.cards.push(new Card(value, suit));
      }
    }
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  draw(count = 1) {
    return this.cards.splice(0, count);
  }

  isEmpty() {
    return this.cards.length === 0;
  }

  remaining() {
    return this.cards.length;
  }
}

class Player {
  constructor(id, name, socketId, sessionId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.sessionId = sessionId; // Store persistent session ID
    this.hand = [];
    this.captures = [];
    this.scope = 0;
    this.tozzoli = [];
    this.totalScore = 0;
    this.isReady = false;
    this.hasKnockedThisHand = false;
  }

  reset() {
    this.hand = [];
    this.captures = [];
    this.scope = 0;
    this.tozzoli = [];
    this.hasKnockedThisHand = false;
  }

  resetHandFlags() {
    this.hasKnockedThisHand = false;
  }

  addToHand(cards) {
    this.hand.push(...cards);
  }

  removeFromHand(cardId) {
    const index = this.hand.findIndex(c => c.id === cardId);
    if (index !== -1) {
      return this.hand.splice(index, 1)[0];
    }
    return null;
  }

  addCaptures(cards) {
    this.captures.push(...cards);
  }

  hasHandEmpty() {
    return this.hand.length === 0;
  }
}

class TuzzilicchioGame {
  constructor(roomId) {
    this.roomId = roomId;
    this.players = [];
    this.deck = new Deck();
    this.table = [];
    this.currentPlayerIndex = 0;
    this.lastCapturePlayerIndex = null;
    this.gamePhase = 'waiting';
    this.targetScore = 31;
    this.roundNumber = 0;
    this.lastAction = null;
    this.isLastHand = false;

    // NUOVO: Rotazione mazziere
    this.dealerIndex = 0;
  }

  addPlayer(id, name, socketId, sessionId) {
    if (this.players.length >= 4) return null;
    if (this.gamePhase !== 'waiting') return null;

    const player = new Player(id, name, socketId, sessionId);
    this.players.push(player);
    return player;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      this.players.splice(index, 1);
      // Aggiusta dealerIndex se necessario
      if (this.dealerIndex >= this.players.length) {
        this.dealerIndex = 0;
      }
      return true;
    }
    return false;
  }

  getPlayer(socketId) {
    return this.players.find(p => p.socketId === socketId);
  }

  canStart() {
    return this.players.length >= 2 && this.players.every(p => p.isReady);
  }

  startGame() {
    if (!this.canStart()) return false;

    this.roundNumber = 1;
    this.dealerIndex = 0; // Primo mazziere è il primo giocatore
    this.startRound();
    return true;
  }

  startRound() {
    // Reset per nuovo round
    this.deck.reset();
    this.deck.shuffle();
    this.table = [];
    this.lastCapturePlayerIndex = null;
    this.isLastHand = false;

    this.players.forEach(p => p.reset());

    // Distribuisci 4 carte a terra
    this.table = this.deck.draw(4);

    // Controlla se ci sono 3+ Re a terra (ridistribuisci)
    let reCount = this.table.filter(c => c.value === 10).length;
    while (reCount >= 3) {
      this.deck.reset();
      this.deck.shuffle();
      this.table = this.deck.draw(4);
      reCount = this.table.filter(c => c.value === 10).length;
    }

    // Distribuisci 3 carte a ogni giocatore
    this.dealCards();

    this.gamePhase = 'playing';

    // Il primo a giocare è quello alla destra del mazziere (successivo in senso orario)
    this.currentPlayerIndex = (this.dealerIndex + 1) % this.players.length;
  }

  dealCards() {
    if (this.deck.isEmpty()) {
      this.isLastHand = true;
      return false;
    }

    // Resetta i flag Tozzolo per la nuova mano
    for (const player of this.players) {
      player.resetHandFlags();
      const cards = this.deck.draw(3);
      player.addToHand(cards);
    }

    if (this.deck.isEmpty()) {
      this.isLastHand = true;
    }

    return true;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getDealer() {
    return this.players[this.dealerIndex];
  }

  // ========================================
  // REFACTORING COMPLETO: LOGICA DI PRESA
  // Gerarchia di Priorità:
  // A) Presa Diretta (stesso valore)
  // B) Accoppia 11 (Ciapachinze) - include combinazioni multiple
  // C) Asso Piglia Tutto (solo se non si applica A o B)
  // ========================================

  findPossibleCaptures(card) {
    const captures = [];

    // ========================================
    // PRIORITÀ A: Presa Diretta (stesso valore)
    // ========================================
    const directMatches = this.table.filter(c => c.value === card.value);
    for (const match of directMatches) {
      captures.push({
        type: 'direct',
        priority: 'A',
        cards: [match],
        description: `Presa diretta: ${card.value}`
      });
    }

    // ========================================
    // PRIORITÀ B: Accoppia 11 (Ciapachinze)
    // Trova TUTTE le combinazioni di carte sul tavolo che
    // sommate alla carta giocata danno 11
    // ========================================
    const elevenCaptures = this.findElevenCaptures(card);
    captures.push(...elevenCaptures);

    // ========================================
    // Presa per somma classica (carta giocata = somma carte tavolo)
    // ========================================
    const sumCaptures = this.findSumCaptures(card);
    captures.push(...sumCaptures);

    // ========================================
    // PRIORITÀ C: Asso Piglia Tutto
    // Solo se la carta è un Asso E non ci sono prese dirette o Accoppia 11
    // IMPORTANTE: Se l'Asso può prendere un Re con Accoppia 11 (1+10=11),
    // quella ha la precedenza e FA SCOPA se svuota il tavolo
    // ========================================
    if (card.value === 1 && this.table.length > 0) {
      // Controlla se c'è già una presa Accoppia 11 disponibile per l'Asso
      const hasElevenCapture = captures.some(c => c.type === 'accoppia11');

      // Asso Piglia Tutto è sempre un'opzione, ma con priorità minore
      captures.push({
        type: 'assoPigliaTutto',
        priority: 'C',
        cards: [...this.table],
        description: 'Asso Piglia Tutto (no scopa)',
        // Flag per indicare se ci sono alternative migliori
        hasElevenAlternative: hasElevenCapture
      });
    }

    return captures;
  }

  // Trova tutte le combinazioni per Accoppia 11
  findElevenCaptures(card) {
    const captures = [];
    const target = 11 - card.value;

    if (target <= 0 || target > 30) return captures; // Impossibile raggiungere 11

    // Trova tutte le combinazioni di carte che sommano a (11 - valore carta giocata)
    const findCombinations = (remaining, current, sum) => {
      if (sum === target && current.length >= 1) {
        captures.push({
          type: 'accoppia11',
          priority: 'B',
          cards: [...current],
          description: `Accoppia 11: ${card.value} + ${current.map(c => c.value).join('+')} = 11`
        });
        return;
      }
      if (sum > target || remaining.length === 0) return;

      for (let i = 0; i < remaining.length; i++) {
        findCombinations(
          remaining.slice(i + 1),
          [...current, remaining[i]],
          sum + remaining[i].value
        );
      }
    };

    findCombinations(this.table, [], 0);

    // Rimuovi duplicati (stesse carte in ordine diverso)
    const unique = [];
    const seen = new Set();
    for (const cap of captures) {
      const key = cap.cards.map(c => c.id).sort().join(',');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(cap);
      }
    }

    return unique;
  }

  // Presa per somma classica (valore carta = somma carte tavolo)
  findSumCaptures(card) {
    const captures = [];
    const target = card.value;

    const findCombinations = (remaining, current, sum) => {
      if (sum === target && current.length >= 2) {
        captures.push({
          type: 'sum',
          priority: 'A', // Stessa priorità della presa diretta
          cards: [...current],
          description: `Somma: ${current.map(c => c.value).join('+')} = ${target}`
        });
        return;
      }
      if (sum >= target || remaining.length === 0) return;

      for (let i = 0; i < remaining.length; i++) {
        findCombinations(
          remaining.slice(i + 1),
          [...current, remaining[i]],
          sum + remaining[i].value
        );
      }
    };

    findCombinations(this.table, [], 0);

    // Rimuovi duplicati
    const unique = [];
    const seen = new Set();
    for (const cap of captures) {
      const key = cap.cards.map(c => c.id).sort().join(',');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(cap);
      }
    }

    return unique;
  }

  // Controlla se il giocatore ha un Tozzolo
  checkTozzolo(player) {
    const specialCards = player.hand.filter(c => [1, 2, 3].includes(c.value));

    if (specialCards.length < 2) return null;

    // Controlla coppie e tris per stesso valore
    for (const value of [1, 2, 3]) {
      const sameValue = specialCards.filter(c => c.value === value);
      if (sameValue.length >= 3) {
        return { type: 'napoli', cards: sameValue.slice(0, 3), match: 'value', value };
      }
      if (sameValue.length >= 2) {
        return { type: 'buongioco', cards: sameValue.slice(0, 2), match: 'value', value };
      }
    }

    // Controlla coppie e tris per stesso seme
    for (const suit of SUITS) {
      const sameSuit = specialCards.filter(c => c.suit === suit);
      if (sameSuit.length >= 3) {
        return { type: 'napoli', cards: sameSuit.slice(0, 3), match: 'suit', suit };
      }
      if (sameSuit.length >= 2) {
        return { type: 'buongioco', cards: sameSuit.slice(0, 2), match: 'suit', suit };
      }
    }

    return null;
  }

  // Esegui il Tozzolo (bussata)
  declareTozzolo(socketId) {
    const player = this.getPlayer(socketId);
    if (!player) return { success: false, error: 'Giocatore non trovato' };

    if (player.hasKnockedThisHand) {
      return { success: false, error: 'Hai già bussato in questa mano!' };
    }

    const tozzolo = this.checkTozzolo(player);
    if (!tozzolo) return { success: false, error: 'Nessun Tozzolo valido' };

    player.hasKnockedThisHand = true;
    player.tozzoli.push(tozzolo);

    this.lastAction = {
      type: 'tozzolo',
      player: player.name,
      playerId: player.socketId,
      tozzolo: tozzolo
    };

    return { success: true, tozzolo };
  }

  // ========================================
  // GIOCA UNA CARTA - Logica principale aggiornata
  // ========================================
  playCard(socketId, cardId, captureChoice = null) {
    const player = this.getPlayer(socketId);
    if (!player) return { success: false, error: 'Giocatore non trovato' };

    if (this.getCurrentPlayer().socketId !== socketId) {
      return { success: false, error: 'Non è il tuo turno' };
    }

    const card = player.removeFromHand(cardId);
    if (!card) return { success: false, error: 'Carta non trovata' };

    const possibleCaptures = this.findPossibleCaptures(card);
    let captured = [];
    let isScopa = false;
    let isAssoPigliaTutto = false;
    let isAccoppia11 = false;
    let assoOnEmptyTable = false;
    let captureType = null;

    // ========================================
    // CASO SPECIALE: Asso su tavolo vuoto
    // ========================================
    if (card.value === 1 && this.table.length === 0) {
      player.addCaptures([card]);
      this.lastCapturePlayerIndex = this.currentPlayerIndex;
      assoOnEmptyTable = true;
      captureType = 'assoOnEmptyTable';
    }
    // ========================================
    // CASO: Ci sono possibili prese
    // ========================================
    else if (possibleCaptures.length > 0) {
      let chosenCapture;

      if (captureChoice !== null && captureChoice < possibleCaptures.length) {
        // Giocatore ha scelto quale presa fare
        chosenCapture = possibleCaptures[captureChoice];
      } else {
        // Selezione automatica basata su priorità
        // Priorità: A (diretta/somma) > B (accoppia 11) > C (asso piglia tutto)
        chosenCapture =
          possibleCaptures.find(c => c.priority === 'A') ||
          possibleCaptures.find(c => c.priority === 'B') ||
          possibleCaptures.find(c => c.priority === 'C') ||
          possibleCaptures[0];
      }

      captured = chosenCapture.cards;
      captureType = chosenCapture.type;
      isAssoPigliaTutto = chosenCapture.type === 'assoPigliaTutto';
      isAccoppia11 = chosenCapture.type === 'accoppia11';

      // Rimuovi le carte catturate dal tavolo
      for (const cap of captured) {
        const idx = this.table.findIndex(c => c.id === cap.id);
        if (idx !== -1) this.table.splice(idx, 1);
      }

      // Aggiungi carta giocata + catture al mazzetto
      player.addCaptures([card, ...captured]);
      this.lastCapturePlayerIndex = this.currentPlayerIndex;

      // ========================================
      // CALCOLO SCOPA
      // Scopa se: tavolo vuoto DOPO la presa
      // ECCEZIONE: Asso Piglia Tutto NON fa mai scopa
      // NOTA: Accoppia 11 (anche con Asso) FA scopa se svuota il tavolo
      // ========================================
      if (this.table.length === 0) {
        if (isAssoPigliaTutto) {
          // Asso Piglia Tutto: NO SCOPA
          isScopa = false;
        } else {
          // Tutte le altre prese (inclusa Accoppia 11 con Asso): SÌ SCOPA
          isScopa = true;
          player.scope++;
        }
      }
    }
    // ========================================
    // CASO: Nessuna presa possibile
    // ========================================
    else {
      this.table.push(card);
      captureType = 'none';
    }

    this.lastAction = {
      type: 'play',
      player: player.name,
      playerId: player.socketId,
      card: card,
      captured: captured,
      captureType: captureType,
      isScopa: isScopa,
      isAssoPigliaTutto: isAssoPigliaTutto,
      isAccoppia11: isAccoppia11,
      assoOnEmptyTable: assoOnEmptyTable
    };

    // Prossimo turno
    this.nextTurn();

    return {
      success: true,
      card,
      captured,
      captureType,
      isScopa,
      isAssoPigliaTutto,
      isAccoppia11,
      assoOnEmptyTable,
      possibleCaptures
    };
  }

  allHandsEmpty() {
    return this.players.every(p => p.hasHandEmpty());
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    if (this.allHandsEmpty()) {
      if (this.deck.isEmpty()) {
        // Fine round - le carte rimanenti vanno all'ultimo che ha preso
        if (this.lastCapturePlayerIndex !== null && this.table.length > 0) {
          this.players[this.lastCapturePlayerIndex].addCaptures(this.table);
          this.table = [];
        }
        this.endRound();
      } else {
        // Distribuisci nuove carte
        this.dealCards();
      }
    }
  }

  endRound() {
    this.gamePhase = 'roundEnd';
    const scores = this.calculateScores();

    // Aggiorna punteggi totali
    for (const player of this.players) {
      const playerScore = scores.find(s => s.playerId === player.id);
      if (playerScore) {
        player.totalScore += playerScore.roundTotal;
      }
    }

    // Controlla vittoria
    const winner = this.players.find(p => p.totalScore >= this.targetScore);
    if (winner) {
      this.gamePhase = 'gameEnd';
      return { scores, winner };
    }

    return { scores, winner: null };
  }

  calculateScores() {
    const scores = this.players.map(player => {
      const score = {
        playerId: player.id,
        playerName: player.name,
        scope: player.scope,
        tozzoli: player.tozzoli.length,
        tozzoliPoints: player.tozzoli.length * 3,
        cards: player.captures.length,
        denari: player.captures.filter(c => c.suit === 'denari').length,
        settebello: player.captures.some(c => c.value === 7 && c.suit === 'denari'),
        primiera: this.calculatePrimiera(player.captures),
        roundTotal: 0,
        totalScore: player.totalScore
      };
      return score;
    });

    // Assegna punti per carte (>20)
    scores.forEach(s => {
      s.cardsPoint = s.cards > 20 ? 1 : 0;
    });

    // Assegna punti per denari (>5)
    scores.forEach(s => {
      s.denariPoint = s.denari > 5 ? 1 : 0;
    });

    // Assegna punto settebello
    scores.forEach(s => {
      s.settebelloPoint = s.settebello ? 1 : 0;
    });

    // Assegna punto primiera
    const maxPrimiera = Math.max(...scores.map(s => s.primiera));
    const primieraWinners = scores.filter(s => s.primiera === maxPrimiera);
    scores.forEach(s => {
      s.primieraPoint = (primieraWinners.length === 1 && s.primiera === maxPrimiera) ? 1 : 0;
    });

    // Calcola totale round
    scores.forEach(s => {
      s.roundTotal = s.scope + s.tozzoliPoints + s.cardsPoint +
        s.denariPoint + s.settebelloPoint + s.primieraPoint;
    });

    return scores;
  }

  calculatePrimiera(captures) {
    const bestBySuit = {};

    for (const card of captures) {
      const value = PRIMIERA_VALUES[card.value];
      if (!bestBySuit[card.suit] || value > bestBySuit[card.suit]) {
        bestBySuit[card.suit] = value;
      }
    }

    if (Object.keys(bestBySuit).length < 4) return 0;

    return Object.values(bestBySuit).reduce((a, b) => a + b, 0);
  }

  // ========================================
  // PROSSIMO ROUND - Con rotazione mazziere
  // ========================================
  nextRound() {
    this.roundNumber++;

    // Rotazione mazziere: passa al giocatore successivo
    this.dealerIndex = (this.dealerIndex + 1) % this.players.length;

    this.startRound();
  }

  getGameState(forSocketId = null) {
    const currentPlayer = this.getCurrentPlayer();
    const dealer = this.getDealer();
    const requestingPlayer = forSocketId ? this.getPlayer(forSocketId) : null;

    return {
      roomId: this.roomId,
      gamePhase: this.gamePhase,
      roundNumber: this.roundNumber,
      currentPlayerId: currentPlayer?.socketId,
      currentPlayerName: currentPlayer?.name,
      dealerId: dealer?.socketId,
      dealerName: dealer?.name,
      table: this.table,
      deckRemaining: this.deck.remaining(),
      isLastHand: this.isLastHand,
      lastAction: this.lastAction,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        socketId: p.socketId,
        handCount: p.hand.length,
        captureCount: p.captures.length,
        scope: p.scope,
        tozzoli: p.tozzoli.length, // Visibile a tutti (dichiarazione pubblica)
        totalScore: p.totalScore,
        isReady: p.isReady,
        isDealer: p.socketId === dealer?.socketId,
        // Mostra le carte solo al proprietario
        hand: p.socketId === forSocketId ? p.hand : [],
        hasTozzolo: this.checkTozzolo(p) !== null,
        hasKnockedThisHand: p.hasKnockedThisHand,
        canKnock: this.checkTozzolo(p) !== null && !p.hasKnockedThisHand
      })),
      possibleCaptures: requestingPlayer && currentPlayer?.socketId === forSocketId ?
        this.getPossibleCapturesForHand(requestingPlayer) : {}
    };
  }

  getPossibleCapturesForHand(player) {
    const captures = {};
    for (const card of player.hand) {
      captures[card.id] = this.findPossibleCaptures(card);
    }
    return captures;
  }
}

module.exports = { TuzzilicchioGame, Card, Deck, Player, SUITS, VALUES, SUIT_COLORS };
