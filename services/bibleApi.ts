/**
 * Bible API Service
 * Uses API.Bible (with API key) or fallback to bible-api.com
 * 
 * With API key: Access to 2,500+ Bible versions
 * Without API key: Limited to KJV and WEB only
 */

export interface BibleApiVerse {
  reference: string;
  verses: Array<{
    book_id: string;
    book_name: string;
    chapter: number;
    verse: number;
    text: string;
  }>;
  text: string;
  translation_id: string;
  translation_name: string;
  translation_note: string;
}

/**
 * API.Bible version IDs (used when API key is configured)
 */
const API_BIBLE_VERSION_MAP: Record<string, string> = {
  'kjv': 'de4e12af7f28f599-02',  // King James Version
  'niv': 'bba9f40183526463-01',  // New International Version
  'esv': 'f421fe261da7624f-01',  // English Standard Version
  'nkjv': 'b0e5d7d6b2593a19-01', // New King James Version
  'nlt': '92b75ca09ce26d1f-01',  // New Living Translation
  'nasb': 'a2d1836f0-25ca0c6-01', // New American Standard Bible
  'csb': 'a4df5bb40c7e0e00-01',  // Christian Standard Bible
  'msg': '9a9de5901c63e6e0-01',  // The Message
  'amp': '65eec8e0b60e656b-02',  // Amplified Bible
  'tpt': '3fd1c6c4d0c17389-01',  // The Passion Translation
  'ehv': 'de4e12af7f28f599-02',  // Fallback to KJV
};

/**
 * Fallback version map for bible-api.com (no API key)
 */
const FALLBACK_VERSION_MAP: Record<string, string> = {
  'kjv': 'kjv',
  'nkjv': 'kjv',
  'nasb': 'web',
  'niv': 'web',
  'esv': 'web',
  'nlt': 'web',
  'csb': 'web',
  'msg': 'web',
  'amp': 'web',
  'tpt': 'web',
  'ehv': 'kjv',
};

// Store API key globally
let globalApiKey: string | null = null;

export function setGlobalApiKey(apiKey: string | null) {
  globalApiKey = apiKey;
}

export function getGlobalApiKey(): string | null {
  return globalApiKey;
}

/**
 * Get the display name for the actual translation being used
 */
export function getActualTranslation(versionId: string): string {
  const hasApiKey = !!globalApiKey;
  
  if (hasApiKey) {
    // With API key, all versions are supported
    return versionId.toUpperCase();
  }
  
  // Without API key, show fallback warnings
  const fallbackId = FALLBACK_VERSION_MAP[versionId.toLowerCase()] || 'kjv';
  const requestedAbbr = versionId.toUpperCase();
  
  if (fallbackId === 'kjv') {
    return requestedAbbr === 'KJV' ? 'KJV' : `${requestedAbbr} (using KJV)`;
  }
  if (fallbackId === 'web') {
    return `${requestedAbbr} (using WEB)`;
  }
  return requestedAbbr;
}

/**
 * Fetch a Bible verse from the API
 * @param reference - Bible reference (e.g., "John 3:16", "Psalm 23:1-3")
 * @param versionId - Bible version ID (e.g., "kjv", "niv")
 * @returns Promise with verse data
 */
export async function fetchBibleVerse(
  reference: string,
  versionId: string = 'kjv'
): Promise<{ text: string; reference: string; verses: any[] }> {
  try {
    if (globalApiKey) {
      // Use API.Bible with API key
      return await fetchFromApiBible(reference, versionId);
    } else {
      // Fallback to bible-api.com
      return await fetchFromBibleApiCom(reference, versionId);
    }
  } catch (error) {
    console.error('Error fetching Bible verse:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch verse. Please check the reference and try again.'
    );
  }
}

/**
 * Fetch from API.Bible (requires API key)
 */
async function fetchFromApiBible(
  reference: string,
  versionId: string
): Promise<{ text: string; reference: string; verses: any[] }> {
  const bibleId = API_BIBLE_VERSION_MAP[versionId.toLowerCase()] || API_BIBLE_VERSION_MAP['kjv'];
  
  // Normalize reference for API.Bible (e.g., "John 3:16" -> "JHN.3.16")
  const normalizedRef = normalizeReferenceForApiBible(reference);
  
  const url = `https://api.scripture.api.bible/v1/bibles/${bibleId}/verses/${normalizedRef}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`;
  
  console.log('Fetching from API.Bible:', url);
  
  const response = await fetch(url, {
    headers: {
      'api-key': globalApiKey!,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch verse: ${response.status}`);
  }
  
  const data = await response.json();
  
  return {
    text: data.data.content.trim(),
    reference: data.data.reference,
    verses: [{
      book_name: data.data.bibleId,
      chapter: 1,
      verse: 1,
      text: data.data.content.trim(),
    }],
  };
}

/**
 * Fetch from bible-api.com (no API key required, limited versions)
 */
async function fetchFromBibleApiCom(
  reference: string,
  versionId: string
): Promise<{ text: string; reference: string; verses: any[] }> {
  const translation = FALLBACK_VERSION_MAP[versionId.toLowerCase()] || 'kjv';
  const cleanReference = reference.trim().replace(/\s+/g, '%20');
  const url = `https://bible-api.com/${cleanReference}?translation=${translation}`;
  
  console.log('Fetching from bible-api.com:', url);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch verse: ${response.status}`);
  }
  
  const data: BibleApiVerse = await response.json();
  
  return {
    text: data.text.trim(),
    reference: data.reference,
    verses: data.verses,
  };
}

/**
 * Normalize reference for API.Bible format
 * e.g., "John 3:16" -> "JHN.3.16"
 */
function normalizeReferenceForApiBible(reference: string): string {
  const bookMap: Record<string, string> = {
    'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM', 'deuteronomy': 'DEU',
    'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT', '1 samuel': '1SA', '2 samuel': '2SA',
    '1 kings': '1KI', '2 kings': '2KI', '1 chronicles': '1CH', '2 chronicles': '2CH',
    'ezra': 'EZR', 'nehemiah': 'NEH', 'esther': 'EST', 'job': 'JOB', 'psalm': 'PSA', 'psalms': 'PSA',
    'proverbs': 'PRO', 'ecclesiastes': 'ECC', 'song of solomon': 'SNG',
    'isaiah': 'ISA', 'jeremiah': 'JER', 'lamentations': 'LAM', 'ezekiel': 'EZK', 'daniel': 'DAN',
    'hosea': 'HOS', 'joel': 'JOL', 'amos': 'AMO', 'obadiah': 'OBA', 'jonah': 'JON',
    'micah': 'MIC', 'nahum': 'NAM', 'habakkuk': 'HAB', 'zephaniah': 'ZEP', 'haggai': 'HAG',
    'zechariah': 'ZEC', 'malachi': 'MAL',
    'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN',
    'acts': 'ACT', 'romans': 'ROM', '1 corinthians': '1CO', '2 corinthians': '2CO',
    'galatians': 'GAL', 'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL',
    '1 thessalonians': '1TH', '2 thessalonians': '2TH', '1 timothy': '1TI', '2 timothy': '2TI',
    'titus': 'TIT', 'philemon': 'PHM', 'hebrews': 'HEB', 'james': 'JAS',
    '1 peter': '1PE', '2 peter': '2PE', '1 john': '1JN', '2 john': '2JN', '3 john': '3JN',
    'jude': 'JUD', 'revelation': 'REV',
  };
  
  // Parse reference (e.g., "John 3:16" or "John 3:16-17")
  const match = reference.match(/^([a-z0-9\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/i);
  if (!match) {
    return reference; // Return as-is if can't parse
  }
  
  const book = match[1].trim().toLowerCase();
  const chapter = match[2];
  const verse = match[3];
  const endVerse = match[4];
  
  const bookCode = bookMap[book] || book.toUpperCase();
  
  if (endVerse) {
    return `${bookCode}.${chapter}.${verse}-${bookCode}.${chapter}.${endVerse}`;
  }
  
  return `${bookCode}.${chapter}.${verse}`;
}

/**
 * Fetch an entire chapter
 * @param book - Book name (e.g., "John", "Psalm")
 * @param chapter - Chapter number
 * @param versionId - Bible version ID
 * @returns Promise with chapter verses
 */
export async function fetchBibleChapter(
  book: string,
  chapter: number,
  versionId: string = 'kjv'
): Promise<{ verses: Array<{ verse: number; text: string; reference: string }> }> {
  try {
    if (globalApiKey) {
      // Use API.Bible for chapter fetch (fetch verse range)
      const reference = `${book} ${chapter}`;
      const result = await fetchFromBibleApiCom(reference, versionId);
      return { verses: result.verses.map(v => ({
        verse: v.verse,
        text: v.text.trim(),
        reference: `${v.book_name} ${v.chapter}:${v.verse}`,
      })) };
    } else {
      // Fallback to bible-api.com
      const translation = FALLBACK_VERSION_MAP[versionId.toLowerCase()] || 'kjv';
      const reference = `${book}%20${chapter}`;
      const url = `https://bible-api.com/${reference}?translation=${translation}`;
      
      console.log('Fetching chapter:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chapter: ${response.status}`);
      }
      
      const data: BibleApiVerse = await response.json();
      
      const verses = data.verses.map(v => ({
        verse: v.verse,
        text: v.text.trim(),
        reference: `${v.book_name} ${v.chapter}:${v.verse}`,
      }));
      
      return { verses };
    }
  } catch (error) {
    console.error('Error fetching Bible chapter:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch chapter. Please check the reference and try again.'
    );
  }
}

