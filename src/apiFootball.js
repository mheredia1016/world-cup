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
