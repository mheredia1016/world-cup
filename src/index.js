import cron from 'node-cron';
import fs from 'fs';
import { config } from './config.js';
import { buildPregameMatches } from './pregame.js';
import { buildPregameReport } from './report.js';
import { postToDiscord } from './discord.js';

const STATE_PATH = './data/state.json';

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return {
      postedPregame: {},
      postedLineups: {}
    };
  }

  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

async function scanWorldCup() {
  try {
    console.log('Scanning World Cup games and lineups...');

    const state = loadState();
    const matches = await buildPregameMatches();

    for (const match of matches) {
      const id = String(match.fixtureId);

      // Post once when game appears
      if (!state.postedPregame[id]) {
        const report = buildPregameReport([match]);
        await postToDiscord(report);

        state.postedPregame[id] = {
          match: match.name,
          postedAt: new Date().toISOString()
        };

        saveState(state);
        console.log(`Posted pregame: ${match.name}`);
      }

      // Repost/update once official lineups are detected
      if (
        match.lineupStatus === 'Official lineups detected' &&
        !state.postedLineups[id]
      ) {
        const report =
          `🚨 **WORLD CUP LINEUPS UPDATE**\n\n` +
          buildPregameReport([match]);

        await postToDiscord(report);

        state.postedLineups[id] = {
          match: match.name,
          postedAt: new Date().toISOString()
        };

        saveState(state);
        console.log(`Posted lineup update: ${match.name}`);
      }
    }

    console.log(`Scan complete. Matches found: ${matches.length}`);
  } catch (err) {
    console.error('World Cup scan failed:', err.response?.data || err.message);
  }
}

const runNow =
  process.argv.includes('--test') ||
  process.argv.includes('--once');

if (runNow) {
  await scanWorldCup();
  process.exit(0);
}

// Runs every 5 minutes
console.log('World Cup scanner running every 5 minutes.');

cron.schedule(
  '*/5 * * * *',
  scanWorldCup,
  {
    timezone: config.timezone
  }
);

// Run once on startup too
await scanWorldCup();
