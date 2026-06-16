import { config } from './config.js';

export function getDateStrings(daysAhead = 1) {
  const dates = [];
  const now = new Date();

  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  return dates;
}

export function formatKickoff(isoDate) {
  const date = new Date(isoDate);

  return new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}
