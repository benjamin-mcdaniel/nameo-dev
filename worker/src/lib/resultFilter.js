function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function applyTierFilter(words, tier) {
  if (tier === 'paid') return { visible: words, hiddenCount: 0 };

  const visibleCount = Math.ceil(words.length / 2);
  const shuffled = shuffle(words);
  return {
    visible: shuffled.slice(0, visibleCount),
    hiddenCount: words.length - visibleCount,
  };
}

export function stripToTierData(wordResult, tier) {
  if (tier === 'paid') return wordResult;
  return { word: wordResult.word, tlds: wordResult.tlds };
}
