// Import necessary modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const { body, validationResult } = require('express-validator');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
app.use(express.static('public')); // Serve static files from 'public' directory

// Middleware for validating and sanitizing user inputs
function validateInputs(req, res, next) {
    body('username').trim().escape(),
    body('password').trim().escape(),
    body('answer').trim().escape(),
    
    next();
}

// Redis Cloud connection details
const redis = new Redis({
    host: 'redis-15529.c294.ap-northeast-1-2.ec2.redns.redis-cloud.com',
    port: 15529,
    username: 'default',
    password: 'Apple0508!'
});

// Function to update leaderboard with the username, points, and difficulty
async function updateLeaderboard(username, points, difficulty) {
    try {
        // Fetch current leaderboard data
        const leaderboardData = await redis.hgetall('leaderboard');
        let updatedScore = points;
        let updatedDifficulty = difficulty;

        // Check if the user is already in the leaderboard
        if (username in leaderboardData) {
            // Split the existing score to get points and difficulties completed
            const [currentScore, currentDifficulties] = leaderboardData[username].split(':');
            // Update the total score
            updatedScore += parseInt(currentScore);
            // Check if the current difficulty is greater than the existing difficulty
            if (compareDifficulties(updatedDifficulty, currentDifficulties)) {
                // Update the difficulty only if it's greater
                updatedDifficulty = currentDifficulties ? updatedDifficulty + ',' + currentDifficulties : updatedDifficulty;
            } else {
                // Keep the existing difficulty
                updatedDifficulty = currentDifficulties;
            }
        }

        // Update the leaderboard with the updated score and difficulty
        await redis.hset('leaderboard', username, `${updatedScore}:${updatedDifficulty}`);
    } catch (error) {
        throw error;
    }
}

// Function to format leaderboard data and handle ranking
function formatLeaderboardData(leaderboardData) {
    const formattedData = Object.entries(leaderboardData).map(([username, score]) => {
        const [totalScore, difficulties] = score.split(':');
        const levelsCompleted = difficulties ? difficulties.split(',') : [];
        return { username, totalScore, levelsCompleted };
    });
    // Sort leaderboard data based on score
    formattedData.sort((a, b) => parseInt(b.totalScore) - parseInt(a.totalScore));
    return formattedData;
}

// Function to compare two difficulties based on their order
function compareDifficulties(newDifficulty, existingDifficulty) {
    const difficulties = ['Easy', 'Medium', 'Hard'];
    return difficulties.indexOf(newDifficulty) > difficulties.indexOf(existingDifficulty);
}

// WebSocket connection event
wss.on('connection', (ws) => {
    // Send current leaderboard data to the newly connected client
    ws.send(JSON.stringify(leaderboard));
});

// Index page route
app.get('/index', (req, res) => {
    console.log('GET /');
    res.sendFile(__dirname + '/public/home.html');
});
// home page route
app.get('/home', (req, res) => {
    console.log('GET /home');
    res.sendFile(__dirname + '/public/index.html');
});
// Submit form data to store user information in Redis
app.post('/submit-form', validateInputs, async (req, res) => {


    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Extract user data from the request body
    const { fullName, email, username } = req.body;

    try {
        // Store user information in the Redis hash
        await redis.hset('Users', username, JSON.stringify({ fullName, email }));
        
        res.status(200).json({ success: true, message: 'User information saved successfully.' });
    } catch (error) {
        console.error('Error storing user information:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Endpoint to retrieve leaderboard data from Redis Cloud
app.get('/leaderboard', async (req, res) => {
    try {
        // Fetch leaderboard data from Redis Cloud
        const leaderboardData = await redis.hgetall('leaderboard');
        // Convert data to array format
        const formattedData = formatLeaderboardData(leaderboardData);
        // Send data to client
        res.json(formattedData);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Easy Level route
app.get('/easy', (req, res) => {
    res.sendFile(__dirname + '/public/easy.html');
});

// Medium Level route
app.get('/medium', (req, res) => {
    res.sendFile(__dirname + '/public/medium.html');
});

// Hard Level route
app.get('/hard', (req, res) => {
    res.sendFile(__dirname + '/public/hard.html');
});

// Submit answer for Easy Level
app.post('/easy', validateInputs, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const answer = req.body.answer;
    const username = req.body.username;
    // Sanitize answer and username before comparing
    const expectedAnswer = 'Flag{Easy_lang_diba}';
    const points = 200;
    const difficulty = 'Easy';

    if (answer === expectedAnswer) {
        try {
            // Use parameterized query to update leaderboard
            await updateLeaderboard(username, points, difficulty);
            res.json({ success: true, nextLevel: true });
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    } else {
        res.json({ success: false });
    }
});

// Submit answer for Medium Level
app.post('/medium', validateInputs, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const answer = req.body.answer;
    const username = req.body.username;
    // Sanitize answer and username before comparing
    const expectedAnswer = 'FLAG{UE_Warriors_Sakalam}';
    const points = 300;
    const difficulty = 'Medium';

    if (answer === expectedAnswer) {
        try {
            // Use parameterized query to update leaderboard
            await updateLeaderboard(username, points, difficulty);
            res.json({ success: true, nextLevel: true });
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    } else {
        res.json({ success: false });
    }
});

// Submit login credentials for Hard Level
app.post('/hard/login', validateInputs, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const username = req.body.username; // Update to match the form field name
    const password = req.body.password;

    // Check if the username and password match the expected values
    if (username === 'Alfred' && password === 'Dog0442') {
        try {
            res.status(200).send('Success');
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Internal Server Error');
        }
    } else {
        // Send failure response
        res.status(401).send('Incorrect username or password. Please try again!');
    }
});

// Update leaderboard with the username from the SuccessModal
app.post('/update-leaderboard', validateInputs, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const username = req.body.username; // Get username from the SuccessModal form
    const points = 500; // Points for completing Hard Level
    const difficulty = 'Hard'; // Difficulty level

    try {
        // Update the leaderboard in Redis with the username, points, and difficulty
        await updateLeaderboard(username, points, difficulty);
        res.status(200).send('Leaderboard updated successfully.');
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Hell Level route
app.get('/hell', (req, res) => {
    // Check if the User-Agent header contains "UEArcadeBrowser"
    const userAgent = req.headers['user-agent'];
    if (userAgent && userAgent.includes('UEArcadeBrowser')) {
        // Serve the HTML page with the flag
        res.sendFile(__dirname + '/public/hel1.html');
    } else {
        // Serve an error page or redirect back to the main menu
        res.status(403).sendFile(__dirname + '/public/hell.html');
    }
});

// Hell Level route
app.post('/hell', validateInputs, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const flag = req.body.flag; // Get the flag submitted by the user
    const username = req.body.username; // Get the username
    const points = 999999; // Points for completing Hell Level

    // Check if the flag is correct
    if (flag === 'Flag{BoomPanis}') {
        try {
            // Update the leaderboard with 999999 points for the user
            await updateLeaderboard(username, points, 'Hell');
            res.status(200).json({ success: true, message: 'Congratulations! You completed the Hell difficulty challenge!' });
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            res.status(500).json({ success: false, error: 'Internal Server Error' });
        }
    } else {
        // If the flag is incorrect, send a failure response
        res.status(400).json({ success: false, message: 'Incorrect flag. Try again!' });
    }
});

// Handle cheat code verification
app.post('/verify-cheat', (req, res) => {
    const { cheatCode } = req.body;

    // Check if the provided cheat code matches the expected code
    if (cheatCode === 'Miyaki<3') {
        // If the cheat code is correct, send a success response
        res.status(200).json({ success: true });
    } else {
        // If the cheat code is incorrect, send a failure response
        res.status(400).json({ success: false, message: 'Incorrect cheat code. Try again!' });
    }
});

// Difficulty selection route
app.post('/difficulty', validateInputs, (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    console.log('POST /difficulty');
    const username = req.body.username;
    const difficulty = req.body.difficulty;

    // Update leaderboard
    leaderboard[username] = difficulty;
    console.log('Leaderboard updated:', leaderboard);

    // Broadcast updated leaderboard to all connected clients
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(leaderboard));
        }
    });

    // Redirect user to the selected difficulty challenge page
    res.redirect(`/${difficulty.toLowerCase()}`);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
