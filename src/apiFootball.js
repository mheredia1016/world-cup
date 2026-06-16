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
      league: config.leagueId,
      season: config.season,
      date,
      timezone: config.timezone
    }
  });

  return data.response || [];
}

export async function getFixtureLineups(fixtureId) {
  const { data } = await api.get('/fixtures/lineups', {
    params: {
      fixture: fixtureId
    }
  });

  return data.response || [];
}

export async function getTeamSquad(teamId) {
  const { data } = await api.get('/players/squads', {
    params: {
      team: teamId
    }
  });

  return data.response?.[0]?.players || [];
}
