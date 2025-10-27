/**
 * Bible API Service
 * Uses bolls.life API for fetching Bible verses
 * Free, no authentication required, supports many versions
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
 * Map our version IDs to bolls.life translation codes
 */
const VERSION_MAP: Record<string, string> = {
  'kjv': 'kjv',        // King James Version
  'niv': 'niv',        // New International Version
  'esv': 'esv',        // English Standard Version
  'nkjv': 'nkjv',      // New King James Version
  'nlt': 'nlt',        // New Living Translation
  'nasb': 'nasb',      // New American Standard Bible
  'csb': 'csb',        // Christian Standard Bible
  'msg': 'msg',        // The Message
  'amp': 'amp',        // Amplified Bible
  'tpt': 'tpt',        // The Passion Translation
  'ehv': 'kjv',        // Use KJV as fallback for EHV
};

/**
 * Get the display name for the actual translation being used
 */
export function getActualTranslation(versionId: string): string {
  const versionUpper = versionId.toUpperCase();
  if (versionId === 'ehv' && VERSION_MAP[versionId] === 'kjv') {
    return 'KJV (EHV not available)';
  }
  return versionUpper;
}

/**
 * Parse reference into components
 */
function parseReference(reference: string): { book: string; chapter: number; verse?: number; endVerse?: number } | null {
  // Match patterns like "John 3:16", "Psalm 23:1-6", "Genesis 1:1"
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) {
    return null;
  }

  return {
    book: match[1].trim(),
    chapter: parseInt(match[2]),
    verse: parseInt(match[3]),
    endVerse: match[4] ? parseInt(match[4]) : undefined,
  };
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
    const parsed = parseReference(reference);
    if (!parsed) {
      throw new Error('Invalid reference format. Use format like "John 3:16" or "Psalm 23:1-3"');
    }

    const translation = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
    const { book, chapter, verse, endVerse } = parsed;
    
    // Normalize book name for API
    const bookName = book.toLowerCase().replace(/\s+/g, '');
    
    if (endVerse) {
      // Fetch multiple verses
      const verses = [];
      for (let v = verse!; v <= endVerse; v++) {
        const url = `https://bolls.life/get-verse/${translation.toUpperCase()}/${bookName}/${chapter}/${v}/`;
        console.log('Fetching verse:', url);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch verse: ${response.status}`);
        }
        
        const data = await response.json();
        verses.push({
          verse: v,
          text: data.text || data.verse,
        });
      }
      
      const text = verses.map(v => v.text).join(' ');
      return {
        text,
        reference: `${book} ${chapter}:${verse}-${endVerse}`,
        verses,
      };
    } else {
      // Single verse
      const url = `https://bolls.life/get-verse/${translation.toUpperCase()}/${bookName}/${chapter}/${verse}/`;
      console.log('Fetching verse:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch verse: ${response.status}`);
      }
      
      const data = await response.json();
      const text = data.text || data.verse;
      
      return {
        text,
        reference: `${book} ${chapter}:${verse}`,
        verses: [{ verse, text }],
      };
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
    const translation = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
    const bookName = book.toLowerCase().replace(/\s+/g, '');
    
    const url = `https://bolls.life/get-chapter/${translation.toUpperCase()}/${bookName}/${chapter}/`;
    console.log('Fetching chapter:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // bolls.life returns an array of verses
    const verses = data.map((item: any) => ({
      verse: item.verse || item.pk,
      text: item.text || item.verse_text,
      reference: `${book} ${chapter}:${item.verse || item.pk}`,
    }));
    
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

