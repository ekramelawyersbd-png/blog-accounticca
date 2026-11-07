/**
 * Estimated reading time and word count utility for editorial and statutory articles.
 * Standard average reading speed: 200 - 225 words per minute for professional texts.
 */

export interface ReadingTimeStats {
  minutes: number;
  words: number;
  text: string;
  formattedEstimate: string;
  speedWpm: number;
}

/**
 * Strips markdown markup, image syntax, code blocks, and HTML tags 
 * to compute an accurate word count of actual readable content.
 */
export function cleanMarkdownForWordCount(content: string): string {
  if (!content) return '';
  return content
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' ')
    // Remove inline code
    .replace(/`.*?`/g, ' ')
    // Remove markdown images: ![alt text](url)
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    // Convert links to just link anchor text: [anchor](url) -> anchor
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Remove markdown table dividers and formatting symbols
    .replace(/[#*_~>|\-+=]/g, ' ')
    .trim();
}

/**
 * Calculates reading time stats from text or markdown content.
 */
export function getReadingTimeStats(content: string, wpm: number = 200): ReadingTimeStats {
  if (!content || !content.trim()) {
    return {
      minutes: 1,
      words: 0,
      text: '1 min read',
      formattedEstimate: 'Estimated Reading Time: 1 min',
      speedWpm: wpm,
    };
  }

  const cleanText = cleanMarkdownForWordCount(content);
  // Match contiguous non-whitespace words (compatible with Latin, Bengali, and Unicode alphabets)
  const words = cleanText.split(/\s+/).filter(w => w.trim().length > 0);
  const wordCount = words.length;

  const calculatedMinutes = Math.ceil(wordCount / wpm);
  const minutes = Math.max(1, calculatedMinutes);

  return {
    minutes,
    words: wordCount,
    text: `${minutes} min read`,
    formattedEstimate: `Estimated Reading Time: ${minutes} min`,
    speedWpm: wpm,
  };
}

/**
 * Backwards-compatible calculateReadingTime returning the number of minutes.
 */
export function calculateReadingTime(text: string, wpm: number = 200): number {
  return getReadingTimeStats(text, wpm).minutes;
}
