import {
  getWorldCupEvents,
  extractPlayerPropPlays
} from './sportsGameOdds.js';

export async function buildPregameMatches() {
  const events = await getWorldCupEvents();

  return events.map(event => {
    const plays = extractPlayerPropPlays(event);

    plays.sort((a, b) => {
      const ao = Number(String(a.price || 0).replace('+', ''));
      const bo = Number(String(b.price || 0).replace('+', ''));

      return bo - ao;
    });

    return {
      fixtureId: event.eventID || event.id,
      name:
        event.activity ||
        event.name ||
        `${event.awayTeamName || ''} vs ${event.homeTeamName || ''}`,
      kickoff:
        event.status?.startsAt ||
        event.startsAt ||
        event.startTime ||
        'TBD',
      lineupStatus: 'SportsGameOdds Props',
      plays
    };
  });
}
