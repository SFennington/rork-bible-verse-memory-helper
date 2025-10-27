/**
 * Bible API Service
 * Uses GetBible.net API for fetching Bible verses
 * Free, no authentication required, supports multiple translations
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
 * Map our version IDs to GetBible translation codes
 */
const VERSION_MAP: Record<string, string> = {
  'kjv': 'kjv',        // King James Version
  'niv': 'niv',        // New International Version  
  'esv': 'esv',        // English Standard Version (if not available, will fallback)
  'nkjv': 'nkjv',      // New King James Version
  'nlt': 'nlt',        // New Living Translation
  'nasb': 'nasb',      // New American Standard Bible
  'csb': 'csb',        // Christian Standard Bible (if not available, will fallback)
  'msg': 'msg',        // The Message (if not available, will fallback)
  'amp': 'amp',        // Amplified Bible
  'tpt': 'tpt',        // The Passion Translation (if not available, will fallback)
  'ehv': 'kjv',        // Use KJV as fallback
};

/**
 * Get the display name for the actual translation being used
 */
export function getActualTranslation(versionId: string): string {
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
    
    // Clean up the reference for GetBible API
    const cleanReference = reference.trim().replace(/\s+/g, '+');
    
    // Construct GetBible API URL
    const url = `https://getbible.net/json?passage=${cleanReference}&version=${translation}`;
    
    console.log('Fetching verse:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch verse: ${response.status} ${response.statusText}`);
    }
    
    const rawText = await response.text();
    
    // GetBible returns JSONP, need to strip the callback wrapper
    const jsonText = rawText.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonText);
    
    // GetBible returns data in book.chapter format
    const bookData = data.book[0];
    if (!bookData || !bookData.chapter) {
      throw new Error('Invalid response from Bible API');
    }
    
    // Extract verses
    const verses = Object.values(bookData.chapter).map((v: any) => ({
      verse: parseInt(v.verse_nr),
      text: v.verse.trim(),
    }));
    
    const text = verses.map((v: any) => v.text).join(' ');
    
    return {
      text,
      reference: bookData.book_name + ' ' + bookData.chapter_nr + ':' + verses.map((v: any) => v.verse).join('-'),
      verses,
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
    const passage = `${book}+${chapter}`;
    const url = `https://getbible.net/json?passage=${passage}&version=${translation}`;
    
    console.log('Fetching chapter:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch chapter: ${response.status} ${response.statusText}`);
    }
    
    const rawText = await response.text();
    
    // GetBible returns JSONP, need to strip the callback wrapper
    const jsonText = rawText.replace(/^[^(]*\(/, '').replace(/\);?\s*$/, '');
    const data = JSON.parse(jsonText);
    
    const bookData = data.book[0];
    if (!bookData || !bookData.chapter) {
      throw new Error('Invalid response from Bible API');
    }
    
    // Format verses
    const verses = Object.values(bookData.chapter).map((v: any) => ({
      verse: parseInt(v.verse_nr),
      text: v.verse.trim(),
      reference: `${bookData.book_name} ${bookData.chapter_nr}:${v.verse_nr}`,
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

