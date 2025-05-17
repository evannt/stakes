const express = require("express");
const router = express.Router();
const { Game } = require("../models/game");
const db = require('../models/db'); 

const game = new Game();
game.startGame();

router.get("/", (req, res) => {
  res.render("rules");
});

router.get("/play", (req, res) => {
  res.render("game", {
    game: game.state,
    highScore: req.session.highScore || 0
  });
});

router.get("/refresh", (req, res) => {
  res.json({
    hand: game.state.hand
  });
});

router.get("/restart", async (req, res) => {
  await game.restartGame();
  res.json({
    game: game.state,
    highScore: req.session.highScore || 0
  });
});

router.get("/hand/play", async (req, res) => {
  const roundResult = await game.playHand();
  req.session.highScore = Math.max(req.session.highScore || 0, game.score);
  res.json({
    roundResult,
    game: game.state,
    removedCards: roundResult.removedCards,
    highScore: req.session.highScore || 0
  });
});

router.get("/hand/discard", async (req, res) => {
  const discardedCards = await game.discardHand();
  res.json({
    game: game.state,
    discardedCards: discardedCards
  });
});

router.post("/card/select", (req, res) => {
  const id = req.body.id;
  const success = game.selectCard(id);
  res.json({
    success: success,
    game: game.state
  });
});

router.post("/joker/buy", (req, res) => {
  const jokerName = req.body.jokerName;
  const success = game.buyJoker(jokerName);
  res.json({
    success: success,
    game: game.state,
  });
});

router.post("/joker/sell", (req, res) => {
  const jokerName = req.body.jokerName;
  const success = game.burnJoker(jokerName);
  res.json({
    success: success,
    game: game.state,
  });
});

// Example route for your game page (assuming it has the form)
router.get('/', (req, res) => {
  res.render('game'); // Render your game page with the form
});

// Handle form submission to save score
router.post('/save-score', async (req, res) => {
  const { username, score } = req.body;
  try {
    // Basic validation
    if (!username || !score || isNaN(score)) {
      return res.status(400).json({ success: false, error: 'Invalid username or score' });
    }
    await db.saveScore(username, score);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to save score' });
  }
});

// API endpoint to fetch top scores
router.get('/api/leaderboard', async (req, res) => {
  try {
    const topScores = await db.getTopScores();
    res.json(topScores);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Optional: Render a leaderboard page
router.get('/leaderboard', async (req, res) => {
  try {
    const topScores = await db.getTopScores();
    res.render('leaderboard', { topScores });
  } catch (error) {
    res.status(500).send('Error fetching leaderboard');
  }
});

module.exports = router;