'use client';

/**
 * 100% Client-Side Transliteration Engine (Browser Only, Zero VPS).
 *
 * Converts non-Latin scripts (Bengali, Hindi, Arabic, Urdu, Japanese, Korean,
 * Chinese, Russian, Tamil, Telugu, Thai, Greek, etc.) into readable English/Latin
 * letters while keeping the exact same language (Transliteration, not Translation).
 *
 * Strategy:
 *  1. Direct browser-side phonetic romanization via CORS-enabled endpoint
 *     (`Access-Control-Allow-Origin: *`), batched with exact 1-to-1 line alignment.
 *  2. Automatic pure-JS offline script transliteration fallback if offline or blocked.
 */

export function hasNonLatinScript(text: string): boolean {
  // Matches characters outside Basic Latin, Latin-1 Supplement, Latin Extended-A/B, and common punctuation
  return /[^\u0000-\u024F\u1E00-\u1EFF\u2000-\u206F\s]/.test(text);
}

export function hasNonAsciiCharacters(text: string): boolean {
  return /[^\u0000-\u007F]/.test(text);
}

// ---------- Pure-JS Offline Client-Side Script Transliteration Fallback ----------

const BENGALI_VOWELS: Record<string, string> = {
  'অ': 'o',
  'আ': 'a',
  'ই': 'i',
  'ঈ': 'ee',
  'উ': 'u',
  'ঊ': 'oo',
  'ঋ': 'ri',
  'এ': 'e',
  'ঐ': 'oi',
  'ও': 'o',
  'ঔ': 'ou',
};

const BENGALI_MATRAS: Record<string, string> = {
  'া': 'a',
  'ি': 'i',
  'ী': 'ee',
  'ু': 'u',
  'ূ': 'oo',
  'ৃ': 'ri',
  'ে': 'e',
  'ৈ': 'oi',
  'ো': 'o',
  'ৌ': 'ou',
};

const BENGALI_CONSONANTS: Record<string, string> = {
  'ক': 'k',
  'খ': 'kh',
  'গ': 'g',
  'ঘ': 'gh',
  'ঙ': 'ng',
  'চ': 'ch',
  'ছ': 'chh',
  'জ': 'j',
  'ঝ': 'jh',
  'ঞ': 'n',
  'ট': 't',
  'ঠ': 'th',
  'ড': 'd',
  'ঢ': 'dh',
  'ণ': 'n',
  'ত': 't',
  'থ': 'th',
  'দ': 'd',
  'ধ': 'dh',
  'ন': 'n',
  'প': 'p',
  'ফ': 'ph',
  'ব': 'b',
  'ভ': 'bh',
  'ম': 'm',
  'য': 'j',
  'র': 'r',
  'ল': 'l',
  'শ': 'sh',
  'ষ': 'sh',
  'স': 's',
  'হ': 'h',
  'ড়': 'r',
  'ঢ়': 'rh',
  'য়': 'y',
  'ৎ': 't',
};

const BENGALI_SIGNS: Record<string, string> = {
  'ং': 'ng',
  'ঃ': 'h',
  'ঁ': 'n',
  '।': '.',
  '॥': '.',
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const DEVANAGARI_VOWELS: Record<string, string> = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo',
  'ऋ': 'ri', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'am', 'अः': 'ah',
};

const DEVANAGARI_MATRAS: Record<string, string> = {
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ः': 'h', 'ँ': 'n',
};

const DEVANAGARI_CONSONANTS: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh',
  'ष': 'sh', 'स': 's', 'ह': 'h', 'ळ': 'l', 'क़': 'q',
  'ख़': 'kh', 'ग़': 'gh', 'ज़': 'z', 'ड़': 'r', 'ढ़': 'rh', 'फ़': 'f',
};

const ARABIC_CHAR_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa', 'ب': 'b', 'پ': 'p', 'ت': 't',
  'ث': 'th', 'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'd',
  'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q', 'ك': 'k',
  'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 'ة': 'a',
  'و': 'w', 'ؤ': 'u', 'ي': 'y', 'ی': 'y', 'ئ': 'y', 'ى': 'a', 'ء': "'",
  'ٹ': 't', 'ڈ': 'd', 'ڑ': 'r', 'ں': 'n', 'ے': 'e', 'ہ': 'h', 'ھ': 'h',
  'َ': 'a', 'ُ': 'u', 'ِ': 'i', 'ّ': '', 'ْ': '', 'ً': 'an', 'ٌ': 'un', 'ٍ': 'in',
  '،': ',', '؛': ';', '؟': '?', '۔': '.',
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
};

const CYRILLIC_MAP: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
  'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
  'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch',
  'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
  'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
};

const GREEK_MAP: Record<string, string> = {
  'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i',
  'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x',
  'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y',
  'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
};

const KANA_MAP: Record<string, string> = {
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'wo', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'ー': '-', '。': '.', '、': ',', '「': '"', '」': '"',
};

const HANGUL_INITIALS = [
  'g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's',
  'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h',
];
const HANGUL_MEDIALS = [
  'a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa',
  'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i',
];
const HANGUL_FINALS = [
  '', 'k', 'k', 'ks', 'n', 'nj', 'nh', 't', 'l', 'lk',
  'lm', 'lb', 'ls', 'lt', 'lp', 'lh', 'm', 'p', 'ps', 't',
  't', 'ng', 't', 't', 'k', 't', 'p', 't',
];

function transliterateBengaliWord(word: string): string {
  const chars = Array.from(word);
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (ch === '্' || ch === '়') {
      continue;
    }

    if (BENGALI_VOWELS[ch]) {
      out += BENGALI_VOWELS[ch];
      continue;
    }

    if (BENGALI_MATRAS[ch]) {
      out += BENGALI_MATRAS[ch];
      continue;
    }

    if (BENGALI_SIGNS[ch]) {
      out += BENGALI_SIGNS[ch];
      continue;
    }

    if (BENGALI_CONSONANTS[ch]) {
      out += BENGALI_CONSONANTS[ch];
      // Add inherent 'o' when consonant is not followed by hasant, matra, or end of word
      const hasMatraNext = Boolean(next && BENGALI_MATRAS[next]);
      const hasHasantNext = next === '্';
      const isLastChar = i === chars.length - 1 || !BENGALI_CONSONANTS[next || ''];
      if (!hasMatraNext && !hasHasantNext && !isLastChar) {
        out += 'o';
      }
      continue;
    }

    out += ch;
  }

  return out;
}

function transliterateDevanagariWord(word: string): string {
  const chars = Array.from(word);
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (ch === '्' || ch === '़') {
      continue;
    }
    if (ch === '।') {
      out += '.';
      continue;
    }
    if (DEVANAGARI_VOWELS[ch]) {
      out += DEVANAGARI_VOWELS[ch];
      continue;
    }
    if (DEVANAGARI_MATRAS[ch]) {
      out += DEVANAGARI_MATRAS[ch];
      continue;
    }
    if (DEVANAGARI_CONSONANTS[ch]) {
      out += DEVANAGARI_CONSONANTS[ch];
      const hasMatraNext = Boolean(next && DEVANAGARI_MATRAS[next]);
      const hasHalantNext = next === '्';
      const isEndOfWord = i === chars.length - 1;
      if (!hasMatraNext && !hasHalantNext && !isEndOfWord) {
        out += 'a';
      }
      continue;
    }
    out += ch;
  }

  return out;
}

/**
 * Pure-JS zero-network transliteration fallback executed strictly in the browser.
 */
export function transliterateTextPureJs(input: string): string {
  if (!input) return '';

  // Fold accented Latin characters first (e.g., café -> cafe)
  let text = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

  // Handle Bengali words
  text = text.replace(/[\u0980-\u09FF]+/g, (word) => transliterateBengaliWord(word));

  // Handle Devanagari words
  text = text.replace(/[\u0900-\u097F]+/g, (word) => transliterateDevanagariWord(word));

  // Character-by-character pass for Hangul, Kana, Arabic/Urdu, Cyrillic, Greek
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);

    // Korean Hangul Syllables
    if (code >= 0xac00 && code <= 0xd7a3) {
      const sIndex = code - 0xac00;
      const initial = Math.floor(sIndex / 588);
      const medial = Math.floor((sIndex % 588) / 28);
      const final = sIndex % 28;
      out +=
        (HANGUL_INITIALS[initial] || '') +
        (HANGUL_MEDIALS[medial] || '') +
        (HANGUL_FINALS[final] || '');
      continue;
    }

    if (KANA_MAP[ch] !== undefined) {
      out += KANA_MAP[ch];
      continue;
    }

    if (ARABIC_CHAR_MAP[ch] !== undefined) {
      out += ARABIC_CHAR_MAP[ch];
      continue;
    }

    const lower = ch.toLowerCase();
    const isUpper = ch !== lower;

    if (CYRILLIC_MAP[lower] !== undefined) {
      const mapped = CYRILLIC_MAP[lower];
      out += isUpper && mapped ? mapped[0].toUpperCase() + mapped.slice(1) : mapped;
      continue;
    }

    if (GREEK_MAP[lower] !== undefined) {
      const mapped = GREEK_MAP[lower];
      out += isUpper && mapped ? mapped[0].toUpperCase() + mapped.slice(1) : mapped;
      continue;
    }

    out += ch;
  }

  return out;
}

// ---------- Browser-Side Direct CORS Romanization + Offline JS Fallback ----------

function normalizeForLineBatch(text: string): string {
  return text.replace(/[\r\n]+/g, ' ').trim();
}

function extractRomanizationFromPayload(data: unknown): string | null {
  if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
  const rows = data[0] as unknown[];

  const sourceRomanParts: string[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    // In dt=rm response, row[3] holds the source-language romanization
    if (typeof row[3] === 'string' && row[3].trim()) {
      sourceRomanParts.push(row[3]);
    }
  }

  if (sourceRomanParts.length > 0) {
    return sourceRomanParts.join('');
  }
  return null;
}

async function fetchClientSideRomanizationChunk(
  lines: string[],
  sourceLang: string
): Promise<string[] | null> {
  if (lines.length === 0) return [];

  const cleanLines = lines.map(normalizeForLineBatch);
  const joined = cleanLines.join('\n');

  try {
    const sl = sourceLang && sourceLang !== 'auto' ? sourceLang : 'auto';
    const endpoint = `https://translate.googleapis.com/translate_a/single?client=at&dt=rm&sl=${encodeURIComponent(
      sl
    )}&tl=en`;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);

    const body = new URLSearchParams({ q: joined });
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: body.toString(),
      signal: controller.signal,
    });

    window.clearTimeout(timer);
    if (!res.ok) return null;

    const json = (await res.json()) as unknown;
    const romanized = extractRomanizationFromPayload(json);
    if (!romanized) return null;

    const splitLines = romanized.split(/\r?\n/).map((l) => l.trim());
    if (splitLines.length === cleanLines.length) {
      return splitLines;
    }

    // If line count mismatches, split chunk recursively down to smaller batches for 1-to-1 accuracy
    if (cleanLines.length > 1) {
      const mid = Math.ceil(cleanLines.length / 2);
      const [left, right] = await Promise.all([
        fetchClientSideRomanizationChunk(cleanLines.slice(0, mid), sourceLang),
        fetchClientSideRomanizationChunk(cleanLines.slice(mid), sourceLang),
      ]);
      if (left && right) {
        return [...left, ...right];
      }
    }

    return null;
  } catch {
    return null;
  }
}

export interface ClientTransliterationResult {
  segments: string[];
  mode: 'browser-phonetic' | 'pure-js-offline';
}

/**
 * Transliterates all transcript segments strictly on the client side (in the browser).
 * Never calls our backend or any VPS.
 */
export async function transliterateSegmentsClientSide(
  segments: string[],
  sourceLang: string = 'auto',
  onProgress?: (completed: number, total: number) => void
): Promise<ClientTransliterationResult> {
  if (segments.length === 0) {
    return { segments: [], mode: 'pure-js-offline' };
  }

  // If everything is already plain ASCII Latin, return immediately
  const combinedSample = segments.slice(0, 30).join(' ');
  if (!hasNonAsciiCharacters(combinedSample) && !segments.some(hasNonAsciiCharacters)) {
    return { segments: [...segments], mode: 'pure-js-offline' };
  }

  // Build character-budgeted chunks (~1800 chars max per batch) for fast client-side execution
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  let currentChars = 0;

  for (const seg of segments) {
    const clean = normalizeForLineBatch(seg);
    if (currentChunk.length >= 25 || (currentChars + clean.length > 1800 && currentChunk.length > 0)) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChars = 0;
    }
    currentChunk.push(clean);
    currentChars += clean.length + 1;
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  const outputSegments: string[] = [];
  let usedBrowserPhonetic = false;
  let processedCount = 0;

  for (const chunk of chunks) {
    const romanized = await fetchClientSideRomanizationChunk(chunk, sourceLang);
    if (romanized && romanized.length === chunk.length) {
      usedBrowserPhonetic = true;
      for (let i = 0; i < romanized.length; i++) {
        const candidate = romanized[i]?.trim();
        // Ensure any residual non-Latin chars are also folded locally
        outputSegments.push(
          candidate
            ? hasNonLatinScript(candidate)
              ? transliterateTextPureJs(candidate)
              : candidate
            : transliterateTextPureJs(chunk[i])
        );
      }
    } else {
      // Offline / blocked fallback: pure JS client-side transliteration
      for (const line of chunk) {
        outputSegments.push(transliterateTextPureJs(line));
      }
    }

    processedCount += chunk.length;
    onProgress?.(processedCount, segments.length);
  }

  return {
    segments: outputSegments,
    mode: usedBrowserPhonetic ? 'browser-phonetic' : 'pure-js-offline',
  };
}
