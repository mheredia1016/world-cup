import axios from 'axios';

const API_BASE = 'https://api.sportsgameodds.com/v2';

const apiKey = process.env.SPORTSGAMEODDS_API_KEY;
const leagueID = process.env.SGO_LEAGUE_ID || 'INTERNATIONAL_SOCCER';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isoHoursFromNow(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
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

  if (!data.success) {
    throw data;
  }

  return data;
}

function teamName(team) {
  return (
    team?.names?.long ||
    team?.names?.medium ||
    team?.names?.short ||
    team?.teamID ||
    ''
  );
}

function getMatchName(event) {
  const away = teamName(event.teams?.away);
  const home = teamName(event.teams?.home);

  if (away && home) return `${away} vs ${home}`;

  return event.eventID;
}

function getKickoff(event) {
  return event.status?.startsAt || event.startsAt || 'TBD';
}

function oddsArray(event) {
  if (!event.odds || typeof event.odds !== 'object') return [];
  return Object.values(event.odds);
}

function playerNameFromOdd(event, odd) {
  const playerID = odd.playerID || odd.statEntityID;
  const player = event.players?.[playerID];

  return (
    player?.name ||
    `${player?.firstName || ''} ${player?.lastName || ''}`.trim() ||
    parsePlayerFromMarket(odd.marketName) ||
    playerID
  );
}

function parsePlayerFromMarket(marketName = '') {
  const cleaned = String(marketName)
    .replace(' To Record First Goal Yes/No (Full Match)', '')
    .replace(' To Record Last Goal Yes/No (Full Match)', '')
    .replace(' Any Goals + Assists Yes/No (Full Match)', '')
    .replace(' Anytime Goalscorer Yes/No (Full Match)', '')
    .replace(' Shots On Target Over/Under (Full Match)', '')
    .replace(' Shots Over/Under (Full Match)', '')
    .replace(' Assists Over/Under (Full Match)', '')
    .replace(' Cards Over/Under (Full Match)', '')
    .trim();

  return cleaned || '';
}

function isPlayerProp(odd) {
  if (!odd.playerID) return false;

  const text = [
    odd.oddID,
    odd.marketName,
    odd.statID,
    odd.betTypeID,
    odd.sideID
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    text.includes('goal') ||
    text.includes('score') ||
    text.includes('shot') ||
    text.includes('assist') ||
    text.includes('card') ||
    text.includes('save')
  );
}

function bestBook(odd) {
  const books = odd.byBookmaker || {};
  let best = null;

  for (const [book, row] of Object.entries(books)) {
    if (!row?.available || !row.odds) continue;

    if (!best) {
      best = { book, odds: row.odds, deeplink: row.deeplink || '' };
      continue;
    }

    const current = Number(String(row.odds).replace('+', ''));
    const previous = Number(String(best.odds).replace('+', ''));

    if (Number.isFinite(current) && Number.isFinite(previous) && current > previous) {
      best = { book, odds: row.odds, deeplink: row.deeplink || '' };
    }
  }

  return best;
}

export async function getWorldCupEvents() {
  const data = await getJson('/events', {
    leagueID,
    type: 'match',
    oddsAvailable: true,
    finalized: false,
    started: false,
    startsAfter: isoHoursFromNow(-3),
    startsBefore: isoHoursFromNow(36),
    includeAltLines: true,
    limit: 100
  });

  const events = data.data || [];

  console.log('SGO events found:', events.map(e => ({
    eventID: e.eventID,
    leagueID: e.leagueID,
    match: getMatchName(e),
    startsAt: getKickoff(e),
    odds: oddsArray(e).length,
    players: Object.keys(e.players || {}).length
  })));

  return events;
}

export function extractPlayerPropPlays(event) {
  const plays = [];

  for (const odd of oddsArray(event)) {
    if (!isPlayerProp(odd)) continue;

    const book = bestBook(odd);
    if (!book && !odd.bookOdds && !odd.fairOdds) continue;

    const player = playerNameFromOdd(event, odd);
    if (!player) continue;

    plays.push({
      eventID: event.eventID,
      matchName: getMatchName(event),
      player,
      market: odd.marketName || odd.statID || 'Player Prop',
      line: odd.bookOverUnder || odd.fairOverUnder || odd.bookSpread || odd.fairSpread || '',
      price: book?.odds || odd.bookOdds || odd.fairOdds || '',
      sportsbook: book?.book || 'consensus',
      deeplink: book?.deeplink || '',
      raw: odd
    });
  }

  console.log('Player props:', {
    match: getMatchName(event),
    props: plays.length
  });

  return plays;
}
