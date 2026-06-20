import axios from 'axios';
import { config } from './config.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  timeout: 20000,
  headers: {
    'x-apisports-key': config.apiKey
  }
});

async function safeGet(path, params = {}) {
  await sleep(6500);

  try {
    const { data } = await api.get(path, { params });

    if (data?.errors && Object.keys(data.errors).length) {
      console.log('API-Football warning:', {
        path,
        params,
        errors: data.errors
      });
    }

    return data;
  } catch (err) {
    console.error('API-Football request failed:', {
      path,
      params,
      error: err.response?.data || err.message
    });

    return {
      response: [],
      errors: err.response?.data?.errors || err.message
    };
  }
}

export async function getFixturesByDate(date) {
  const data = await safeGet('/fixtures', {
    date,
    timezone: config.timezone
  });

  const all = data.response || [];

  console.log('All fixtures by date:', {
    date,
    total: all.length
  });

  // ONLY WORLD CUP MATCHES
  const worldCup = all.filter(match => {
    const leagueId = Number(match.league?.id);
    const leagueName = String(match.league?.name || '').toLowerCase();

    return (
      leagueId === 1 ||
      leagueName === 'world cup'
    );
  });

  console.log('World Cup matches found:', {
    date,
    count: worldCup.length,
    matches: worldCup.map(
      m => `${m.teams.home.name} vs ${m.teams.away.name}`
    )
  });

  return worldCup;
}

export async function getFixtureLineups(fixtureId) {
  const data = await safeGet('/fixtures/lineups', {
    fixture: fixtureId
  });

  return data.response || [];
}

export async function getTeamSquad(teamId) {
  const data = await safeGet('/players/squads', {
    team: teamId
  });

  return data.response?.[0]?.players || [];
}
