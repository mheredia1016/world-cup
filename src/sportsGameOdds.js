import axios from 'axios';

const API_BASE = 'https://api.sportsgameodds.com/v2';

const apiKey = process.env.SPORTSGAMEODDS_API_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getJson(path, params = {}) {
  await sleep(500);

  const url = `${API_BASE}${path}`;

  const { data } = await axios.get(url, {
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
    event.sportID,
    event.name,
    event.homeTeamName,
    event.awayTeamName
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return (
    text.includes('world cup') ||
    text.includes('fifa') ||
    text.includes('fifa_wc') ||
    text.includes('soccer')
  );
}

export async function getWorldCupEvents() {
  const data = await getJson('/events', {
    sportID: 'SOCCER',
    oddsAvailable: 'true',
    finalized: 'false',
    limit: 100
  });

  const events = data.data || data.events || [];

  const worldCupEvents = events.filter(isWorldCupEvent);

  console.log('SportsGameOdds World Cup events:', {
    total: events.length,
    worldCup: worldCupEvents.length,
    games: worldCupEvents.map(e => e.name || `${e.awayTeamName} vs ${e.homeTeamName}`)
  });

  return worldCupEvents;
}

export async function getEventOdds(eventID) {
  const data = await getJson('/odds', {
    eventID,
    oddsAvailable: 'true',
    includeAltLines: 'true',
    limit: 500
  });

  return data.data || data.odds || [];
}

export function extractPlayerPropPlays(event, oddsRows) {
  const wantedMarkets = [
    'player_to_score',
    'anytime_goal_scorer',
    'player_shots',
    'player_shots_on_target',
    'player_assists',
    'player_cards',
    'goalkeeper_saves'
  ];

  const plays = [];

  for (const row of oddsRows) {
    const marketText = [
      row.marketID,
      row.marketName,
      row.statID,
      row.statName,
      row.name,
      row.selectionName
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const isWanted = wantedMarkets.some(m =>
      marketText.includes(m.replaceAll('_', ' '))
    ) || (
      marketText.includes('shot') ||
      marketText.includes('shots on target') ||
      marketText.includes('score') ||
      marketText.includes('goal scorer') ||
      marketText.includes('assist') ||
      marketText.includes('card') ||
      marketText.includes('saves')
    );

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
      market:
        row.marketName ||
        row.statName ||
        row.marketID ||
        'Player Prop',
      line: row.line ?? row.points ?? row.handicap ?? '',
      price: row.price ?? row.odds ?? row.americanOdds ?? '',
      sportsbook: row.bookmakerName || row.sportsbook || row.bookmakerID || '',
      raw: row
    });
  }

  return plays;
}
