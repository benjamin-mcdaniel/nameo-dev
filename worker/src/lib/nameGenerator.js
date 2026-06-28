const VOWELS = new Set('aeiou');
const ALL_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const CONSONANTS = ALL_LETTERS.split('').filter(c => !VOWELS.has(c)).join('');

function isVowel(c) { return VOWELS.has(c); }

export function isValidShort(word) {
  if (!word || word.length < 2 || word.length > 6) return false;
  const chars = [...word];
  if (!chars.every(c => /^[a-z]$/.test(c))) return false;
  if (!chars.some(c => isVowel(c))) return false;

  let run = 1;
  for (let i = 1; i < chars.length; i++) {
    if (isVowel(chars[i]) === isVowel(chars[i - 1])) {
      if (++run > 2) return false;
    } else {
      run = 1;
    }
  }
  return true;
}

export function generateRandomShorts(count, excludeSet = new Set()) {
  const results = [];
  const seen = new Set(excludeSet);
  let attempts = 0;

  while (results.length < count && attempts < count * 30) {
    attempts++;
    const len = 2 + Math.floor(Math.random() * 5); // 2–6
    const word = generateOne(len);
    if (word && !seen.has(word)) {
      seen.add(word);
      results.push(word);
    }
  }
  return results;
}

function generateOne(len) {
  const chars = [];
  let prevIsVowel = null;
  let run = 0;

  for (let i = 0; i < len; i++) {
    const forceVowel = prevIsVowel === false && run >= 2;
    const forceConsonant = prevIsVowel === true && run >= 2;

    let pool;
    if (forceVowel) pool = 'aeiou';
    else if (forceConsonant) pool = CONSONANTS;
    else pool = ALL_LETTERS;

    const c = pool[Math.floor(Math.random() * pool.length)];
    chars.push(c);

    const v = isVowel(c);
    run = v === prevIsVowel ? run + 1 : 1;
    prevIsVowel = v;
  }

  const word = chars.join('');
  return [...word].some(c => isVowel(c)) ? word : null;
}
