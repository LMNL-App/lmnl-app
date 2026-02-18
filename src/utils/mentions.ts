import { supabase } from '../lib/supabase';

/**
 * Extract @username mentions from text
 */
export function extractMentions(text: string): string[] {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

/**
 * Create notification entries for mentioned users
 */
export async function notifyMentionedUsers(
  text: string,
  actorId: string,
  postId: string
): Promise<void> {
  const usernames = extractMentions(text);
  if (usernames.length === 0) return;

  try {
    // Look up user IDs for the mentioned usernames
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, username')
      .in('username', usernames);

    if (error || !profiles) return;

    // Filter out self-mentions
    const mentionedUsers = profiles.filter(p => p.id !== actorId);
    if (mentionedUsers.length === 0) return;

    // Create notifications
    const notifications = mentionedUsers.map(user => ({
      user_id: user.id,
      actor_id: actorId,
      type: 'mention' as const,
      post_id: postId,
      content: text.slice(0, 100),
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (error) {
    console.error('Error notifying mentioned users:', error);
  }
}
