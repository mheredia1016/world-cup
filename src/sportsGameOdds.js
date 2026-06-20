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

  if (!data.success) throw data;
  return data;
}

function teamName(team) {
  return (
    team?.names?.long ||
    team?.names?.medium ||
    team?.names?.short ||
    team?.name ||
    team?.teamName ||
    team?.teamID ||
    ''
  );
}

export function getMatchName(event) {
  const away = teamName(event.teams?.away);
  const home = teamName(event.teams?.home);

  if (away && home) return `${away} vs ${home}`;

  return (
    event.activity ||
    event.name ||
    event.shortName ||
    event.eventName ||
    event.eventID ||
    'Unknown Match'
  );
}

function oddsArray(event) {
  if (!event.odds || typeof event.odds !== 'object') return [];
  return Object.values(event.odds);
}

function parseAmericanOdds(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(String(value).replace('+', ''));
  return Number.isFinite(n) ? n : null;
}

function bestBook(odd) {
  const books = odd.byBookmaker || {};
  let best = null;

  for (const [book, row] of Object.entries(books)) {
    if (book === 'consensus') continue;
    if (!row?.available) continue;

    const odds = row.odds || row.price || row.americanOdds;
    const parsed = parseAmericanOdds(odds);
    if (parsed === null) continue;

    const candidate = {
      book,
      odds,
      deeplink: row.deeplink || row.deepLink || row.link || ''
    };

    if (!best) {
      best = candidate;
      continue;
    }

    const current = parseAmericanOdds(candidate.odds);
    const previous = parseAmericanOdds(best.odds);

    if (current > previous) best = candidate;
  }

  return best;
}

function playerNameFromOdd(event, odd) {
  const playerID = odd.playerID || odd.statEntityID;
  const player = event.players?.[playerID];

  return (
    player?.name ||
    `${player?.firstName || ''} ${player?.lastName || ''}`.trim() ||
    playerID ||
    ''
  );
}

function propType(odd) {
  const text = String(odd.marketName || odd.statID || '').toLowerCase();

  if (text.includes('shots on target')) return 'sot';
  if (text.includes('any shots') || text.includes('shots over/under')) return 'shots';
  if (text.includes('anytime goalscorer')) return 'goal';
  if (text.includes('goals over/under')) return 'goal';
  if (text.includes('assists')) return 'assist';
  if (text.includes('saves')) return 'saves';
  if (text.includes('cards')) return 'cards';

  return 'other';
}

function isPlayableProp(odd, best) {
  const type = propType(odd);
  const market = String(odd.marketName || '').toLowerCase();
  const odds = parseAmericanOdds(best?.odds);

  if (!best) return false;
  if (odds === null) return false;

  // Kill crazy junk lines like +6364 / +10000.
  if (odds > 2000) return false;

  // Avoid random defender 0.5 goal props.
  if (type === 'goal' && market.includes('goals over/under') && odds > 900) {
    return false;
  }

  return ['sot', 'shots', 'goal', 'assist', 'saves', 'cards'].includes(type);
}

export async function getWorldCupEvents() {
  const data = await getJson('/events', {
    leagueID,
    type: 'match',
    oddsAvailable: true,
    finalized: false,
    started: false,
    includeAltLines: true,
    limit: 100
  });

  const events = data.data || [];

  console.log('SGO events found:', events.map(e => ({
    eventID: e.eventID,
    match: getMatchName(e),
    startsAt: e.status?.startsAt,
    odds: oddsArray(e).length
  })));

  return events;
}

export function extractPlayerPropPlays(event) {
  const plays = [];

  for (const odd of oddsArray(event)) {
    if (!odd.playerID && !odd.statEntityID) continue;

    const book = bestBook(odd);
    if (!isPlayableProp(odd, book)) continue;

    const player = playerNameFromOdd(event, odd);
    if (!player) continue;

    plays.push({
      eventID: event.eventID,
      matchName: getMatchName(event),
      player,
      market: odd.marketName || odd.statID || 'Player Prop',
      type: propType(odd),
      line: odd.bookOverUnder || odd.fairOverUnder || odd.bookSpread || odd.fairSpread || '',
      price: book.odds,
      sportsbook: book.book,
      deeplink: book.deeplink || '',
      raw: odd
    });
  }

  console.log('Player props:', {
    match: getMatchName(event),
    props: plays.length
  });

  return plays;
}
