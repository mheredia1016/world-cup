import fs from 'fs';

const METRICS_PATH = './data/player-metrics.json';

let cache = null;

export function loadPlayerMetrics() {
  if (cache) return cache;

  if (!fs.existsSync(METRICS_PATH)) {
    cache = {};
    return cache;
  }

  const raw = fs.readFileSync(METRICS_PATH, 'utf8');
  cache = JSON.parse(raw);

  return cache;
}

export function getPlayerMetric(playerName) {
  const metrics = loadPlayerMetrics();
  const key = normalizeName(playerName);

  return metrics[key] || null;
}

export function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
