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

function hasConfirmedLineups(event) {
  return Boolean(
    event.lineupsConfirmed ||
    event.confirmedLineups ||
    event.playersConfirmed ||
    event.status?.lineupsConfirmed ||
    event.status?.confirmedLineups ||
    event.lineups?.confirmed ||
    event.lineups?.home ||
    event.lineups?.away
  );
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
  const oddsPenalty = odds > 900 ? 50 : 0;

  return (typeRank[play.type] || 99) + oddsPenalty;
}

export async function buildPregameMatches() {
  const events = await getWorldCupEvents();

  return events
    .map(event => {
      const matchName = getMatchName(event);

      if (
        process.env.REQUIRE_LINEUPS_CONFIRMED === 'true' &&
        !hasConfirmedLineups(event)
      ) {
        console.log('Skipping, lineups not confirmed:', matchName);
        return null;
      }

      const plays = extractPlayerPropPlays(event);

      plays.sort((a, b) => {
        const rankDiff = playRank(a) - playRank(b);
        if (rankDiff !== 0) return rankDiff;

        return parseOdds(b.price) - parseOdds(a.price);
      });

      return {
        fixtureId: event.eventID || event.id,
        name: matchName,
        kickoff:
          event.status?.startsAt ||
          event.startsAt ||
          event.startTime ||
          event.commenceTime ||
          'TBD',
        lineupStatus: 'Confirmed lineups only',
        plays
      };
    })
    .filter(Boolean);
}
