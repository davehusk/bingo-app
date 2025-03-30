const express = require('express');
const fs = require('fs');
const ini = require('ini');
const path = require('path');
const app = express();
const port = 3000;

// Parse config
let config;
try {
    config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'));
    if (!config.BINGO) {
        throw new Error('BINGO section missing from config.ini');
    }
} catch (error) {
    console.error('Error loading config file:', error.message);
    process.exit(1);
}

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public', {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    }
  }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Generate Open Graph data
function generateOgData(req, pageType = 'home') {
    const baseUrl = "https://bingo-caller.glitch.me";
    return {
        title: "Bingo Caller",
        description: "Play Bingo online with our interactive Bingo Caller",
        image: "https://cdn.glitch.global/9fa2504c-0c88-4af2-b08f-7825b48980dc/image.png?v=1743348006318",
        url: baseUrl,
        type: "website"
    };
}


// Generate a bingo card
function generateCard() {
    const card = {};
    'BINGO'.split('').forEach(letter => {
        card[letter] = [];
        const min = letter === 'B' ? 1 : letter === 'I' ? 16 : letter === 'N' ? 31 : letter === 'G' ? 46 : 61;
        const max = min + 14;
        while (card[letter].length < 5) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!card[letter].includes(num)) card[letter].push(num);
        }
    });
    card.N[2] = 'FREE'; // Set middle square to FREE
    return card;
}

// Routes
app.get('/', (req, res) => {
    const ogData = generateOgData(req);
    res.render('index', { 
        bingoData: config.BINGO,
        ogData: ogData
    });
});


// Print Bingo Cards
app.get('/print', (req, res) => {
    const count = Math.min(1000, parseInt(req.query.count) || 1);
    const cards = Array.from({ length: count }, (_, i) => ({ id: i + 1, card: generateCard() }));
    const ogData = generateOgData(req, 'print');
    res.render('print', { cards, bingoData: config.BINGO, ogData });
});


// Call Bingo Number
app.get('/call', (req, res) => {
    const calledNumbers = req.query.called ? req.query.called.split(',') : [];
    const availableNumbers = Object.keys(config.BINGO).filter(num => !calledNumbers.includes(num));
    
    if (availableNumbers.length === 0) {
        return res.json({ done: true });
    }

    const number = availableNumbers[Math.floor(Math.random() * availableNumbers.length)];
    res.json({
        number: number,
        phrase: config.BINGO[number]
    });
});

app.listen(port, () => {
    console.log(`Bingo app listening at http://localhost:${port}`);
});
