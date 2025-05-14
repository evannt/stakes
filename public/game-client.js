document.addEventListener("DOMContentLoaded", () => {
    addCardListeners();
    addButtonListeners();
    /*
        There are some options here for the joker buttons:
            - Use the "joker" div to buy/sell jokers
            - Use a button to buy/sell jokers
    */
    // Div "button" option
    addStoreJokerListeners();
    addJokerListeners();
    // Button option
    addJokerButtons();

    function addCardListeners() {
        const cards = document.querySelectorAll(".card");
        cards.forEach(c => {
            c.addEventListener("click", processCardClick);
        });
    }

    function addButtonListeners() {
        document.querySelector("#playHandBtn").addEventListener("click", processPlayHand);
        document.querySelector("#discardBtn").addEventListener("click", processDiscard);
    }

    function addJokerButtons() {
        const jokerBuyButtons = document.querySelectorAll("#buyJokerBtn");
        jokerBuyButtons.forEach(b => b.addEventListener("click", processJokerBuy));
        const jokerBurnButtons = document.querySelectorAll("#burnJokerBtn");
        jokerBurnButtons.forEach(b => b.addEventListener("click", processJokerBurn));
    }

    // Here is where we can use the div as the joker button and maybe have a hover effect showing the price
    function addStoreJokerListeners() {
        const jokers = document.querySelectorAll(".storeJoker");
        jokers.forEach(j => {
            j.addEventListener("click", processJokerBuy);
        });
    }

    function addJokerListeners() {
        const jokers = document.querySelectorAll(".joker");
        jokers.forEach(j => {
            j.addEventListener("click", processJokerBurn);
        });
    }

    async function processCardClick(event) {
        const card = event.currentTarget;
        const id = card.dataset.id;

        try {
            const response = await fetch("/game/card/select", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id })
            });

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const selectResult = await response.json();

            if (selectResult.success) {
                // update game
                updateSelectedCards(selectResult.game);
                updateHandScore(selectResult.game);
            }

        } catch (error) {
            console.error(`Error selecting card (${id}): ${error}`);
        }
    }

    async function processJokerBuy(event) {
        const joker = event.currentTarget;
        const jokerName = joker.dataset.name;

        try {
            const response = await fetch("/game/joker/buy", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ jokerName })
            });

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const selectResult = await response.json();

            if (selectResult.success) {
                // update game
                updateHandScore(selectResult.game);
                updateGameInfo(selectResult.game);
                updateJokers(selectResult.game);
            }
        } catch (error) {
            console.error(`Error buying joker (${jokerName}): ${error}`);
        }
    }

    async function processJokerBurn(event) {
        const joker = event.currentTarget;
        const jokerName = joker.dataset.name;

        try {
            const response = await fetch("/game/joker/sell", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ jokerName })
            });

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const selectResult = await response.json();

            if (selectResult.success) {
                // update game
                updateHandScore(selectResult.game);
                updateGameInfo(selectResult.game);
                updateJokers(selectResult.game);
            }
        } catch (error) {
            console.error(`Error buying joker (${jokerName}): ${error}`);
        }
    }

    async function processPlayHand() {
        try {
            const response = await fetch("/game/hand/play");

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const result = await response.json();

            updateHand(result.game);
            updateHandScore(result.game);
            showRoundScore(result.roundResult);
            updateJokers(result.game);
            updateGameInfo(result.game);
            updateHighScore(result.highScore);

            if (result.roundResult.gameOver) {
                showNewGameControls();
            }
        } catch (error) {
            console.error(`Error selecting card (${id}): ${error}`);
        }
    }

    async function processDiscard() {
        try {
            const response = await fetch("/game/hand/discard");

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const discardResult = await response.json();

            updateHand(discardResult.game);
            updateGameInfo(discardResult.game);
            updateHandScore(discardResult.game);
            updateSelectedCards(discardResult.game);
        } catch (error) {
            console.error(`Error selecting card (${id}): ${error}`);
        }
    }

    async function restartGame() {
        try {
            const response = await fetch("/game/restart");

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const restartResult = await response.json();

            updateHand(restartResult.game);
            updateGameInfo(restartResult.game);
            updateSelectedCards(restartResult.game);
            updateJokers(restartResult.game);
            updateHighScore(restartResult.highScore);
            showGameControls();
            removeRoundScore();
        } catch (error) {
            console.error(`Error selecting card (${id}): ${error}`);
        }
    }

    function updateSelectedCards(game) {
        const cards = document.querySelectorAll(".card");
        const selected = new Map(game.hand.map(c => [c.id, c.selected]));
        cards.forEach(card => {
            const id = parseInt(card.getAttribute("data-id"));
            card.setAttribute("data-held", selected.get(id) ? "true" : "false");
        });
    }

    function updateJokers(game) {
        let jokerStoreList = [];
        let jokerList = [];
        game.jokerStore.forEach(j => {
          let joker = `<div class="joker" data-name="${ j.name }">
          <div id="jokerName">${ j.name }</div>
          <div id="jokerRarity">${ j.rarity }</div>
          <div id="jokerDescription">${ j.description }</div>
          <div id="jokerCost">Cost: ${ j.cost }</div>
          </div>
          <button id="buyJokerBtn" data-name="${ j.name }">Buy</button> 
          `;
          jokerStoreList.push(joker);
        });
        game.jokers.forEach(j => {
          let joker = `<div class="joker" data-name="${ j.name }">
          <div id="jokerName">${ j.name }</div>
          <div id="jokerRarity">${ j.rarity }</div>
          <div id="jokerDescription">${ j.description }</div>
          </div>
          <button id="burnJokerBtn" data-name="${ j.name }">Burn</button>
          `;
          jokerList.push(joker);
        });
        document.querySelector("#jokerStoreContainer").innerHTML = jokerStoreList.join("");
        document.querySelector("#jokerContainer").innerHTML = jokerList.join("");
        addStoreJokerListeners();
        addJokerListeners();
        addJokerButtons();
    }

    function updateHand(game) {
        let cardList = [];
        game.hand.forEach(c => {
            let card = `<div class="card" data-id="${c.id}" data-held=${c.selected ? "true" : "false"}>
            <img id="card-image" src="${c.image}" alt="${c.rank} of ${c.suit}" width="80" height="112">
            </div>`;
            cardList.push(card);
        });
        document.querySelector("#cardContainer").innerHTML = cardList.join("");
        addCardListeners();
    }

    function updateHandScore(game) {
        document.querySelector("#handType").innerHTML = game.handType;
        document.querySelector("#handBaseScore").innerHTML = game.handBaseScore;
        document.querySelector("#handMult").innerHTML = game.handMult;
    }

    function updateGameInfo(game) {
        document.querySelector("#roundIndicator").innerHTML = `Round: ${Math.min(game.round, 7)}/7`;
        document.querySelector("#gameScore").innerHTML = `Score: ${game.score}`;
        document.querySelector("#gameMult").innerHTML = `Mult: x${game.mult}`;
        document.querySelector("#gameChips").innerHTML = `Chips: ${game.chips}`;
        document.querySelector("#gameDiscards").innerHTML = `Discards: ${game.discards}`;
    }

    function updateHighScore(highScore) {
        document.querySelector("#gameHighScore").innerHTML = `High Score: ${highScore}`
    }

    function showRoundScore(roundResult) {
        if (roundResult.roundScore !== 0 && roundResult.roundChips !== 0) {
            document.querySelector("#roundScore").innerHTML = `+${roundResult.roundScore}`;
            document.querySelector("#roundChips").innerHTML = `+$${roundResult.roundChips}`;
        }
    }

    function removeRoundScore() {
        document.querySelector("#roundScore").innerHTML = ``;
        document.querySelector("#roundChips").innerHTML = ``;
    }

    function showGameControls() {
        document.querySelector("#controls").innerHTML = `
            <button id="playHandBtn">Play Hand</button>
            <button id="discardBtn">Discard</button>`;
        addButtonListeners();
    }

    function showNewGameControls() {
        document.querySelector("#controls").innerHTML = `<button id="newGameBtn">New Game</button>`;
        document.querySelector("#newGameBtn").addEventListener("click", restartGame);
    }
});