import axios from 'axios';

const API_BASE = 'https://api.sportsgameodds.com/v2';

const apiKey = process.env.SPORTSGAMEODDS_API_KEY;
const leagueID = process.env.SGO_LEAGUE_ID || 'INTERNATIONAL_SOCCER';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(path, params = {}) {
  await sleep(500);

  const { data } = await axios.get(`${API_BASE}${path}`, {
    headers: {
      'x-api-key': apiKey,
      accept: 'application/json'
    },
    params
  });

  return data;
}

const WORLD_CUP_TEAMS = [
  'argentina', 'australia', 'belgium', 'brazil', 'canada', 'chile',
  'colombia', 'croatia', 'denmark', 'ecuador', 'england', 'france',
  'germany', 'ghana', 'iran', 'italy', 'japan', 'mexico', 'morocco',
  'netherlands', 'poland', 'portugal', 'qatar', 'saudi arabia',
  'senegal', 'serbia', 'south korea', 'spain', 'switzerland',
  'tunisia', 'united states', 'usa', 'uruguay', 'wales'
];

function isWorldCupEvent(event) {
  const text = [
    event.leagueID,
    event.leagueName,
    event.tournament,
    event.name,
    event.homeTeamName,
    event.awayTeamName,
    event.homeTeamID,
    event.awayTeamID
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (text.includes('world cup') || text.includes('fifa')) return true;

  const matchesTeam = WORLD_CUP_TEAMS.some(team => text.includes(team));

  return matchesTeam;
}

export async function getWorldCupEvents() {
  const data = await getJson('/events', {
    leagueID,
    oddsAvailable: 'true',
    finalized: 'false',
    includeAltLines: 'true',
    limit: 100
  });

  const events = data.data || data.events || [];

  console.log('SportsGameOdds raw events:', events.map(e => ({
    id: e.eventID || e.id,
    leagueID: e.leagueID,
    leagueName: e.leagueName,
    name: e.name,
    home: e.homeTeamName,
    away: e.awayTeamName,
    start: e.startTime || e.startDate || e.commenceTime
  })));

  const worldCupEvents = events.filter(isWorldCupEvent);

  console.log('SportsGameOdds filtered events:', {
    leagueID,
    total: events.length,
    filtered: worldCupEvents.length,
    games: worldCupEvents.map(e => e.name || `${e.awayTeamName} vs ${e.homeTeamName}`)
  });

  return worldCupEvents;
}

export function extractPlayerPropPlays(event) {
  const oddsRows = event.odds || event.markets || event.lines || [];

  console.log('Odds rows for event:', {
    event: event.name || `${event.awayTeamName} vs ${event.homeTeamName}`,
    rows: oddsRows.length
  });

  const plays = [];

  for (const row of oddsRows) {
    const marketText = [
      row.oddID,
      row.marketID,
      row.marketName,
      row.statID,
      row.statName,
      row.name,
      row.selectionName
    ].filter(Boolean).join(' ').toLowerCase();

    const isWanted =
      marketText.includes('score') ||
      marketText.includes('goal') ||
      marketText.includes('shot') ||
      marketText.includes('assist') ||
      marketText.includes('card') ||
      marketText.includes('save');

    if (!isWanted) continue;

    const player =
      row.playerName ||
      row.participantName ||
      row.selectionName ||
      row.name;

    if (!player) continue;

    plays.push({
      eventID: event.eventID || event.id,
      matchName: event.name || `${event.awayTeamName} vs ${event.homeTeamName}`,
      player,
      market: row.marketName || row.statName || row.oddID || 'Player Prop',
      line: row.line ?? row.points ?? row.handicap ?? '',
      price: row.price ?? row.odds ?? row.americanOdds ?? '',
      sportsbook: row.bookmakerName || row.sportsbook || row.bookmakerID || '',
      raw: row
    });
  }

  return plays;
}
