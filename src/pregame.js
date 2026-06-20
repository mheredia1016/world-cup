const allowedBooks = String(process.env.BOOKMAKER_IDS || 'fanduel,draftkings,hardrock,bet365')
  .split(',')
  .map(x => x.trim().toLowerCase());

function isAllowedBook(book) {
  const b = String(book || '').toLowerCase();

  return allowedBooks.some(allowed =>
    b === allowed ||
    b.includes(allowed) ||
    (allowed === 'draftkings' && b.includes('draft')) ||
    (allowed === 'fanduel' && b.includes('fan')) ||
    (allowed === 'hardrock' && b.includes('hard')) ||
    (allowed === 'bet365' && b.includes('365'))
  );
}

function bestBook(odd) {
  const books = odd.byBookmaker || {};
  let best = null;

  for (const [book, row] of Object.entries(books)) {
    if (book === 'consensus') continue;
    if (!isAllowedBook(book)) continue;
    if (!row?.available) continue;

    const odds = row.odds || row.price || row.americanOdds;
    const parsed = parseAmericanOdds(odds);
    if (parsed === null) continue;

    const candidate = {
      book,
      odds,
      deeplink: row.deeplink || row.deepLink || row.link || ''
    };

    if (!best) {
      best = candidate;
      continue;
    }

    if (parseAmericanOdds(candidate.odds) > parseAmericanOdds(best.odds)) {
      best = candidate;
    }
  }

  return best;
}
