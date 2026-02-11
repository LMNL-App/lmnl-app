/**
 * Hashtag utilities
 * Parse and format hashtags from post content
 */

/**
 * Extract hashtag names from text content
 */
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#([a-zA-Z0-9_]+)/g);
  if (!matches) return [];

  return [...new Set(matches.map(tag => tag.slice(1).toLowerCase()))];
}

/**
 * Check if text contains hashtags
 */
export function hasHashtags(content: string): boolean {
  return /#[a-zA-Z0-9_]+/.test(content);
}

/**
 * Format content with tappable hashtag ranges
 * Returns segments of text where hashtags can be styled differently
 */
export type ContentSegment = {
  text: string;
  isHashtag: boolean;
};

export function parseContentSegments(content: string): ContentSegment[] {
  const regex = /#([a-zA-Z0-9_]+)/g;
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    // Add text before the hashtag
    if (match.index > lastIndex) {
      segments.push({
        text: content.slice(lastIndex, match.index),
        isHashtag: false,
      });
    }

    // Add the hashtag
    segments.push({
      text: match[0],
      isHashtag: true,
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    segments.push({
      text: content.slice(lastIndex),
      isHashtag: false,
    });
  }

  return segments;
}

/**
 * Extract mentions from text content
 */
export function extractMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g);
  if (!matches) return [];

  return [...new Set(matches.map(mention => mention.slice(1).toLowerCase()))];
}
