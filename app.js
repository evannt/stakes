const gameRoutes = require("./routes/game-router");
const express = require("express");
const session = require("express-session");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();
const { MongoClient } = require('mongodb');
const app = express();
const db = require('./models/db'); 
const gameRouter = require('./routes/game-router'); 

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/sounds", express.static(path.join(__dirname, "sounds")));
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use("/game", gameRoutes);

app.get("/", async (req, res) => {
    res.redirect("/game");
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/game', gameRouter);

async function startServer() {
  try {
    await db.connect(); // Connect to MongoDB
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

startServer();