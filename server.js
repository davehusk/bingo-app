const express = require("express");
const fs = require("fs");
const path = require("path");
const ini = require("ini");

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

let config = ini.parse(fs.readFileSync("./config/config.ini", "utf-8"));
let calledNumbers = [];
let cards = generateBingoCards(50);

function generateBingoCards(count) {
    let cards = [];
    for (let i = 0; i < count; i++) {
        let card = generateUniqueCard();
        cards.push({ id: i + 1, numbers: card });
    }
    return cards;
}

function generateUniqueCard() {
    let card = { B: [], I: [], N: [], G: [], O: [] };
    let ranges = { B: [1, 15], I: [16, 30], N: [31, 45], G: [46, 60], O: [61, 75] };
    
    Object.keys(card).forEach(letter => {
        let [min, max] = ranges[letter];
        let nums = [];
        while (nums.length < (letter === "N" ? 4 : 5)) {
            let num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!nums.includes(num)) nums.push(num);
        }
        card[letter] = nums;
    });

    return card;
}

function checkBingo(card) {
    let { B, I, N, G, O } = card.numbers;
    let board = [B, I, N, G, O];

    // Check horizontal (rows)
    for (let row = 0; row < 5; row++) {
        if (board.every(column => calledNumbers.includes(column[row]))) {
            return true;
        }
    }

    // Check vertical (columns)
    for (let col = 0; col < 5; col++) {
        if (board[col].every(num => calledNumbers.includes(num))) {
            return true;
        }
    }

    // Check diagonals
    if (
        calledNumbers.includes(B[0]) &&
        calledNumbers.includes(I[1]) &&
        calledNumbers.includes(G[3]) &&
        calledNumbers.includes(O[4])
    ) return true;

    if (
        calledNumbers.includes(O[0]) &&
        calledNumbers.includes(G[1]) &&
        calledNumbers.includes(I[3]) &&
        calledNumbers.includes(B[4])
    ) return true;

    return false;
}


app.get("/", (req, res) => {
    res.render("index", { calledNumbers, cards, phrases: config["Numbers"] });
});

app.get("/call-number", (req, res) => {
    let availableNumbers = [...Array(75).keys()].map(n => n + 1).filter(n => !calledNumbers.includes(n));

    if (availableNumbers.length === 0) return res.json({ number: null, phrase: "Game Over!", winners: [] });

    let called = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    calledNumbers.push(called);

    // Check for winning cards
    let winners = cards.filter(card => checkBingo(card)).map(card => card.id);

    res.json({ number: called, phrase: config["Numbers"][called.toString()], winners });
});


app.get("/print/:count", (req, res) => {
    let count = Math.min(50, Math.max(1, parseInt(req.params.count)));
    res.render("print", { cards: cards.slice(0, count) });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
