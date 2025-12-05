# 🃏 Tuzzilicchio - Gioco di Carte Multiplayer

Un gioco di carte web-based basato sulla Scopa napoletana con varianti speciali, sviluppato con Node.js, Express, Socket.io e React.

![Tuzzilicchio](https://img.shields.io/badge/Game-Tuzzilicchio-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 📋 Indice

- [Caratteristiche](#-caratteristiche)
- [Regole del Gioco](#-regole-del-gioco)
- [Installazione](#-installazione)
- [Avvio](#-avvio)
- [Struttura del Progetto](#-struttura-del-progetto)

## ✨ Caratteristiche

- **Multiplayer Real-time**: 2-4 giocatori tramite Socket.io
- **Lobby System**: Crea o unisciti a stanze con codice
- **UI Responsive**: Funziona su desktop e mobile
- **Animazioni Fluide**: Distribuzione carte e notifiche
- **Regole Complete**: Scopa + varianti Tuzzilicchio

## 🎴 Regole del Gioco

### Mazzo
- 40 carte napoletane (Coppe, Denari, Bastoni, Spade)
- Valori: 1-7, Fante(8), Cavallo(9), Re(10)

### Setup
- 2-4 giocatori
- 3 carte a testa, 4 sul tavolo
- Nuove 3 carte quando si esauriscono

### Meccaniche di Presa

#### Presa Classica
- Prendi una carta con lo stesso valore
- Prendi carte che sommano al valore giocato

#### Asso Piglia Tutto 🃏
- L'Asso prende TUTTE le carte dal tavolo
- Se il tavolo è vuoto, l'Asso non prende nulla

#### Accoppia 11 (Ciapachinze) 🎯
- Puoi prendere una carta se insieme sommano 11
- Es: giochi 4 → prendi 7

#### Scopa 🧹
- Pulire il tavolo = 1 punto
- (Non conta se l'Asso pulisce all'ultima mano)

### Tozzolo - La Meccanica Speciale! 👊

**Trigger**: Avere in mano una combinazione di Asso, Due, Tre

- **Buongioco**: Coppia stesso valore O stesso seme
- **Napoli**: Tris stesso valore O stesso seme

**Azione**: Clicca "Bussa per Tozzolo!" per dichiararlo

**Valore**: Ogni Tozzolo = **+3 punti**

### Punteggio Fine Round

| Categoria | Punti |
|-----------|-------|
| Scope | 1 ciascuna |
| Carte (>20) | 1 |
| Denari (>5) | 1 |
| Settebello (7♦) | 1 |
| Primiera (migliore) | 1 |
| Tozzoli | 3 ciascuno |

**Vittoria**: Primo a raggiungere **31 punti**

## 🚀 Installazione

### Prerequisiti
- Node.js 18+ oppure Docker

### Metodo 1: Node.js

```bash
# Clona il repository
git clone <repo-url>
cd tuzzilicchio

# Installa dipendenze
npm install

# Avvia il server
npm start
```

### Metodo 2: Docker

```bash
# Build e avvio con Docker Compose
docker-compose up --build

# Oppure in background
docker-compose up -d --build
```

## 🎮 Avvio

1. Apri il browser su `http://localhost:3000`
2. Inserisci il tuo nome
3. **Crea** una nuova stanza o **Unisciti** con un codice
4. Aspetta altri giocatori (min 2)
5. Tutti cliccano "Sono Pronto!"
6. Gioca! 🎴

## 📁 Struttura del Progetto

```
tuzzilicchio/
├── docker-compose.yml      # Configurazione Docker
├── Dockerfile              # Immagine Docker
├── package.json            # Dipendenze Node.js
├── README.md               # Questa documentazione
├── server/
│   ├── index.js            # Server Express + Socket.io
│   └── gameLogic.js        # Logica del gioco completa
└── public/
    └── index.html          # Frontend React (SPA)
```

### Componenti Principali

#### Backend (`server/`)

**`gameLogic.js`**
- `TuzzilicchioGame`: Classe principale del gioco
- `Player`: Gestione giocatori
- `Deck`: Mazzo e distribuzione
- `Card`: Rappresentazione carte

**`index.js`**
- Server Express per file statici
- Socket.io per real-time
- Gestione stanze e eventi

#### Frontend (`public/index.html`)

Componenti React:
- `Lobby`: Creazione/join stanze
- `WaitingRoom`: Attesa giocatori
- `GameTable`: Tavolo da gioco principale
- `Card`: Visualizzazione carta
- `RoundEnd`: Punteggi fine round

## 🔧 Configurazione

### Variabili d'Ambiente

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `PORT` | 3000 | Porta del server |
| `NODE_ENV` | development | Ambiente |

### Personalizzazione

Per usare immagini delle carte reali, posizionale in:
```
public/assets/cards/1_denari.png
public/assets/cards/2_coppe.png
...
```

## 🐛 Troubleshooting

### Il gioco non si avvia
- Verifica che la porta 3000 sia libera
- Controlla i log: `docker-compose logs`

### Disconnessioni frequenti
- Verifica la connessione di rete
- Il server mantiene lo stato per riconnessioni

### Carte non si vedono
- Pulisci la cache del browser
- Ricarica la pagina (F5)

## 📝 Note di Sviluppo

### Sincronizzazione Stati
- Il server è l'unica fonte di verità
- Ogni azione viene validata server-side
- Lo stato viene broadcast a tutti i client

### Anti-Cheat
- Le carte in mano sono visibili solo al proprietario
- Le mosse vengono validate lato server
- Nessun dato sensibile esposto al client

## 📄 Licenza

MIT License - Usa liberamente questo progetto!

---

**Buon divertimento con Tuzzilicchio!** 🃏🎴🧹
