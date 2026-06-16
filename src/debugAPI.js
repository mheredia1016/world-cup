import 'dotenv/config';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://v3.football.api-sports.io',
  headers: {
    'x-apisports-key': process.env.API_FOOTBALL_KEY
  }
});

async function run() {
  const tests = [
    { league: 1, season: 2026 },
    { league: 15, season: 2026 },
    { league: 1, season: 2025 }
  ];

  for (const t of tests) {
    const { data } = await api.get('/fixtures', {
      params: {
        league: t.league,
        season: t.season,
        from: '2026-06-16',
        to: '2026-06-20',
        timezone: 'America/Chicago'
      }
    });

    console.log('TEST', t, {
      results: data.response?.length || 0,
      errors: data.errors
    });

    console.log(
      data.response?.slice(0, 3).map(x => ({
        id: x.fixture.id,
        date: x.fixture.date,
        league: x.league,
        teams: `${x.teams.home.name} vs ${x.teams.away.name}`
      }))
    );
  }
}

run().catch(err => {
  console.error(err.response?.data || err.message);
});
