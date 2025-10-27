/**
 * Bible API Service
 * Uses API.Bible (scripture.api.bible) for fetching Bible verses
 * Supports 2,500+ Bible versions
 */

// API.Bible Key - Get your own at https://scripture.api.bible
const API_BIBLE_KEY = 'a91be2ec7ed5f7cf61c0f60e5331be8f';
const API_BIBLE_BASE = 'https://api.scripture.api.bible/v1';

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
 * Map our version IDs to API.Bible translation IDs
 */
const VERSION_MAP: Record<string, string> = {
  'kjv': 'de4e12af7f28f599-02', // King James Version
  'niv': '78a9f6124f344018-01', // New International Version
  'esv': 'f421fe261da7624f-01', // English Standard Version
  'nkjv': '65eec8e0b60e656b-01', // New King James Version
  'nlt': '6bab4d6c61b31b80-01', // New Living Translation
  'nasb': '78a9f6124f344018-02', // New American Standard Bible
  'csb': 'c315fa9f71d4af3a-01', // Christian Standard Bible
  'msg': '5c0562691b7f7cee-01', // The Message
  'ehv': 'de4e12af7f28f599-02', // Use KJV as fallback for EHV (not available)
};

/**
 * Get the display name for the actual translation being used
 */
export function getActualTranslation(versionId: string): string {
  const versionUpper = versionId.toUpperCase();
  if (versionId === 'ehv' && VERSION_MAP[versionId] === VERSION_MAP['kjv']) {
    return 'KJV (EHV not available)';
  }
  return versionUpper;
}

/**
 * Normalize book name for API.Bible
 */
function normalizeBookName(reference: string): string {
  const bookAbbreviations: Record<string, string> = {
    'ps': 'PSA', 'psalms': 'PSA', 'psalm': 'PSA',
    'gen': 'GEN', 'genesis': 'GEN',
    'exo': 'EXO', 'exodus': 'EXO',
    'jhn': 'JHN', 'john': 'JHN',
    'mat': 'MAT', 'matthew': 'MAT',
    'mrk': 'MRK', 'mark': 'MRK',
    'luk': 'LUK', 'luke': 'LUK',
    'rom': 'ROM', 'romans': 'ROM',
  };
  
  const parts = reference.split(/\s+/);
  const bookPart = parts[0].toLowerCase();
  const abbrev = bookAbbreviations[bookPart];
  
  if (abbrev) {
    return reference.replace(parts[0], abbrev);
  }
  
  return reference.toUpperCase();
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
    // Map version to API.Bible translation ID
    const bibleId = VERSION_MAP[versionId.toLowerCase()] || VERSION_MAP['kjv'];
    
    // Normalize the reference for API.Bible
    const normalizedRef = normalizeBookName(reference.trim()).replace(/\s+/g, '.');
    
    // Construct API.Bible URL
    const url = `${API_BIBLE_BASE}/bibles/${bibleId}/verses/${normalizedRef}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false`;
    
    console.log('Fetching verse from API.Bible:', url);
    
    const response = await fetch(url, {
      headers: {
        'api-key': API_BIBLE_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verse: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // API.Bible returns data in a different format
    const verseData = data.data;
    const text = verseData.content.replace(/[\[\]]/g, '').trim(); // Remove verse markers
    
    // Return formatted data
    return {
      text: text,
      reference: verseData.reference,
      verses: [{ text: text, verse: 1 }],
    };
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
    const bibleId = VERSION_MAP[versionId.toLowerCase()] || VERSION_MAP['kjv'];
    const reference = `${book} ${chapter}`;
    const normalizedRef = normalizeBookName(reference).replace(/\s+/g, '.');
    
    const url = `${API_BIBLE_BASE}/bibles/${bibleId}/chapters/${normalizedRef}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`;
    
    console.log('Fetching chapter from API.Bible:', url);
    
    const response = await fetch(url, {
      headers: {
        'api-key': API_BIBLE_KEY,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const chapterData = data.data;
    
    // API.Bible returns chapter content with verse markers like [1], [2], etc.
    // Split by verse numbers to get individual verses
    const content = chapterData.content;
    const verseMatches = content.match(/\[(\d+)\]\s*([^\[]+)/g);
    
    if (!verseMatches) {
      throw new Error('Could not parse chapter verses');
    }
    
    const verses = verseMatches.map((match: string) => {
      const verseMatch = match.match(/\[(\d+)\]\s*(.+)/);
      if (!verseMatch) return null;
      
      const verseNum = parseInt(verseMatch[1]);
      const text = verseMatch[2].trim();
      
      return {
        verse: verseNum,
        text: text,
        reference: `${book} ${chapter}:${verseNum}`,
      };
    }).filter((v): v is { verse: number; text: string; reference: string } => v !== null);
    
    return { verses };
  } catch (error) {
    console.error('Error fetching Bible chapter:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to fetch chapter. Please check the reference and try again.'
    );
  }
}

