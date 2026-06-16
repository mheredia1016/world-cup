import { config } from './config.js';
import { getPlayerMetric } from './playerMetrics.js';

const CATEGORIES = [
  { key: 'goal', label: '⚽ To Score Watch' },
  { key: 'sot', label: '🎯 Shot on Target Watch' },
  { key: 'shots', label: '🚀 2+ Shots Watch' },
  { key: 'assist', label: '🅰️ Assist Watch' },
  { key: 'card', label: '🟨 Card Watch' }
];

function clamp(n, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

function roleBoost(position, category) {
  const pos = String(position || '').toLowerCase();

  const isForward =
    pos.includes('attacker') ||
    pos.includes('forward') ||
    pos === 'f' ||
    pos === 'lw' ||
    pos === 'rw' ||
    pos === 'st';

  const isMid =
    pos.includes('midfielder') ||
    pos === 'm' ||
    pos === 'cm' ||
    pos === 'am' ||
    pos === 'dm';

  const isDef =
    pos.includes('defender') ||
    pos === 'd' ||
    pos === 'cb' ||
    pos === 'lb' ||
    pos === 'rb';

  if (category === 'goal') {
    if (isForward) return 18;
    if (isMid) return 8;
    return -8;
  }

  if (category === 'sot') {
    if (isForward) return 18;
    if (isMid) return 9;
    return -8;
  }

  if (category === 'shots') {
    if (isForward) return 17;
    if (isMid) return 10;
    return -7;
  }

  if (category === 'assist') {
    if (isMid) return 15;
    if (isForward) return 10;
    return -4;
  }

  if (category === 'card') {
    if (isDef) return 15;
    if (isMid) return 13;
    return -5;
  }

  return 0;
}

function safeMetric(metric, key) {
  return Number(metric?.[key] || 0);
}

function metricScore(metric, category) {
  if (!metric) return 0;

  if (category === 'goal') {
    return (
      safeMetric(metric, 'goals90') * 28 +
      safeMetric(metric, 'xg90') * 26 +
      safeMetric(metric, 'shots90') * 5 +
      safeMetric(metric, 'sot90') * 8 +
      safeMetric(metric, 'penaltyTaker') * 10 +
      safeMetric(metric, 'setPieces') * 3
    );
  }

  if (category === 'sot') {
    return (
      safeMetric(metric, 'sot90') * 28 +
      safeMetric(metric, 'shots90') * 8 +
      safeMetric(metric, 'xg90') * 8 +
      safeMetric(metric, 'minutesProjection') / 12
    );
  }

  if (category === 'shots') {
    return (
      safeMetric(metric, 'shots90') * 18 +
      safeMetric(metric, 'sot90') * 8 +
      safeMetric(metric, 'minutesProjection') / 10 +
      safeMetric(metric, 'setPieces') * 4
    );
  }

  if (category === 'assist') {
    return (
      safeMetric(metric, 'assists90') * 26 +
      safeMetric(metric, 'xa90') * 24 +
      safeMetric(metric, 'keyPasses90') * 8 +
      safeMetric(metric, 'setPieces') * 8 +
      safeMetric(metric, 'minutesProjection') / 16
    );
  }

  if (category === 'card') {
    return (
      safeMetric(metric, 'cards90') * 30 +
      safeMetric(metric, 'tackles90') * 7 +
      safeMetric(metric, 'fouls90') * 9 +
      safeMetric(metric, 'minutesProjection') / 18
    );
  }

  return 0;
}

function getReasons(metric, player, category, lineupStatus) {
  const reasons = [];

  if (lineupStatus === 'starter') {
    reasons.push('Confirmed starter');
  } else if (metric?.minutesProjection >= 70) {
    reasons.push(`${metric.minutesProjection}+ min projection`);
  }

  if (category === 'goal') {
    if (metric?.penaltyTaker) reasons.push('Penalty taker');
    if (metric?.goals90 >= 0.35) reasons.push(`${metric.goals90} goals/90`);
    if (metric?.xg90 >= 0.35) reasons.push(`${metric.xg90} xG/90`);
    if (metric?.shots90 >= 2.4) reasons.push(`${metric.shots90} shots/90`);
  }

  if (category === 'sot') {
    if (metric?.sot90 >= 0.9) reasons.push(`${metric.sot90} SOT/90`);
    if (metric?.shots90 >= 2.2) reasons.push(`${metric.shots90} shots/90`);
  }

  if (category === 'shots') {
    if (metric?.shots90 >= 2.3) reasons.push(`${metric.shots90} shots/90`);
    if (metric?.setPieces) reasons.push('Set-piece involvement');
  }

  if (category === 'assist') {
    if (metric?.setPieces) reasons.push('Set pieces');
    if (metric?.keyPasses90 >= 1.5) reasons.push(`${metric.keyPasses90} key passes/90`);
    if (metric?.xa90 >= 0.2) reasons.push(`${metric.xa90} xA/90`);
  }

  if (category === 'card') {
    if (metric?.cards90 >= 0.25) reasons.push(`${metric.cards90} cards/90`);
    if (metric?.tackles90 >= 2) reasons.push(`${metric.tackles90} tackles/90`);
    if (metric?.fouls90 >= 1.4) reasons.push(`${metric.fouls90} fouls/90`);
  }

  if (!reasons.length) {
    reasons.push(`${player.position || 'Role'} profile`);
  }

  return reasons.slice(0, 4);
}

export function scorePlayers(players, matchName, lineupMap = {}) {
  const plays = [];

  for (const player of players) {
    const metric = getPlayerMetric(player.name);

    for (const category of CATEGORIES) {
      const lineupStatus = lineupMap[player.name] || 'projected';

      let score = 48;

      score += roleBoost(player.position, category.key);
      score += metricScore(metric, category.key);

      if (metric?.formBoost) score += Number(metric.formBoost);
      if (metric?.matchupBoost) score += Number(metric.matchupBoost);

      if (config.enableLineupBoost && lineupStatus === 'starter') score += 12;
      if (config.enableLineupBoost && lineupStatus === 'bench') score -= 20;

      if (!metric) score -= 18;

      score = Math.round(clamp(score));

      if (score < config.minPlayScore) continue;

      plays.push({
        matchName,
        player: player.name,
        position: player.position,
        category: category.key,
        label: category.label,
        score,
        reasons: getReasons(metric, player, category.key, lineupStatus)
      });
    }
  }

  return plays.sort((a, b) => b.score - a.score);
}
