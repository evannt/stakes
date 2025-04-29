const Game = require('./models/game');
const express = require("express");
const app = express();
const port = 4000;

app.get("/", async (req, res) => {
    res.send("Welcome to Cranky");
});

app.listen(port, () => {
    console.log(`Cranky started at http://localhost:${port}`);
});

async function test() {
    game = new Game();
    // await game.newDeck();
    // await game.drawCards(8);
    game.loadJokers();
}
test();