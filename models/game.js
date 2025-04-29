class Card {
    constructor(rank, suit, image) {
        this.rank = rank;
        this.suit = suit;
        this.image = image;
    }
}

const RARITY = Object.freeze({
    COMMON: { type: "common", probability: 0.70 },
    RARE: { type: "rare", probability: 0.20 },
    LEGENDARY:{ type: "legendary", probability: 0.10 },
});

class Joker {
    constructor(name, rarity, description, effect) {
        this.name = name;
        this.rarity = rarity;
        this.description = description;
        this.effect = effect;
        // add cost
    }
}

class Game {
    static #DECK_COUNT = 3;
    static #CREATE_DECK_URL = `https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=${Game.#DECK_COUNT}`;
    static #DRAW_CARD_URL = `https://deckofcardsapi.com/api/deck/`;

    static #JOKERS = {
        [RARITY.COMMON] : new Joker("Common", RARITY.COMMON, "This is a common Joker", (handScore) => handScore * 1.25), 
        [RARITY.RARE] :  new Joker("Rare", RARITY.RARE, "This is a rare Joker", (handScore) => handScore * 10),
        [RARITY.LEGENDARY] : new Joker("Legendary", RARITY.LEGENDARY, "This is a legendary Joker", (handScore) => handScore * 1000)
    };

    constructor() {
        this.deck = {};
        this.hand = [];
        this.jokers = [];
        this.score = 0;
        this.chips = 0;
        this.multiplier = 1;
        this.round = 1;
        // this.highScore = session.highScore || 0;
        // add high score
    }

    async newDeck() {
        this.deck = await (await fetch(Game.#CREATE_DECK_URL)).json();
        console.log(this.deck);
    }

    async drawCards(drawCount) {
        const url = `${Game.#DRAW_CARD_URL}${this.deck.deck_id}/draw/?count=${drawCount}`;
        const res = await (await fetch(url)).json();
        this.hand = res.cards;
        console.log(this.hand);
    }

    loadJokers() {
        console.log(this.randomByWeight());
    }

    randomByWeight() {
        let total = 0;

        // Sum total of weights
        Object.values(RARITY).forEach(r => {
            total += r.probability;
        });

        // Random a number between [1, total]
        const random = Math.random() * total; // [0,total]

        // Seek cursor to find which area the random is in
        let cursor = 0;
        for (const [rarity, attributes] of Object.entries(RARITY)) {
            cursor += attributes.probability;
            if (cursor >= random) {
                return rarity;
            }
        }
        return "never go here"; // perhaps a fallback of common
    }

}

module.exports = Game;