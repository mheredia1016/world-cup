export function buildPregameReport(matches) {
  if (!matches.length) {
    return '🌎 **WORLD CUP MATCH HUB**\n\nNo matches found.';
  }

  let out = '🌎 **WORLD CUP MATCH HUB**\n\n';

  for (const match of matches) {
    out += '━━━━━━━━━━━━━━━━━━━━\n';
    out += `🏟️ **${match.name}**\n`;
    out += `🕒 ${match.kickoff}\n\n`;

    const plays = match.plays || [];

    if (!plays.length) {
      out += '_No props available._\n\n';
      continue;
    }

    const goals = plays.filter(p =>
      String(p.market).toLowerCase().includes('goal')
    );

    const sots = plays.filter(p =>
      String(p.market).toLowerCase().includes('target')
    );

    const shots = plays.filter(p =>
      String(p.market).toLowerCase().includes('shot')
    );

    const saves = plays.filter(p =>
      String(p.market).toLowerCase().includes('save')
    );

    const singles = [];

    if (sots[0]) singles.push(sots[0]);
    if (shots[0]) singles.push(shots[0]);
    if (goals[0]) singles.push(goals[0]);

    out += '🎯 **TOP SINGLES**\n';

    for (const play of singles.slice(0, 3)) {
      out += `• ${play.player}\n`;
      out += `  ${play.market}\n`;

      if (play.line) {
        out += `  Line: ${play.line}\n`;
      }

      if (play.price) {
        out += `  Odds: ${play.price}\n`;
      }

      if (play.sportsbook) {
        out += `  Book: ${play.sportsbook}\n`;
      }

      out += '\n';
    }

    const safeParlay = [];

    if (sots[0]) safeParlay.push(sots[0]);
    if (shots[0]) safeParlay.push(shots[0]);
    if (saves[0]) safeParlay.push(saves[0]);

    if (safeParlay.length >= 2) {
      out += '🔥 **SAFE PARLAY**\n';

      for (const leg of safeParlay) {
        out += `✅ ${leg.player} - ${leg.market}\n`;
      }

      out += '\n';
    }

    const aggressiveParlay = [];

    if (goals[0]) aggressiveParlay.push(goals[0]);
    if (sots[0]) aggressiveParlay.push(sots[0]);

    if (shots.length > 1) {
      aggressiveParlay.push(shots[1]);
    } else if (shots[0]) {
      aggressiveParlay.push(shots[0]);
    }

    if (aggressiveParlay.length >= 2) {
      out += '🚀 **AGGRESSIVE PARLAY**\n';

      for (const leg of aggressiveParlay) {
        out += `✅ ${leg.player} - ${leg.market}\n`;
      }

      out += '\n';
    }

    const bestLink =
      singles.find(x => x.deeplink) ||
      safeParlay.find(x => x.deeplink) ||
      aggressiveParlay.find(x => x.deeplink);

    if (bestLink?.deeplink) {
      out += '🔗 **BEST LINK**\n';
      out += `${bestLink.deeplink}\n\n`;
    }
  }

  return out;
}
