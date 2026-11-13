/**
 * ZUKAI HINGLISH DICTIONARY & GLOSSARY
 * Version: 1.0.0
 * Standardizes Romanized Hindi spellings to ensure reliable TTS phonetics
 * and clean on-screen transcript rendering.
 */

export const HINGLISH_SPELLING_DICTIONARY: Record<string, string> = {
  // Common connective words & pronouns
  ye: 'yeh',
  vo: 'woh',
  wo: 'woh',
  hy: 'hai',
  he: 'hai',
  hn: 'hain',
  hane: 'hain',
  kse: 'kaise',
  kese: 'kaise',
  kyu: 'kyun',
  kyon: 'kyun',
  kyuki: 'kyunki',
  qki: 'kyunki',
  coz: 'kyunki',
  smjh: 'samajh',
  samjho: 'samajh',
  hmsha: 'hamesha',
  hmesha: 'hamesha',
  blkl: 'bilkul',
  bilkulll: 'bilkul',
  pr: 'par',
  lkn: 'lekin',
  farq: 'farak',
  frk: 'farak',
  faida: 'fayda',
  fayeda: 'fayda',
  nuksaan: 'nuksan',
  zyada: 'zyada',
  jyada: 'zyada',
  accha: 'achha',
  acha: 'achha',
  chahiye: 'chahiye',
  chaiye: 'chahiye',
  hoga: 'hoga',
  hogi: 'hogi',
  honge: 'honge',
  hota: 'hota',
  hoti: 'hoti',
  hote: 'hote',
  sakte: 'sakte',
  sakti: 'sakti',
  sakta: 'sakta',
};

/**
 * Stoplist of overly formal / textbook "Google Translate Hindi" words
 * paired with their natural conversational Hinglish replacements.
 */
export const HINGLISH_FORMAL_STOPLIST: Record<string, string> = {
  pranali: 'system',
  sanganak: 'computer',
  labhansh: 'dividend',
  upyogkarta: 'users',
  gananatmak: 'calculated',
  anurodh: 'request',
  prastutkarta: 'author',
  vikasit: 'develop',
  suchana: 'information',
  sandesh: 'message',
  karyapranali: 'workflow',
  adhikrit: 'authorized',
  mulya: 'price',
  samayavadh: 'timeline',
};

/**
 * Standardizes raw text spellings against the dictionary.
 */
export function normalizeHinglishSpelling(text: string): string {
  if (!text) return '';
  return text.replace(/\b[a-zA-Z]+\b/g, (word) => {
    const lower = word.toLowerCase();
    const replacement = HINGLISH_SPELLING_DICTIONARY[lower];
    if (!replacement) return word;

    // Preserve first-letter capitalization if applicable
    if (word[0] === word[0].toUpperCase()) {
      return replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    return replacement;
  });
}

/**
 * Detects presence of forbidden Devanagari script characters.
 */
export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Flags any stiff formal words that should be natural conversational equivalents.
 */
export function detectFormalHindiAntiPatterns(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const flagged: string[] = [];
  for (const w of words) {
    if (HINGLISH_FORMAL_STOPLIST[w] && !flagged.includes(w)) {
      flagged.push(w);
    }
  }
  return flagged;
}

