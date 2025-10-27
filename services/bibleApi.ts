/**
 * Bible API Service
 * Uses bible-api.com for fetching Bible verses
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
 * Map our version IDs to bible-api.com translation IDs
 */
const VERSION_MAP: Record<string, string> = {
  'kjv': 'kjv',
  'niv': 'web', // bible-api.com doesn't have NIV, use WEB as fallback
  'esv': 'web', // bible-api.com doesn't have ESV, use WEB as fallback
  'nkjv': 'kjv', // Use KJV as fallback
  'nlt': 'web', // Use WEB as fallback
  'nasb': 'web', // Use WEB as fallback
  'csb': 'web', // Use WEB as fallback
  'msg': 'web', // Use WEB as fallback
  'ehv': 'web', // Use WEB as fallback
};

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
    // Clean up the reference
    const cleanReference = reference.trim().replace(/\s+/g, '%20');
    
    // Map version to API translation
    const translationId = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
    
    // Construct API URL
    const url = `https://bible-api.com/${cleanReference}?translation=${translationId}`;
    
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
    const reference = `${book}%20${chapter}`;
    const translationId = VERSION_MAP[versionId.toLowerCase()] || 'kjv';
    const url = `https://bible-api.com/${reference}?translation=${translationId}`;
    
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

