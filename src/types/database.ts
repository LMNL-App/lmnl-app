/**
 * Database types for LMNL app
 * These types mirror the Supabase database schema
 */

export type UserRole = 'student' | 'professional' | 'educational_institute';
export type ThemePreference = 'light' | 'dark' | 'system';
export type InteractionType = 'like' | 'comment';
export type NotificationType = 'like' | 'comment' | 'follow' | 'mention';
export type Platform = 'ios' | 'android' | 'web';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  role: UserRole;
  is_verified: boolean;
  timezone: string;
  theme_preference: ThemePreference;
  notifications_enabled: boolean;
  notify_likes: boolean;
  notify_comments: boolean;
  notify_follows: boolean;
  notify_mentions: boolean;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  is_sponsored: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  profiles: Profile;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  is_sponsored: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

export interface Interaction {
  id: string;
  user_id: string;
  post_id: string;
  type: InteractionType;
  content: string | null;
  created_at: string;
}

export interface InteractionWithUser extends Interaction {
  profiles: Profile;
}

export interface Comment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface DailyUsage {
  id: string;
  user_id: string;
  date: string;
  posts_count: number;
  likes_count: number;
  comments_count: number;
  posts_viewed: number;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  type: NotificationType;
  post_id: string | null;
  content: string | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationWithActor extends Notification {
  actor: Profile;
  post?: Post;
}

export interface SponsoredPost {
  id: string;
  title: string;
  content: string | null;
  image_url: string;
  sponsor_name: string;
  sponsor_link: string | null;
  cta_text: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface BlockedUser {
  id: string;
  user_id: string;
  blocked_user_id: string;
  created_at: string;
}

export interface MutedUser {
  id: string;
  user_id: string;
  muted_user_id: string;
  created_at: string;
}

export interface Hashtag {
  id: string;
  name: string;
  posts_count: number;
  created_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PushToken {
  id: string;
  user_id: string;
  token: string;
  platform: Platform;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  user_id: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

// API Response types
export interface ApiError {
  message: string;
  code?: string;
  details?: string;
}

export interface LimitError {
  type: 'posts' | 'likes' | 'comments' | 'feed';
  current: number;
  max: number;
  message: string;
}

// Direct Messaging types
export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithParticipant extends Conversation {
  participant: Profile;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender: Profile;
}

// Form types
export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface UpdateProfileData {
  full_name?: string;
  username?: string;
  bio?: string;
  website?: string;
  avatar_url?: string;
  timezone?: string;
  theme_preference?: ThemePreference;
  notifications_enabled?: boolean;
}

export interface CreatePostData {
  content?: string;
  imageUri?: string;
}
