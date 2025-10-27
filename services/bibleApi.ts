/**
 * Bible API Service
 * Uses bible-api.com for fetching Bible verses
 * Free, no authentication required
 * Note: Only supports KJV and WEB translations
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
 * Map our version IDs to bible-api.com translation codes
 * Note: bible-api.com only supports KJV and WEB
 */
const VERSION_MAP: Record<string, string> = {
  'kjv': 'kjv',        // King James Version
  'niv': 'web',        // Use WEB as fallback
  'esv': 'web',        // Use WEB as fallback
  'nkjv': 'kjv',       // Use KJV as close alternative
  'nlt': 'web',        // Use WEB as fallback
  'nasb': 'web',       // Use WEB as fallback
  'csb': 'web',        // Use WEB as fallback
  'msg': 'web',        // Use WEB as fallback
  'amp': 'web',        // Use WEB as fallback
  'tpt': 'web',        // Use WEB as fallback
  'ehv': 'kjv',        // Use KJV as fallback
};

/**
 * Get the display name for the actual translation being used
 */
export function getActualTranslation(versionId: string): string {
  const actualId = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
  if (actualId === 'kjv') {
    return versionId.toLowerCase() === 'kjv' || versionId.toLowerCase() === 'nkjv' ? versionId.toUpperCase() : `${versionId.toUpperCase()} (using KJV)`;
  }
  if (actualId === 'web') {
    return `${versionId.toUpperCase()} (using WEB)`;
  }
  return versionId.toUpperCase();
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
    const translation = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
    
    // Clean up the reference
    const cleanReference = reference.trim().replace(/\s+/g, '%20');
    
    // Construct API URL
    const url = `https://bible-api.com/${cleanReference}?translation=${translation}`;
    
    console.log('Fetching verse:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verse: ${response.status} ${response.statusText}`);
    }
    
    const data: BibleApiVerse = await response.json();
    
    // Return formatted data
    return {
      text: data.text.trim(),
      reference: data.reference,
      verses: data.verses,
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
    const translation = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
    const reference = `${book}%20${chapter}`;
    const url = `https://bible-api.com/${reference}?translation=${translation}`;
    
    console.log('Fetching chapter:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
    }
    
    const data: BibleApiVerse = await response.json();
    
    // Format verses
    const verses = data.verses.map(v => ({
      verse: v.verse,
      text: v.text.trim(),
      reference: `${v.book_name} ${v.chapter}:${v.verse}`,
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

