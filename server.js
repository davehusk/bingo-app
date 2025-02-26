const express = require("express");
const fs = require("fs");
const path = require("path");
const ini = require("ini");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set("view engine", "ejs");
app.use(express.static("public"));

let bingoWords = {};
const configPath = path.join(__dirname, "config/config.ini");

// Load Config
function loadConfig() {
    if (fs.existsSync(configPath)) {
        bingoWords = ini.parse(fs.readFileSync(configPath, "utf-8"));
    }
}

loadConfig();

// Generate a Unique Bingo Card
function generateBingoCard() {
    const columns = { B: [], I: [], N: [], G: [], O: [] };
    const usedNumbers = new Set();

    function getRandomNumber(min, max) {
        let num;
        do {
            num = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (usedNumbers.has(num));
        usedNumbers.add(num);
        return num;
    }

    ["B", "I", "N", "G", "O"].forEach((letter, index) => {
        for (let i = 0; i < 5; i++) {
            let num = getRandomNumber(index * 15 + 1, (index + 1) * 15);
            let word = bingoWords[num] || `Word ${num}`;
            columns[letter].push({ num, word });
        }
    });

    return {
        id: Math.random().toString(36).substr(2, 9), // Reference number
        columns,
    };
}

// API to Generate Bingo Cards
app.get("/generate", (req, res) => {
    res.json(generateBingoCard());
});

// Render Bingo Caller
app.get("/", (req, res) => {
    res.render("index");
});

app.post("/verify-card", express.json(), (req, res) => {
      const { cardId, numbers } = req.body;
  
      // Simulate a lookup (real implementation would use a database)
      if (!cardId) return res.json({ valid: false });
  
      // Simple verification: All numbers should have been called
      const allCalled = numbers.every(n => calledNumbers.has(n));
      res.json({ valid: allCalled });
  });
  

app.get("/bingo-card", (req, res) => {
      const card = generateBingoCard();
      res.render("bingo-card", { card });
  });
  

// Socket.io for Real-time Bingo Calling
let calledNumbers = new Set();
io.on("connection", (socket) => {
    socket.emit("update", Array.from(calledNumbers));

    socket.on("call-number", () => {
        let available = Array.from({ length: 75 }, (_, i) => i + 1).filter(n => !calledNumbers.has(n));
        if (available.length > 0) {
            let num = available[Math.floor(Math.random() * available.length)];
            calledNumbers.add(num);
            io.emit("update", Array.from(calledNumbers));
        }
    });

    socket.on("reset", () => {
        calledNumbers.clear();
        io.emit("update", []);
    });
});

server.listen(3000, () => console.log("Bingo server running on http://localhost:3000"));
