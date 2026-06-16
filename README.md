# World Cup Plays Bot

Webhook-only Discord bot for data-driven World Cup pregame plays.

## What it posts

- To Score Watch
- Shot on Target Watch
- 2+ Shots Watch
- Assist Watch
- Card Watch

The bot uses API-Football for fixtures, squads, and lineups, then combines that with your editable local player metrics file.

## Install

```bash
npm install
```

## Local setup

Copy `.env.example` to `.env` and fill in:

```env
API_FOOTBALL_KEY=
WORLD_CUP_PREGAME_WEBHOOK=
```

## Test

```bash
npm run test
```

## Run

```bash
npm start
```

## Railway

Start command:

```bash
npm start
```

Add the same variables from `.env.example` in Railway Variables.

## Player metrics

Edit:

```txt
data/player-metrics.json
```

Keys are normalized player names, lowercase, no accents.

Example:

```json
"lionel messi": {
  "goals90": 0.58,
  "xg90": 0.46,
  "shots90": 3.8,
  "sot90": 1.5,
  "assists90": 0.32,
  "xa90": 0.34,
  "keyPasses90": 2.6,
  "cards90": 0.08,
  "tackles90": 0.4,
  "fouls90": 0.5,
  "penaltyTaker": 1,
  "setPieces": 1,
  "minutesProjection": 85,
  "formBoost": 6,
  "matchupBoost": 0
}
```
