/**
 * AI Service for generating prayers from Bible verses
 * 
 * This service generates contextual prayers based on Bible verses.
 * For production use, you would integrate with OpenAI or similar API.
 */

import { PrayerCategory } from '@/types/prayer';

interface VerseData {
  reference: string;
  text: string;
  category: string;
}

interface GeneratedPrayer {
  title: string;
  description: string;
  category: PrayerCategory;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Generate a prayer based on a Bible verse
 * 
 * For production: Replace this with actual AI API integration (OpenAI, Claude, etc.)
 * For now, uses template-based generation
 */
export async function generatePrayerFromVerse(verse: VerseData): Promise<GeneratedPrayer> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Map verse category to prayer category
  const categoryMap: Record<string, PrayerCategory> = {
    'Comfort': 'Personal',
    'Strength': 'Personal',
    'Peace': 'Personal',
    'Love': 'Family',
    'Faith': 'Personal',
    'Hope': 'Personal',
    'Promises': 'Thanksgiving',
  };

  const prayerCategory = categoryMap[verse.category] || 'Personal';

  // Generate prayer title based on verse
  const title = `Prayer from ${verse.reference}`;

  // Generate prayer description
  // In production, this would use AI to generate a contextual prayer
  const description = generatePrayerText(verse);

  return {
    title,
    description,
    category: prayerCategory,
    priority: 'medium',
  };
}

/**
 * Generate prayer text based on verse
 * This is a simple template-based approach
 * In production, replace with AI API call
 */
function generatePrayerText(verse: VerseData): string {
  const templates = [
    `Heavenly Father, Your Word in ${verse.reference} speaks of Your truth. As I meditate on "${getFirstWords(verse.text)}", help me to live out this truth in my daily life. Guide me and strengthen my faith according to Your promises. In Jesus' name, Amen.`,
    
    `Lord, thank You for the wisdom found in ${verse.reference}. As I reflect on these words - "${getFirstWords(verse.text)}" - I ask that You would help me apply this truth to my circumstances. Let Your Word dwell richly in my heart. Amen.`,
    
    `Dear God, I come before You with gratitude for ${verse.reference}. "${getFirstWords(verse.text)}" - May these words transform my heart and mind. Give me the strength to walk in Your ways and the wisdom to understand Your will. In Christ's name, Amen.`,
    
    `Father God, Your promise in ${verse.reference} fills me with hope. When You say "${getFirstWords(verse.text)}", I am reminded of Your faithfulness. Help me to trust in Your Word and rest in Your presence. Thank You for Your unfailing love. Amen.`,
  ];

  // Select a random template
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Get first 50 characters of verse text for prayer generation
 */
function getFirstWords(text: string): string {
  if (text.length <= 50) return text;
  
  // Find a good breaking point (space) before 50 chars
  const truncated = text.substring(0, 50);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return text.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * For production use with actual AI API:
 * 
 * Example OpenAI integration:
 * 
 * export async function generatePrayerFromVerse(verse: VerseData): Promise<GeneratedPrayer> {
 *   const response = await fetch('https://api.openai.com/v1/chat/completions', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${YOUR_API_KEY}`,
 *     },
 *     body: JSON.stringify({
 *       model: 'gpt-4',
 *       messages: [
 *         {
 *           role: 'system',
 *           content: 'You are a prayer assistant. Generate heartfelt, biblically-grounded prayers based on scripture verses.',
 *         },
 *         {
 *           role: 'user',
 *           content: `Generate a prayer based on this Bible verse:\n${verse.reference}: "${verse.text}"\n\nCreate a personal, meaningful prayer that reflects on this verse.`,
 *         },
 *       ],
 *       max_tokens: 200,
 *     }),
 *   });
 *   
 *   const data = await response.json();
 *   const prayerText = data.choices[0].message.content;
 *   
 *   return {
 *     title: `Prayer from ${verse.reference}`,
 *     description: prayerText,
 *     category: determinePrayerCategory(verse.category),
 *     priority: 'medium',
 *   };
 * }
 */

