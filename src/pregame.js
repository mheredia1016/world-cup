import {
  getWorldCupEvents,
  extractPlayerPropPlays,
  getMatchName
} from './sportsGameOdds.js';

function parseOdds(value) {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(String(value).replace('+', ''));
  return Number.isFinite(n) ? n : 0;
}

function playRank(play) {
  const typeRank = {
    sot: 1,
    shots: 2,
    goal: 3,
    assist: 4,
    saves: 5,
    cards: 6
  };

  const odds = parseOdds(play.price);

  // Prefer normal playable prices over crazy longshots
  const oddsPenalty = odds > 900 ? 50 : 0;

  return (typeRank[play.type] || 99) + oddsPenalty;
}

export async function buildPregameMatches() {
  const events = await getWorldCupEvents();

  return events.map(event => {
    const plays = extractPlayerPropPlays(event);

    plays.sort((a, b) => {
      const rankDiff = playRank(a) - playRank(b);
      if (rankDiff !== 0) return rankDiff;

      return parseOdds(b.price) - parseOdds(a.price);
    });

    return {
      fixtureId: event.eventID || event.id,
      name: getMatchName(event),
      kickoff:
        event.status?.startsAt ||
        event.startsAt ||
        event.startTime ||
        event.commenceTime ||
        'TBD',
      lineupStatus: 'SportsGameOdds Props',
      plays
    };
  });
}
