# 🃏 Tuzzilicchio - Multiplayer Card Game

A web-based card game based on the Neapolitan "Scopa" with special variants, developed using Node.js, Express, Socket.io, and React.

![Tuzzilicchio](https://img.shields.io/badge/Game-Tuzzilicchio-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Game Rules](#-game-rules)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)

## ✨ Features

- **Real-time Multiplayer**: 2-4 players via Socket.io
- **High Availability**: Auto-recovery using Node.js Cluster (Single-worker Supervisor)
- **Modern UI/UX**: optimized for mobile and desktop
- **Optimized Assets**: WebP card images for fast loading
- **Lobby System**: Create or join rooms with a code
- **Smooth Animations**: Card dealing, playing, and capturing
- **Complete Rules**: Standard Scopa + Tuzzilicchio variants

## 🎴 Game Rules

### Deck
- 40 Neapolitan cards (Cups, Coins, Clubs, Swords)
- Values: 1-7, Knave(8), Knight(9), King(10)

### Setup
- 2-4 players
- 3 cards each, 4 on the table at start
- Deal 3 more cards when hands are empty

### Capture Mechanics

#### Classic Capture
- Take a card of the same value
- Take multiple cards that sum up to the played card's value

#### Asso Piglia Tutto (Ace Takes All) 🃏
- Playing an Ace takes ALL cards on the table
- If the table is empty, the Ace takes nothing

#### Accoppia 11 (Pair 11 / Ciapachinze) 🎯
- You can capture a card if the sum of your card and the table card is 11
- E.g., Play 4 → Capture 7

#### Scopa 🧹
- Clearing the table awards 1 point
- (Does not count if captured by Ace in the last hand)

### Tozzolo - Special Mechanic! 👊

**Trigger**: Holding a combination of Ace, Two, and Three in hand.

- **Buongioco**: Pair of same value OR same suit
- **Napoli**: Three of same value OR same suit

**Action**: Click "Bussa per Tozzolo!" (Knock for Tozzolo) to declare it.

**Value**: Each Tozzolo declared = **+3 points**

### End of Round Scoring

| Category | Points |
|-----------|-------|
| Scopa (Sweep) | 1 each |
| Cards (>20) | 1 |
| Coins (Denari) (>5) | 1 |
| Settebello (7♦) | 1 |
| Primiera (Best prime) | 1 |
| Tozzoli | 3 each |

**Victory**: First player to reach **31 points**.

## 🚀 Installation

### Prerequisites
- Node.js 18+ or Docker

### Method 1: Node.js

```bash
# Clone the repository
git clone <repo-url>
cd tuzzilicchio

# Install dependencies
npm install

# Start the server
npm start
```

### Method 2: Docker

```bash
# Build and start with Docker Compose
docker-compose up --build

# Or in background
docker-compose up -d --build
```

## 🎮 Usage

1. Open your browser at `http://localhost:3000`
2. Enter your name
3. **Create** a new room or **Join** one with a code
4. Wait for other players (min 2)
5. Everyone clicks "Ready!"
6. Enjoy the game! 🎴

## 📁 Project Structure

```
tuzzilicchio/
├── docker-compose.yml      # Docker Configuration
├── Dockerfile              # Docker Image
├── package.json            # Node.js Dependencies
├── README.md               # Documentation
├── server/
│   ├── index.js            # Server Entry (HA Supervisor)
│   └── gameLogic.js        # Core Game Logic
└── public/
    ├── index.html          # HTML Entry Point
    ├── css/
    │   └── style.css       # External Stylesheet with Modern UI
    ├── js/
    │   └── app.js          # React Application Logic
    └── assets/
        └── cards/          # WebP Card Images
```

### Main Components

#### Backend (`server/`)

**`gameLogic.js`**
- `TuzzilicchioGame`: Main game class
- `Player`: Player management
- `Deck`: Deck management and shuffling
- `Card`: Card representation

**`index.js`**
- Express server for static files
- Socket.io for real-time events
- **Cluster Implementation**: Monitors worker process and restarts on failure
- Room and event management

#### Frontend (`public/`)

- **`css/style.css`**: Contains all styling, animations, and responsive design rules.
- **`js/app.js`**: Contains the React code (Lobby, GameTable, WaitingRoom, Logic).
- **`index.html`**: Clean entry point linking CSS and JS.

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|-----------|---------|-------------|
| `PORT` | 3000 | Server Port |
| `NODE_ENV` | development | Environment |

### Customization

To use custom card images, place them in:
```
public/assets/cards/1D.webp
public/assets/cards/2C.webp
...
```
(Using value + Suit Initial: D=Denari, C=Coppe, B=Bastoni, S=Spade)

## 🐛 Troubleshooting

### Game doesn't start
- Check if port 3000 is free
- Check logs: `docker-compose logs`

### Frequent Disconnections
- Check network connection
- Server maintains state for reconnections (unless critical crash reshuffles worker)

### Cards not visible
- Clear browser cache
- Reload (F5)

## 📝 Development Notes

### State Synchronization
- Server is the single source of truth
- Every action is validated server-side
- State is broadcast to all clients

### High Availability
- The server uses the Node.js `cluster` module.
- The Primary process acts as a supervisor.
- A single Worker process handles game logic.
- If the Worker crashes, it is automatically restarted to ensure service continuity (Note: in-memory state is reset on crash in this version).

## 📄 License

MIT License - Free to use!

---

**Have fun with Tuzzilicchio!** 🃏🎴🧹
