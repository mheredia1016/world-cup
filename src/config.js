import 'dotenv/config';

function num(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  apiKey: process.env.API_FOOTBALL_KEY,
  webhook: process.env.WORLD_CUP_PREGAME_WEBHOOK,

  leagueId: process.env.WC_LEAGUE_ID || '1',
  season: process.env.WC_SEASON || '2026',
  timezone: process.env.TIMEZONE || 'America/Chicago',

  postHour: num(process.env.POST_HOUR, 8),
  postMinute: num(process.env.POST_MINUTE, 0),

  daysAhead: num(process.env.DAYS_AHEAD, 1),
  topPlaysPerMatch: num(process.env.TOP_PLAYS_PER_MATCH, 10),
  minPlayScore: num(process.env.MIN_PLAY_SCORE, 72),

  enableLineupBoost: String(process.env.ENABLE_LINEUP_BOOST || 'true') === 'true'
};
