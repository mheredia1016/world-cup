import cron from 'node-cron';
import { config } from './config.js';
import { buildPregameMatches } from './pregame.js';
import { buildPregameReport } from './report.js';
import { postToDiscord } from './discord.js';

async function runPregamePost() {
  try {
    console.log('Building World Cup pregame plays...');

    const matches = await buildPregameMatches();
    const report = buildPregameReport(matches);

    console.log(report);

    await postToDiscord(report);

    console.log('Posted World Cup pregame plays.');
  } catch (err) {
    console.error('World Cup bot failed:', err.response?.data || err.message);
  }
}

const runNow =
  process.argv.includes('--test') ||
  process.argv.includes('--once');

if (runNow) {
  await runPregamePost();
  process.exit(0);
}

const cronTime = `${config.postMinute} ${config.postHour} * * *`;

console.log(`World Cup bot running. Posting at ${cronTime} ${config.timezone}`);

cron.schedule(
  cronTime,
  runPregamePost,
  {
    timezone: config.timezone
  }
);
