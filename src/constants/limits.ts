/**
 * Daily limits configuration for LMNL app
 * These limits are enforced server-side via PostgreSQL triggers
 * Frontend checks are for UX only
 */

export const DAILY_LIMITS = {
  /** Maximum posts per day for standard users */
  POSTS_STANDARD: 5,

  /** Maximum posts per day for verified educational accounts */
  POSTS_EDUCATIONAL: 2,

  /** Maximum likes per day for all users */
  LIKES: 5,

  /** Maximum comments per day for all users */
  COMMENTS: 5,

  /** Maximum posts viewable in feed per day */
  FEED_POSTS: 10,

  /** Number of sponsored posts to show in feed */
  SPONSORED_IN_FEED: 1,
} as const;

/**
 * Get the post limit for a user based on their role and verification status
 */
export function getPostLimit(role: string, isVerified: boolean): number {
  if (role === 'educational_institute' && isVerified) {
    return DAILY_LIMITS.POSTS_EDUCATIONAL;
  }
  return DAILY_LIMITS.POSTS_STANDARD;
}

/**
 * Check if a limit type error message
 */
export function isLimitError(error: string): boolean {
  return error.includes('LIMIT_REACHED:');
}

/**
 * Parse a limit error message
 */
export function parseLimitError(error: string): {
  type: 'posts' | 'likes' | 'comments';
  message: string;
} | null {
  if (!isLimitError(error)) return null;

  const match = error.match(/LIMIT_REACHED:(\w+):(.+)/);
  if (!match) return null;

  return {
    type: match[1] as 'posts' | 'likes' | 'comments',
    message: match[2],
  };
}
