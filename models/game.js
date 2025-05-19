const Rarity = Object.freeze({
    COMMON: "COMMON",
    RARE: "RARE",
    LEGENDARY: "LEGENDARY",
});

const RarityProperties = Object.freeze({
    [Rarity.COMMON] : { type: "common", probability: 0.70 },
    [Rarity.RARE] : { type: "rare", probability: 0.20 },
    [Rarity.LEGENDARY] : { type: "legendary", probability: 0.10 },
});

const HandType = Object.freeze({
    STRAIGHT_FLUSH : { type: "Straight Flush", baseScore: 100, mult: 8, chips: 5 },
    FOUR_OF_A_KIND : { type: "Four of a Kind", baseScore: 60, mult: 7, chips: 3 },
    FULL_HOUSE : { type: "Full House", baseScore: 40, mult: 4, chips: 3 },
    FLUSH : { type: "Flush", baseScore: 35, mult: 4, chips: 2 },
    STRAIGHT : { type: "Straight", baseScore: 30, mult: 4, chips: 2 }, 
    THREE_OF_A_KIND : { type: "Three of a Kind", baseScore: 30, mult: 3, chips: 2 }, 
    TWO_PAIR :{ type: "Two Pair", baseScore: 20, mult: 2, chips: 2 }, 
    PAIR : { type: "Pair", baseScore: 10, mult: 2, chips: 1 }, 
    HIGH_CARD : { type: "High Card", baseScore: 5, mult: 1, chips: 1 }, 
});

const JokerEffectType = Object.freeze({
    GAME_EFFECT: "Game Effect",
    MULT_EFFECT: "Mult Effect",
    CHIP_EFFECT: "Chip Effect",
    HAND_EFFECT: "Hand Effect"
});

class Card {
    constructor(id, rank, suit, image, selected = false) {
        this.id = id;
        this.rank = rank;
        this.suit = suit;
        this.image = image;
        this.selected = selected;
    }

    get value() {
        switch (this.rank) {
            case 'ACE':
                return 11;
            case 'KING':
            case 'QUEEN':
            case 'JACK':
                return 10;
            default:
                return parseInt(this.rank);
        }
    }

    get cardId() {
        switch (this.rank) {
            case 'ACE':
                return 14;
            case 'KING':
                return 13;
            case 'QUEEN':
                return 12;
            case 'JACK':
                return 11;
            default:
                return parseInt(this.rank);
        }
    }

    toggleSelected() {
        this.selected = !this.selected;
    }
}

// Rename to something more interesting
/** 
    Jokers are wildcards that apply additional effects to
    help players gain more score during their runs. They are
    separated by rarity (common, rare, and legendary). On each
    round they are randomly generated given their rarity weight.
*/
class Joker {
    constructor(name, rarity, description, cost, effectType, effect) {
        this.name = name;
        this.rarity = rarity;
        this.description = description;
        this.cost = cost;
        this.effectType = effectType;
        this.effect = effect;
    }
}

class Game {
    static #TOTAL_ROUNDS = 7;
    static #MAX_JOKERS = 3;
    static #DECK_COUNT = 1;
    static #CARDS_DEALT = 7;
    static #MAX_SELECTED = 5;
    static #CREATE_DECK_URL = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${Game.#DECK_COUNT}`;
    static #DRAW_CARD_URL = `https://deckofcardsapi.com/api/deck/`;

    // Organize and test jokers
    static #JOKERS = {
        [Rarity.COMMON] : [
            new Joker("Bankroll", Rarity.COMMON, "Earn +2 chips for hands that contain at least 1 face card", 1, JokerEffectType.CHIP_EFFECT, (cards, handType) => {
                const numFaceCards = cards.filter(card => card.rank === "KING" || card.rank === "QUEEN" || card.rank === "JACK").length;
                return numFaceCards > 0 ? 2 : 0;
            }),
            new Joker("Monochrome", Rarity.COMMON, "Hands with all the same suit give +100 score", 1, JokerEffectType.SCORE_EFFECT, (game, cards) => {
                return cards.every((card) => card.suit == cards[0].suit) ? 100 : 0;
            }),
            new Joker("Aristocrat", Rarity.COMMON, "Face cards are worth x2", 1, JokerEffectType.HAND_EFFECT, (cards, handType) => {
                return cards.filter(card => card.rank === "KING" || card.rank === "QUEEN" || card.rank === "JACK").reduce((acc, card) => acc + card.value, 0);
            }),
            new Joker("Number Cruncher", Rarity.COMMON, "Numbered cards are worth x3", 1, JokerEffectType.HAND_EFFECT, (cards, handType) => {
                return cards.filter(card => card.rank !== "KING" && card.rank !== "QUEEN" && card.rank !== "JACK" && card.rank !== "ACE").reduce((acc, card) => acc + 2 * card.value, 0);
            }),
            new Joker("Everybody Say Love", Rarity.COMMON, "Hands with Heart suit give +2 mult", 1, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.suit === "HEARTS").length > 0 ? 2 : 0;
            }),
            new Joker("Spades, Spades, Spades", Rarity.COMMON, "Hands with Spades give +2 mult", 1, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.suit === "SPADES").length > 0 ? 2 : 0;
            }),
            new Joker("My Lucky Clover", Rarity.COMMON, "Hands with Clubs give +2 mult", 1, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.suit === "CLUBS").length > 0 ? 2 : 0;
            }),
            new Joker("Shine Bright Like a Diamond", Rarity.COMMON, "Hands with Diamonds give +2 mult", 1, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.suit === "DIAMONDS").length > 0 ? 2 : 0;
            }),
            new Joker("Royal Favor", Rarity.COMMON, "Hands with a King and Queen give +2 mult", 1, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                const numKings = cards.filter(card => card.rank === "KING").length;
                const numQueens = cards.filter(card => card.rank === "QUEEN").length;
                return (numKings > 0 && numQueens > 0) ? 2 : 0;
            }),
            new Joker("Null Pointer", Rarity.COMMON, "Hands with NO face cards give +1 mult", 1, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.rank === "KING" || card.rank === "QUEEN" || card.rank === "JACK").length === 0 ? 1 : 0;
            }),
            new Joker("Replenish", Rarity.COMMON, "Obtain +1 discards on each round", 1, JokerEffectType.GAME_EFFECT, (game) => {
                game.discards += 1;
            }),
            new Joker("Junk Collector", Rarity.COMMON, "Obtain +100 score for every discard remaining on each round", 1, JokerEffectType.SCORE_EFFECT, (game, cards) => {
                return game.discards * 100;
            }),
        ],
        [Rarity.RARE] :  [
            new Joker("Face Value", Rarity.RARE, "Hands with face cards reward +250 score", 2, JokerEffectType.SCORE_EFFECT, (game, cards) => {
                return cards.filter(card => card.rank === "KING" || card.rank === "QUEEN" || card.rank === "JACK").length > 0 ? 250 : 0;
            }),
            new Joker("Prime Time", Rarity.RARE, "Card with prime rank are worth 7x more", 2, JokerEffectType.HAND_EFFECT, (cards, handType) => {
                return cards
                    .filter(card => card.rank === "2" || card.rank === "3" || card.rank === "5" || card.rank === "7" || card.rank === "JACK" || card.rank === "KING")
                    .reduce((acc, card) => acc + card.value, 0);
            }),
            new Joker("Short Stop", Rarity.RARE, "Hands with three or fewer cards give +20 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.length <= 3 ? 20 : 0;
            }),
            new Joker("Monster Flush", Rarity.RARE, "Straight Flush's give +6 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.STRAIGHT_FLUSH ? 6 : 0;
            }),
            new Joker("Four Peas In A Pod", Rarity.RARE, "Four-Of-A-Kind's give +4 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.FOUR_OF_A_KIND ? 4 : 0;
            }),
            new Joker("Everyone's Home", Rarity.RARE, "Full House's give +3 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.FULL_HOUSE ? 3 : 0;
            }),
            new Joker("Always Flush", Rarity.RARE, "Flush's give +3 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.FLUSH ? 3 : 0;
            }),
            new Joker("Straight To The Point", Rarity.RARE, "Straight's give +3 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.STRAIGHT ? 3 : 0;
            }),
            new Joker("Triple Threat", Rarity.RARE, "Three-Of-A-Kind's give +3 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.THREE_OF_A_KIND ? 3 : 0;
            }),
            new Joker("Double Date", Rarity.RARE, "Two-Pairs give +2 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.TWO_PAIR ? 2 : 0;
            }),
            new Joker("It Takes Two", Rarity.RARE, "One-Pairs give +2 mult", 2, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return handType === HandType.PAIR ? 2 : 0;
            }),
            new Joker("Compound Interest", Rarity.RARE, "Increase your permanent mult by +2 on each round", 2, JokerEffectType.GAME_EFFECT, (game) => {
                game.mult += 2;
            }),
            new Joker("Garbage Collector", Rarity.RARE, "Obtain +5 discards on each round", 2, JokerEffectType.GAME_EFFECT, (game) => {
                game.discards += 5;
            }),
        ],
        [Rarity.LEGENDARY] : [
            new Joker("True Love", Rarity.LEGENDARY, "Each Heart gives +10 mult", 3, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.suit === "HEARTS").length * 10;
            }),
            new Joker("Memory Leak", Rarity.LEGENDARY, "Replaces all current jokers with rare jokers", 3, JokerEffectType.GAME_EFFECT, (game) => {
                game.jokers = [];
                for (let i = 0; i < Game.#MAX_JOKERS; i++) {
                    // Obtain a random, non held rare Jokers
                    const jokerPool = Game.#JOKERS[Rarity.RARE].filter(j => !game.jokers.includes(j));
                    game.jokers.push(jokerPool[Math.floor(Math.random() * jokerPool.length)]);
                }
            }),
            new Joker("Perfect Hashing", Rarity.LEGENDARY, "Full hands with distinct ranks give +20 mult", 3, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                const rankCounts = {};
                for (const card of cards) {
                    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
                }
                return (cards.length === 5 && Object.keys(rankCounts).length === 5) ? 20 : 0;
            }),
            new Joker("Lecture Manager", Rarity.LEGENDARY, "Each Ace gives +10 mult", 3, JokerEffectType.MULT_EFFECT, (cards, handType) => {
                return cards.filter(card => card.rank === "ACE").length * 10;
            }),
            new Joker("Payroll", Rarity.LEGENDARY, "Obtain +$10 on each round", 3, JokerEffectType.GAME_EFFECT, (game) => {
                game.chips += 10;
            }),
        ]
    };

    // Special Jokers can be played regardless of the current number of Jokers you possess
    static #SPECIAL_JOKERS = [
        "Memory Leak(F)"
    ];

    constructor() {
        this.deck = {};
        this.hand = [];
        this.jokers = [];
        this.jokerStore = [];
        this.score = 0;
        this.chips = 1;
        this.discards = 3,
        this.mult = 1;
        this.round = 1;
        this.scoreSaved = false;
    }

    async startGame() {
        await this.newDeck();
        await this.drawCards();
        this.loadJokers();
    }

    async restartGame() {
        this.deck = {};
        this.hand = [];
        this.jokers = [];
        this.jokerStore = [];
        this.score = 0;
        this.chips = 1;
        this.discards = 3,
        this.mult = 1;
        this.round = 1;
        this.scoreSaved = false;
        await this.startGame();
    }

    async playHand() {
        let handScore;
        let currentChips = this.chips;
        let currentCards = this.hand;
        const selectedCards = this.hand.filter(c => c.selected).length;

        // Don't process empty hands
        if (selectedCards != 0 && this.round <= Game.#TOTAL_ROUNDS) {
            handScore = this.getHandScore();
            this.score += handScore.totalScore;
            this.chips += handScore.handChips;
            this.hand = [];
            // Apply recurring joker effects
            this.jokers
                .filter(j => j.effectType === JokerEffectType.GAME_EFFECT)
                .forEach(j => j.effect(this));
            this.round++;
            if (this.round <= Game.#TOTAL_ROUNDS) {
                await this.drawCards(Game.#CARDS_DEALT);
                this.loadJokers();
            }
        }
        return {
            gameOver: this.round > Game.#TOTAL_ROUNDS,
            handPlayed: selectedCards != 0,
            roundScore: handScore ? handScore.totalScore : 0,
            roundChips: this.chips - currentChips,
            removedCards: selectedCards != 0 ? currentCards : [] // used for animation
        }; 
    }

    async newDeck() {
        /*
        Potential Improvement:
            Store the entire deck inside a variable to avoid async calls
            during gameplay
        */
        this.deck = await (await fetch(Game.#CREATE_DECK_URL)).json();
    }

    async drawCards(drawCount = Game.#CARDS_DEALT) {
        const url = `${Game.#DRAW_CARD_URL}${this.deck.deck_id}/draw/?count=${drawCount}`;
        const res = await (await fetch(url)).json();
        res.cards.forEach((c, i) => this.hand.push(new Card(i + 1, c.value, c.suit, c.image)));
        this.hand.forEach((c, i) => c.id = i + 1);
        // Draw additional cards if we don't have a full hand
        if (this.hand.length != Game.#CARDS_DEALT) {
            // Create a new deck first
            await this.newDeck();
            await this.drawCards(Game.#CARDS_DEALT - this.hand.length);
        }
    }

    getHandScore() {
        let cards = this.hand.filter((c) => c.selected).sort((a, b) => b.cardId - a.cardId);
        let handType = HandType.HIGH_CARD;
        if (!cards.length) {
            return {
                totalScore: 0,
                handType: handType,
                baseScore: handType.baseScore,
                handMult: handType.mult,
                handChips: handType.chips
            };
        }

        let isStraight = cards.length == 5;

        for (let i = 1; i < cards.length; i++) {
            if ((cards[i - 1].cardId - cards[i].cardId) !== 1) {
                isStraight = false;
                break;
            }
        }

        if (!isStraight && cards.length == 5 && cards[0].cardId === 14) {
            isStraight = cards[1].cardId === 5 &&
                        cards[2].cardId === 4 &&
                        cards[3].cardId === 3 &&
                        cards[4].cardId === 2;
        }

        let isFlush = cards.length === 5 && cards.every((c) => c.suit == cards[0].suit);

        const rankCounts = {};
        for (const card of cards) {
            rankCounts[card.cardId] = (rankCounts[card.cardId] || 0) + 1;
        }

        const topRankCounts = Object.values(rankCounts).sort((a, b) => b - a);

        if (isStraight && isFlush) {
            handType = HandType.STRAIGHT_FLUSH;
        } else if (cards.length === 4 && topRankCounts[0] === 4) {
            handType = HandType.FOUR_OF_A_KIND;
        } else if (cards.length === 5 && topRankCounts[0] === 3 && topRankCounts[1] === 2) {
            handType = HandType.FULL_HOUSE;
        } else if (isFlush) {
            handType = HandType.FLUSH;
        } else if (isStraight) {
            handType = HandType.STRAIGHT;
        } else if (cards.length === 3 && topRankCounts[0] === 3) {
            handType = HandType.THREE_OF_A_KIND; 
        } else if (cards.length === 4 && topRankCounts[0] === 2 && topRankCounts[1] === 2) {
            handType = HandType.TWO_PAIR;
        } else if (cards.length === 2 && topRankCounts[0] === 2) {
            handType = HandType.PAIR;
        }
        if (handType == HandType.HIGH_CARD) {
            cards = [cards.reduce((acc, card) => acc.value > card.value ? acc : card)];
        }
        const cardScore = handType === HandType.HIGH_CARD 
            ? cards.reduce((score, card) => card.value > score ? card.value : score, 0)
            : cards.reduce((score, card) => score + card.value, 0);

        const jokerHandScore = this.jokers
            .filter(j => j.effectType === JokerEffectType.HAND_EFFECT)
            .reduce((acc, joker) => acc + joker.effect(cards, handType), 0);
        const jokerMult = this.jokers
            .filter(j => j.effectType === JokerEffectType.MULT_EFFECT)
            .reduce((acc, joker) => acc + joker.effect(cards, handType), 0);
        const jokerScore = this.jokers
            .filter(j => j.effectType === JokerEffectType.SCORE_EFFECT)
            .reduce((acc, joker) => acc + joker.effect(this, cards), 0);
        const jokerChips = this.jokers
            .filter(j => j.effectType === JokerEffectType.CHIP_EFFECT)
            .reduce((acc, joker) => acc + joker.effect(cards, handType), 0);

        const handChips = handType.chips + jokerChips;
        const baseScore = (handType.baseScore + cardScore + jokerHandScore);
        const handMult = ((handType.mult * this.mult) + jokerMult);
        const totalScore = (baseScore * handMult) + jokerScore;
        return {
            totalScore: totalScore,
            handType: handType,
            baseScore: baseScore,
            handMult: handMult,
            handChips: handChips,
            cardScore: cardScore
        };
    }

    loadJokers() {
        if (this.jokerStore.length == Game.#MAX_JOKERS) return;
        // Load jokers in the remaining slots available
        const jokerSlots = Game.#MAX_JOKERS - this.jokerStore.length;
        for (let i = 0; i < jokerSlots; i++) {
            // Obtain a random, non held Joker based on the rarity
            const rarity = this.randomRarityByWeight();
            const jokerPool = Game.#JOKERS[rarity].filter((j) => !this.jokers.includes(j) && !this.jokerStore.includes(j));
            this.jokerStore.push(jokerPool[Math.floor(Math.random() * jokerPool.length)]);
        }
    }

    randomRarityByWeight() {
        let total = 0;

        Object.values(RarityProperties).forEach(r => {
            total += r.probability;
        });

        const random = Math.random() * total;

        // Seek cursor to find which area the random is in
        let cursor = 0;
        for (const [_, rarity] of Object.entries(Rarity)) {
            cursor += RarityProperties[rarity].probability;
            if (cursor >= random) {
                return rarity;
            }
        }
        return "never go here";
    }

    selectCard(id) {
        const card = this.hand.find(c => c.id === parseInt(id));
        if (!card) return false;

        let totalSelected = this.hand.reduce((selected, card) => selected += (card.selected ? 1 : 0), 0);
        if (card.selected || totalSelected < Game.#MAX_SELECTED) {
            card.toggleSelected();
        }
        return true;
    }

    buyJoker(jokerName) {
        const joker = this.jokerStore.find(j => j.name === jokerName);
        if (!joker) return false;

        if (Game.#SPECIAL_JOKERS.includes(jokerName) || (this.jokers.length < Game.#MAX_JOKERS && this.chips >= joker.cost)) {
            this.jokerStore = this.jokerStore.filter(j => j.name !== jokerName);
            this.jokers.push(joker);
            this.chips -= joker.cost;
            // Apply the Joker effect if it pertains to the game (e.g. mult)
            this.jokers
                .filter(j => j.effectType === JokerEffectType.GAME_EFFECT)
                .forEach(j => j.effect(this));
        }
        return true;
    }

    burnJoker(jokerName) {
        const joker = this.jokers.find(j => j.name === jokerName);
        if (!joker) return false;
        if (this.jokers.length != 0) {
            this.jokers = this.jokers.filter(j => j.name !== jokerName);
        }
        return true;
    }

    async discardHand() {
        // remove selected cards and add the same number of cards
        const safeCards = this.hand.filter(c => !c.selected);
        const discardCards = this.hand.filter(c => c.selected);
        const discardCount = discardCards.length; //this.hand.length - safeCards.length; 
        if (this.discards >= discardCount) {
            this.discards -= discardCount;
            this.hand = safeCards;
            await this.drawCards(discardCount);
            return discardCards;
        }
        return [];
    }

    setScoreSaved() {
        this.scoreSaved = true;
    }

    get state() {
        const scoreInfo = this.getHandScore();
        return {
            deck: this.deck,
            hand: this.hand,
            jokers: this.jokers, 
            jokerStore: this.jokerStore,
            score: this.score,
            chips: this.chips, 
            discards: this.discards,
            mult: this.mult,
            round: this.round,
            handType: scoreInfo.handType.type,
            handBaseScore: scoreInfo.baseScore,
            handMult: scoreInfo.handMult,
            handChips: scoreInfo.handChips,
            scoreSaved: this.scoreSaved 
        };
    }
}

module.exports = { Game, Card };