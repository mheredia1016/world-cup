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

function isWorldCupEvent(event) {
  const text = [
    event.leagueID,
    event.leagueName,
    event.tournament,
    event.name,
    event.homeTeamName,
    event.awayTeamName
  ].filter(Boolean).join(' ').toLowerCase();

  return text.includes('world cup') || text.includes('fifa');
}

export async function getWorldCupEvents() {
  const data = await getJson('/events', {
    leagueID,
    oddsAvailable: 'true',
    finalized: 'false',
    limit: 100
  });

  const events = data.data || data.events || [];
  const worldCupEvents = events.filter(isWorldCupEvent);

  console.log('SportsGameOdds events:', {
    leagueID,
    total: events.length,
    worldCup: worldCupEvents.length,
    games: worldCupEvents.map(e => e.name || `${e.awayTeamName} vs ${e.homeTeamName}`)
  });

  return worldCupEvents;
}

export async function getEventOdds(eventID) {
  const data = await getJson('/events', {
    eventID,
    oddsAvailable: 'true',
    includeAltLines: 'true',
    limit: 1
  });

  const events = data.data || data.events || [];
  return events[0]?.odds || events[0]?.markets || [];
}

export function extractPlayerPropPlays(event) {
  const oddsRows = event.odds || event.markets || event.lines || [];

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
