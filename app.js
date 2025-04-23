const express = require("express");
const app = express();
const port = 4000;

app.get("/", (req, res) => {
    res.send("Welcome to Cranky");
});

app.listen(port, () => {
    console.log(`Cranky started at http://localhost:${port}`);
});