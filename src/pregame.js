import { getFixturesByDate, getFixtureLineups, getTeamSquad } from './apiFootball.js';
import { getDateStrings, formatKickoff } from './dates.js';
import { scorePlayers } from './scoring.js';
import { config } from './config.js';

function lineupPlayersFromApi(lineups) {
  const players = [];
  const lineupMap = {};

  for (const team of lineups) {
    for (const item of team.startXI || []) {
      const p = item.player;

      players.push({
        name: p.name,
        number: p.number,
        position: p.pos
      });

      lineupMap[p.name] = 'starter';
    }

    for (const item of team.substitutes || []) {
      const p = item.player;

      players.push({
        name: p.name,
        number: p.number,
        position: p.pos
      });

      lineupMap[p.name] = 'bench';
    }
  }

  return { players, lineupMap };
}

async function squadPlayers(homeId, awayId) {
  const [homeSquad, awaySquad] = await Promise.all([
    getTeamSquad(homeId),
    getTeamSquad(awayId)
  ]);

  return [...homeSquad, ...awaySquad].map(p => ({
    name: p.name,
    number: p.number,
    position: p.position
  }));
}

export async function buildPregameMatches() {
  const dates = getDateStrings(config.daysAhead);
  const allMatches = [];

  for (const date of dates) {
    const fixtures = await getFixturesByDate(date);

    for (const fixture of fixtures) {
      const fixtureId = fixture.fixture.id;
      const home = fixture.teams.home;
      const away = fixture.teams.away;

      const matchName = `${home.name} vs ${away.name}`;

      let players = [];
      let lineupMap = {};
      let lineupStatus = 'Projected from squads';

      const lineups = await getFixtureLineups(fixtureId);

      if (lineups.length) {
        const parsed = lineupPlayersFromApi(lineups);
        players = parsed.players;
        lineupMap = parsed.lineupMap;
        lineupStatus = 'Official lineups detected';
      } else {
        players = await squadPlayers(home.id, away.id);
      }

      const plays = scorePlayers(players, matchName, lineupMap)
        .slice(0, config.topPlaysPerMatch);

      allMatches.push({
        fixtureId,
        name: matchName,
        kickoff: formatKickoff(fixture.fixture.date),
        lineupStatus,
        plays
      });
    }
  }

  return allMatches;
}
