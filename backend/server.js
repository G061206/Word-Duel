const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for MVP
        methods: ["GET", "POST"]
    }
});

// Configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' });

// Game State Storage
// rooms[roomCode] = {
//   hostId: socketId,
//   guestId: socketId,
//   wordList: [{ word, definition }],
//   gameState: {
//     [hostId]: { pressure: [], hand: [] },
//     [guestId]: { pressure: [], hand: [] }
//   },
//   status: 'waiting' | 'playing' | 'finished'
// }
const rooms = {};

// Helper to generate 4-digit room code
function generateRoomCode() {
    let code = '';
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (rooms[code]);
    return code;
}

// Helper to get random item from array
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Helper: Generate options for a word
function generateOptions(connectWord, fullList) {
    const correct = connectWord.definition;
    const options = [correct];
    while (options.length < 4) {
        const randomDef = getRandomItem(fullList).definition;
        if (!options.includes(randomDef)) {
            options.push(randomDef);
        }
    }
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
}

// Socket.IO Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Host: Create Room
    socket.on('create_room', () => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = {
            hostId: socket.id,
            guestId: null,
            wordList: [],
            gameState: {},
            status: 'waiting'
        };
        socket.join(roomCode);
        socket.emit('room_created', { roomCode });
        console.log(`Room ${roomCode} created by ${socket.id}`);
    });

    // Guest: Join Room
    socket.on('join_room', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.status === 'waiting' && !room.guestId) {
            room.guestId = socket.id;
            socket.join(roomCode);
            io.to(roomCode).emit('player_joined', { message: 'Guest joined!' });
            console.log(`User ${socket.id} joined room ${roomCode}`);
        } else {
            socket.emit('error', { message: 'Room not found or full' });
        }
    });

    // Host: Upload CSV
    // Note: File parsing happens via HTTP endpoint usually, but we need to link it to the room.
    // We'll use a specific event or simple binary transfer if small, but let's stick to the plan:
    // "Upload .csv file". We will handle this via an HTTP route that returns the parsed data or stores it in the room.
    // For simplicity given it's a socket app, we might just upload via HTTP and pass roomCode.

    // Host: Start Game
    socket.on('start_game', (roomCode) => {
        const room = rooms[roomCode];
        if (room && room.hostId === socket.id && room.guestId && room.wordList.length > 0) {
            room.status = 'playing';

            // Initialize State
            room.gameState = {
                [room.hostId]: { pressure: [], hand: [] },
                [room.guestId]: { pressure: [], hand: [] }
            };

            // Helper to draw cards
            const drawCards = (count) => {
                const drawn = [];
                for (let i = 0; i < count; i++) {
                    drawn.push(getRandomItem(room.wordList));
                }
                return drawn;
            };

            // Give initial "pressure" (1 word to answer) to avoid deadlock?
            // Plan says: "System automatically puts 1 initial question into both pressure slots"
            const initQ_Host = getRandomItem(room.wordList);
            const initQ_Guest = getRandomItem(room.wordList);

            room.gameState[room.hostId].pressure.push(initQ_Host);
            room.gameState[room.guestId].pressure.push(initQ_Guest);

            // Distribute Hands (3 cards)
            room.gameState[room.hostId].hand = drawCards(3);
            room.gameState[room.guestId].hand = drawCards(3);

            io.to(roomCode).emit('game_started', {
                wordListSize: room.wordList.length
            });

            // Send initial state to each player
            emitGameState(roomCode);

            console.log(`Game started in room ${roomCode}`);
        } else {
            // If wordlist is empty, use sample? Or error.
            socket.emit('error', { message: 'Cannot start game. Check players or word list.' });
        }
    });

    // Player: Answer Question
    socket.on('answer_question', ({ roomCode, word, isCorrect }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;

        const playerState = room.gameState[socket.id];
        if (!playerState) return;

        if (isCorrect) {
            // Remove from pressure
            // We assume client sends which word was answered, or we just remove the first one?
            // Plan: "Remove from pressure queue".
            // Let's assume queue FIFO logic.
            const idx = playerState.pressure.findIndex(p => p.Word === word);
            if (idx !== -1) {
                playerState.pressure.splice(idx, 1);
            }

            // Notify client answer was correct (maybe not needed if client calculates it, but secure way is here)
            socket.emit('answer_result', { correct: true });

            // "Activate Attack Mode" -> Frontend handles UI.
            // Backend just waits for 'attack' event.
        } else {
            // Wrong answer
            // Penalty: Keep in pressure.
            // Cooldown handled on frontend?
            // Plan says: "Penalty: Question stays." 
            socket.emit('answer_result', { correct: false });
        }

        emitGameState(roomCode);
    });

    // Player: Attack
    socket.on('attack', ({ roomCode, cardWord }) => {
        const room = rooms[roomCode];
        if (!room || room.status !== 'playing') return;

        const playerState = room.gameState[socket.id];
        const opponentId = socket.id === room.hostId ? room.guestId : room.hostId;
        const opponentState = room.gameState[opponentId];

        // Verify player has this card
        const cardIdx = playerState.hand.findIndex(c => c.Word === cardWord);
        if (cardIdx !== -1) {
            const card = playerState.hand[cardIdx];

            // Remove from hand
            playerState.hand.splice(cardIdx, 1);

            // Add to opponent pressure
            opponentState.pressure.push(card);

            // Refill hand
            playerState.hand.push(getRandomItem(room.wordList));

            // Check Win Condition
            if (opponentState.pressure.length >= 10) {
                room.status = 'finished';
                io.to(roomCode).emit('game_over', { winner: socket.id });
            } else {
                emitGameState(roomCode);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Cleanup room logic if needed
    });
});

// Helper to sanitize state before sending
function emitGameState(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    // We need to send:
    // 1. My Pressure Queue (Full info to generate options)
    // 2. My Hand (Full info)
    // 3. Opponent Pressure Count (Int)

    [room.hostId, room.guestId].forEach(pid => {
        if (!pid) return;
        const myState = room.gameState[pid];
        const oppId = pid === room.hostId ? room.guestId : room.hostId;
        const oppState = room.gameState[oppId];

        // Prepare pressure items with options
        const pressureWithOpts = myState.pressure.map(item => ({
            ...item,
            options: generateOptions(item, room.wordList)
        }));

        io.to(pid).emit('game_update', {
            myPressure: pressureWithOpts,
            myHand: myState.hand,
            opponentPressureCount: oppState.pressure.length,
            pressureLimit: 10
        });
    });
}

// HTTP Upload Endpoint
app.post('/upload/:roomCode', upload.single('file'), (req, res) => {
    const { roomCode } = req.params;
    const room = rooms[roomCode];

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            // Validate structure (Look for Word and Definition keys)
            if (results.length > 0 && results[0].Word && results[0].Definition) {
                room.wordList = results;
                // Clean up file
                fs.unlinkSync(req.file.path);
                io.to(roomCode).emit('csv_uploaded', { count: results.length });
                res.json({ success: true, count: results.length });
            } else {
                fs.unlinkSync(req.file.path);
                res.status(400).json({ error: 'Invalid CSV format. Header must be "Word,Definition"' });
            }
        });
});

// Basic route
app.get('/', (req, res) => {
    res.send('Word Duel Backend Running');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
