const express = require("express");
const router = express.Router();
const { Game } = require("../models/game");

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

module.exports = router;