import {
  getWorldCupEvents,
  getEventOdds,
  extractPlayerPropPlays
} from './sportsGameOdds.js';
import { config } from './config.js';

function groupPlaysForMatch(event, plays) {
  return plays
    .slice(0, config.topPlaysPerMatch || 10)
    .map(play => ({
      player: play.player,
      label: `🎯 ${play.market}`,
      score: 80,
      reasons: [
        play.line ? `Line: ${play.line}` : null,
        play.price ? `Odds: ${play.price}` : null,
        play.sportsbook ? `Book: ${play.sportsbook}` : null
      ].filter(Boolean)
    }));
}

export async function buildPregameMatches() {
  const events = await getWorldCupEvents();
  const matches = [];

  for (const event of events) {
    const eventID = event.eventID || event.id;

    if (!eventID) continue;

    const oddsRows = await getEventOdds(eventID);
    const rawPlays = extractPlayerPropPlays(event, oddsRows);

    matches.push({
      fixtureId: eventID,
      name: event.name || `${event.awayTeamName} vs ${event.homeTeamName}`,
      kickoff: event.startTime || event.startDate || event.commenceTime || 'TBD',
      lineupStatus: 'Using SportsGameOdds player prop markets',
      plays: groupPlaysForMatch(event, rawPlays)
    });
  }

  return matches;
}
