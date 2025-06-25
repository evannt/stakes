# :spades: Stakes

A web-based poker hand building game designed that challenges players to achieve the highest score possible within 7 rounds.
Build the highest-valued poker hand throughout 7 rounds and use Jokers to increase the score you earn.

## :tv: YouTube Video Demo

[![Demo Video](https://img.youtube.com/vi/XljzCYXUVfU/0.jpg)](https://www.youtube.com/watch?v=XljzCYXUVfU)

## :game_die: Game Functionality

The game is played over 7 rounds. In each round, you're dealt 7 cards and must choose up to 5 cards to form your final hand. After playing a hand you earn score and chips based on the type of hand you played. Chips can be used to purchase jokers, which apply special effects or improve hand scoring. Any chips you have left at the end of a round carry over to the next one. You have the option to discard cards from your current hand to potentially obtain more desierable cards. By default, you may discard up to 3 cards, but jokers can grant additional discards.

## :bar_chart: Scoring System

Four factors contribute to the score: Hand Score (Base Score and Mult), Hand Multiplier, Card Values, and Joker Effects. The Joker Effects may include an increased Card Score, Mult, or total score!

The formula for the total score is as follows:

**Total Score = ((Base Score + Card Values + Joker Card Score) * ((Hand Mult * Mult) + Joker Mult)) + Joker Score**

Note: *Only the cards that form the poker hand contribute to the card values.*

### Hand Score Table

| Type             | Base Score | Mult | Chips |
|------------------|------------|------|-------|
| Straight Flush   | 100        | 8    | 5     |
| Four of a Kind   | 60         | 7    | 3     |
| Full House       | 40         | 4    | 3     |
| Flush            | 35         | 4    | 2     |
| Straight         | 30         | 4    | 2     |
| Three of a Kind  | 30         | 3    | 2     |
| Two Pair         | 20         | 2    | 2     |
| Pair             | 10         | 2    | 1     |
| High Card        | 5          | 1    | 1     |

## :black_joker: Jokers

Jokers are special cards that enhance your hand by applying modifiers that can increase your score, boost multipliers, or alter how your hand is evaluated. Their effects apply only to the five cards that make up your final poker hand—any extra cards that don't contribute to the hand type are ignored. You can hold up to 3 jokers at a time. If you want to obtain a new joker while already at the limit, you can click the "Burn" button on one of your current jokers to remove it and make space. You may also burn a joker at any time as part of your strategy.

## :busts_in_silhouette: Collaborators: 

[@Feenet](https://github.com/Feenet), [@evannt](https://github.com/evannt), [@irA](https://github.com/irA)
