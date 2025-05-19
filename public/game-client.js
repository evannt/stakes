document.addEventListener("DOMContentLoaded", async () => {
    // await flyCardsInOnReload();
    await updateLeaderboard();
    addButtonListeners();
    addJokerButtons();

    function addCardListeners() {
        const cards = document.querySelectorAll(".card");
        cards.forEach(c => {
            c.addEventListener("click", processCardClick);
            c.addEventListener("mousemove", e => {
                rotateElement(e, c, c.offsetWidth, c.offsetHeight);
            });
            c.addEventListener("mouseleave", () => {
                c.style.setProperty("--cardRotateX", "0deg");
                c.style.setProperty("--cardRotateY", "0deg");
            })
        });
    }

    function addButtonListeners() {
        if (document.querySelector("#dealCardsBtn")) {
            document.querySelector("#dealCardsBtn").addEventListener("click", flyCardsInOnReload);
        }
        if (document.querySelector("#playHandBtn") && document.querySelector("#discardBtn")) {
            document.querySelector("#playHandBtn").addEventListener("click", processPlayHand);
            document.querySelector("#discardBtn").addEventListener("click", processDiscard);
        } else if (document.querySelector("#newGameBtn")) {
            document.querySelector("#newGameBtn").addEventListener("click", restartGame);
        }
    }

    function addJokerButtons() {
        const jokerBuyButtons = document.querySelectorAll(".buyJokerBtn");
        jokerBuyButtons.forEach(b => b.addEventListener("click", processJokerBuy));
        const jokerBurnButtons = document.querySelectorAll(".burnJokerBtn");
        jokerBurnButtons.forEach(b => b.addEventListener("click", processJokerBurn));
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

            if (result.roundResult.handPlayed) {
                await raisePlayedCards();
                await shakeCards();
                await sleep(150);
                showRoundScore(result.roundResult);
                updateGameInfo(result.game);
                updateHighScore(result.highScore);
                playSound("/sounds/addpokerchips.mp3");
                await sleep(850);
                await descendPlayedCards();
                await displayCardsAnimation(result.game.hand, result.removedCards);
                updateHandScore(result.game);
            }
            updateJokers(result.game);

            if (result.roundResult.gameOver) {
                showNewGameControls();
            }
        } catch (error) {
            console.error(`Error playing hand: ${error}`);
        }
    }

    async function processDiscard() {
        try {
            const response = await fetch("/game/hand/discard");

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const discardResult = await response.json();

            // Added cards are always at the end of the hand
            const addedCards = discardResult.game.hand.slice(-discardResult.discardedCards.length);
            if (discardResult.discardedCards.length > 0) {
                await discardCardsAnimation(addedCards, discardResult.discardedCards);
            }
            updateGameInfo(discardResult.game);
            updateHandScore(discardResult.game);
            updateSelectedCards(discardResult.game);
        } catch (error) {
            console.error(`Error discarding card: ${error}`);
        }
    }

    async function restartGame() {
        try {
            const response = await fetch("/game/restart");

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }

            const restartResult = await response.json();

            await displayCardsAnimation(restartResult.game.hand, []);
            updateGameInfo(restartResult.game);
            updateSelectedCards(restartResult.game);
            updateJokers(restartResult.game);
            updateHighScore(restartResult.highScore);
            showGameControls();
            removeRoundScore();
        } catch (error) {
            console.error(`Error restarting game: ${error}`);
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
            let joker = `<div class="joker" data-name="${j.name}">
          <div class="jokerName">${j.name}</div>
          <div class="jokerRarity">${j.rarity}</div>
          <div class="jokerDescription">${j.description}</div>
          <div class="jokerCost">Cost: ${j.cost}</div>
          <button class="buyJokerBtn" data-name="${j.name}">Buy</button> 
          </div>
          `;
            jokerStoreList.push(joker);
        });
        game.jokers.forEach(j => {
            let joker = `<div class="joker" data-name="${j.name}">
          <div class="jokerName">${j.name}</div>
          <div class="jokerRarity">${j.rarity}</div>
          <div class="jokerDescription">${j.description}</div>
          <button class="burnJokerBtn" data-name="${j.name}">Burn</button>
          </div>
          `;
            jokerList.push(joker);
        });
        document.querySelector("#jokerStoreContainer").innerHTML = jokerStoreList.join("");
        document.querySelector("#jokerContainer").innerHTML = jokerList.join("");
        addJokerButtons();
    }

    async function saveScore(event) {
        event.preventDefault();
        const username = document.getElementById("username").value.trim();
        const scoreText = document.getElementById("gameScore").innerHTML;
        console.log(scoreText);
        const score = parseInt(scoreText.replace("Score: ", ""));

        if (!username) {
            alert("Please enter a valid username");
            return;
        }

        try {
            const response = await fetch("/game/save-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, score })
            });
            const result = await response.json();

            if (result.success) {
                await updateLeaderboard();
                removeLeaderboardForm();
            }
        } catch (error) {
            console.error("Error saving score:", error);
            alert("An error occurred while trying to save your score.");
        }
    }

    async function updateLeaderboard() {
        try {
            const response = await fetch("/game/leaderboard/topscores");
            const topScores = await response.json();
            displayLeaderboard(topScores);
        } catch (error) {
            console.error(`Error fetching leaderboard: ${error}`);
        }
    }

    function displayLeaderboard(topScores) {
        const tbody = document.querySelector("#leaderboardBody");
        tbody.innerHTML = "";
        topScores.forEach(entry => {
            const row = `<tr>
            <td>${entry.username}</td>
            <td>${entry.score}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }

    async function displayCardsAnimation(addedCards, removedCards) {
        // Animate cards flying away
        await flyCardsOut(removedCards);

        // Animate cards being dealt
        await flyCardsIn(addedCards, 0);
        addCardListeners();
    }

    async function discardCardsAnimation(addedCards, removedCards) {
        // Fly out the discarded cards
        await flyCardsOut(removedCards);
        // Adjust div ids to match hand alignment
        document.querySelectorAll(".card").forEach((c, i) => {
            c.setAttribute("data-id", `${i + 1}`);
        });
        // Fly in the newly drawn cards
        await flyCardsIn(addedCards, 7 - removedCards.length);
        addCardListeners();
    }

    function updateHandScore(game) {
        document.querySelector("#handType").innerHTML = game.handType;
        document.querySelector("#handBaseScore").innerHTML = game.handBaseScore;
        document.querySelector("#handMult").innerHTML = game.handMult;
    }

    function updateGameInfo(game) {
        document.querySelector("#gameScore").innerHTML = `Score: ${game.score}`;
        document.querySelector("#gameMult").innerHTML = `Mult: x${game.mult}`;
        document.querySelector("#gameChips").innerHTML = `Chips: ${game.chips}`;
        document.querySelector("#gameDiscards").innerHTML = `Discards: ${game.discards}`;

        const roundTracker = document.querySelector("#roundTracker");
        if (roundTracker) {
            roundTracker.innerHTML = "";

            for (let i = 1; i <= 7; i++) {
                const dot = document.createElement("div");
                dot.className = "round-dot";

                if (i < game.round) {
                    dot.classList.add("completed");
                } else if (i === game.round) {
                    dot.classList.add("active");
                }

                roundTracker.appendChild(dot);
            }
        }
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

    function removeLeaderboardForm() {
        document.querySelector("#controls").innerHTML = `<button id="newGameBtn">New Game</button>`;
    }

    function showGameControls() {
        document.querySelector("#controls").innerHTML = `
            <button id="playHandBtn">Play Hand</button>
            <button id="discardBtn">Discard</button>`;
        addButtonListeners();
    }

    function showNewGameControls() {
        document.querySelector("#controls").innerHTML = `
            <form id="saveScoreForm">
                <input type="text" id="username" placeholder="Enter your username" required>
                <button type="submit" id="saveButton">Save Score</button>
            </form>
            <button id="newGameBtn">New Game</button>`;
        document.querySelector("#saveScoreForm").addEventListener("submit", saveScore);
        document.querySelector("#saveButton").addEventListener("click", function () {
            document.querySelector("#leaderboardContainer").scrollIntoView({ behavior: "smooth" });
        });
        document.querySelector("#newGameBtn").addEventListener("click", restartGame);
    }

    function rotateElement(event, element, width, height) {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const middleX = width / 2;
        const middleY = height / 2;
        const degrees = 15;
        const offsetX = degrees * ((x - middleX) / middleX);
        const offsetY = degrees * ((y - middleY) / middleY);
        element.style.setProperty("--cardRotateX", `${offsetX}deg`);
        element.style.setProperty("--cardRotateY", `${-offsetY}deg`);
    }

    function flyCardOut(card) {
        card.offsetHeight;
        card.classList.add("flyOut");
        setTimeout(() => {
            card.remove();
        }, 500);
    }

    async function flyCardsOut(removedCards) {
        const removedCardIds = removedCards.map(c => `${c.id}`);
        const cards = Array.from(document.querySelectorAll(".card")).reverse()
            .filter(c => removedCardIds.includes(c.dataset.id));

        cards.forEach(c => {
            c.setAttribute("data-held", "false");
        });
        
        const flyOutAnimationPromises = cards.map((c, i) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    flyCardOut(c);
                    playSound("/sounds/cardremoved.mp3");
                    const animationDuration = 500;
                    setTimeout(resolve, animationDuration);
                }, parseInt(c.dataset.id) * 80);
            });
        });
        
        return Promise.all(flyOutAnimationPromises);
    }

    async function flyCardsInOnReload() {
        try {
            const response = await fetch("/game/refresh");

            if (!response.ok) {
                throw new Error(`HTTP error, Status: ${response.status}`);
            }
            const refreshResult = await response.json();
            await flyCardsIn(refreshResult.hand, []);
            addCardListeners();
            showGameControls();
            await updateLeaderboard();
        } catch (error) {
            console.error(`Error reloading: ${error}`);
        }
    }

    async function flyCardsIn(addedCards, existingCards) {
        const cardContainer = document.querySelector("#cardContainer");
        const deckRect = document.querySelector("#deckContainer").getBoundingClientRect();
        const cardsRect = cardContainer.getBoundingClientRect();

        const flyInAnimationPromises = addedCards.map((c, i) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const cardElement = createCardElement(c);
                    cardElement.classList.add("flyIn");
                    const deckX = deckRect.left - cardsRect.left;
                    const deckY = deckRect.top - cardsRect.top;
                    cardElement.style.transform = `translate(${deckX}px, ${deckY}px) rotate(20deg)`;
                    cardContainer.appendChild(cardElement);
                    cardElement.offsetHeight;

                    const cardWidth = cardElement.offsetWidth;
                    const cardHeight = cardElement.offsetHeight;
                    const startIndex = existingCards + i;
                    const cardsPerRow = Math.floor(cardsRect.width / cardWidth);
                    const row = Math.floor(startIndex / cardsPerRow);
                    const col = startIndex % cardsPerRow;
                    
                    const finalX = col * (cardWidth + 10);
                    const finalY = row * (cardHeight + 10);
                    
                    cardElement.style.transform = `translate(${finalX}px, ${finalY}px) rotate(0deg)`;
                    playSound("/sounds/dealcard.mp3");
                    setTimeout(() => {
                        cardElement.classList.remove("flyIn");
                        cardElement.style.transform = "";
                        cardElement.style.position = "relative";
                        resolve();
                    }, 400);
                }, i * 80);
            });
        });
        return Promise.all(flyInAnimationPromises);
    }

    async function raisePlayedCards() {
        const cards = Array.from(document.querySelectorAll(".card"))
            .filter(c => c.getAttribute("data-held") === "true");
        const raiseAnimationPromises = cards.map((c, i) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    const raiseAmount = -c.offsetHeight * 0.7;
                    c.style.setProperty("--cardTranslateY", `${raiseAmount}px`);
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }, i * 250);
            });
        });
        return Promise.all(raiseAnimationPromises);
    }

    async function shakeCards() {
        const cards = Array.from(document.querySelectorAll(".card"))
            .filter(c => c.getAttribute("data-held") === "true");
        const shakeAnimationPromises = cards.map((c, i) => {
            return new Promise((resolve, reject) => {
                c.style.animation = "cardShake 0.2s ease-in";
                setTimeout(() => {
                    resolve();
                }, 500);
            });
        });
        return Promise.all(shakeAnimationPromises);
    }

    async function descendPlayedCards() {
        const cards = Array.from(document.querySelectorAll(".card"))
            .filter(c => c.getAttribute("data-held") === "true");
        const descendAnimationPromises = cards.map((c, i) => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    c.style.setProperty("--cardTranslateY", "0px");
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }, i * 250);
            });
        });
        return Promise.all(descendAnimationPromises);
    }

    function createCardElement(card) {
        const cardElement = document.createElement("div");
        cardElement.className = "card";
        cardElement.setAttribute("data-id", card.id);
        cardElement.setAttribute("data-held", card.selected ? "true" : "false");
        cardElement.innerHTML = `<img id="card-image" src="${card.image}" alt="${card.rank} of ${card.suit}" width="80" height="112">`;
        return cardElement;
    }

    async function sleep(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    function playSound(path) {
        const audio = new Audio(path);
        audio.volume = 0.75;
        audio.play();
    }

});