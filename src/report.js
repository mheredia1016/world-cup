function groupByLabel(plays) {
  return plays.reduce((acc, play) => {
    acc[play.label] ||= [];
    acc[play.label].push(play);
    return acc;
  }, {});
}

export function buildPregameReport(matches) {
  if (!matches.length) {
    return '🌎 **World Cup Pregame Plays**\n\nNo World Cup matches found.';
  }

  let out = '🌎 **World Cup Pregame Plays**\n';
  out += '_Data-driven watch list. Not betting odds._\n\n';

  for (const match of matches) {
    out += '━━━━━━━━━━━━━━\n';
    out += `**${match.name}**\n`;
    out += `Kickoff: ${match.kickoff}\n`;
    out += `Lineups: ${match.lineupStatus}\n\n`;

    if (!match.plays.length) {
      out += '_No qualified plays found._\n\n';
      continue;
    }

    const grouped = groupByLabel(match.plays);

    for (const [label, plays] of Object.entries(grouped)) {
      out += `${label}\n`;

      for (const play of plays.slice(0, 3)) {
        out += `• **${play.player}** — ${play.score} score\n`;
        out += `  ${play.reasons.join(' • ')}\n`;
      }

      out += '\n';
    }
  }

  return out.trim();
}
