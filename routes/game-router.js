const express = require("express");
const router = express.Router();
const { Game } = require("../models/game");

// const testHand = [
//     // new Card(1, "2", "DIAMONDS", "https://deckofcardsapi.com/static/img/2D.png"),
//     // new Card(2, "3", "DIAMONDS", "https://deckofcardsapi.com/static/img/3D.png"),
//     // new Card(3, "4", "DIAMONDS", "https://deckofcardsapi.com/static/img/4D.png"),
//     // new Card(4, "5", "DIAMONDS", "https://deckofcardsapi.com/static/img/5D.png"),
//     // new Card(5, "6", "SPADES", "https://deckofcardsapi.com/static/img/6S.png"),
//     new Card(6, "10", "SPADES", "https://deckofcardsapi.com/static/img/0S.png"),
//     new Card(7, "9", "DIAMONDS", "https://deckofcardsapi.com/static/img/9D.png"),
//     new Card(8, "10", "DIAMONDS", "https://deckofcardsapi.com/static/img/0D.png"),    
//     new Card(9, "JACK", "SPADES", "https://deckofcardsapi.com/static/img/JS.png"),
//     new Card(10, "QUEEN", "SPADES", "https://deckofcardsapi.com/static/img/QS.png"),
//     new Card(11, "KING", "HEARTS", "https://deckofcardsapi.com/static/img/KH.png"),
//     new Card(12, "ACE", "DIAMONDS", "https://deckofcardsapi.com/static/img/aceDiamonds.png")
// ];
const game = new Game();

game.startGame();

router.get("/", (req, res) => {
  res.render("game", {
    game: game.state,
    highScore: req.session.highScore || 0
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
  // Update the high score once the game is over
  req.session.highScore = Math.max(req.session.highScore || 0, game.score);
  res.json({
    roundResult,
    game: game.state,
    highScore: req.session.highScore || 0
  });
});

router.get("/hand/discard", async (req, res) => {
  await game.discardHand();
  res.json({
    game: game.state,
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