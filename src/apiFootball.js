import axios from 'axios';
import { config } from './config.js';

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  timeout: 20000,
  headers: {
    'x-apisports-key': config.apiKey
  }
});

export async function getFixturesByDate(date) {
  const { data } = await api.get('/fixtures', {
    params: {
      date,
      timezone: config.timezone
    }
  });

  const all = data.response || [];

  console.log('All fixtures by date:', {
    date,
    total: all.length,
    errors: data.errors
  });

  const worldCup = all.filter(x => {
    const leagueName = String(x.league?.name || '').toLowerCase();
    const country = String(x.league?.country || '').toLowerCase();

    return (
      leagueName.includes('world cup') ||
      leagueName.includes('fifa') ||
      country.includes('world')
    );
  });

  console.log('World Cup filtered:', {
    date,
    results: worldCup.length,
    leagues: [...new Set(worldCup.map(x => `${x.league.id} - ${x.league.name}`))]
  });

  return worldCup;
}

export async function getFixtureLineups(fixtureId) {
  const { data } = await api.get('/fixtures/lineups', {
    params: { fixture: fixtureId }
  });

  return data.response || [];
}

export async function getTeamSquad(teamId) {
  const { data } = await api.get('/players/squads', {
    params: { team: teamId }
  });

  return data.response?.[0]?.players || [];
}
