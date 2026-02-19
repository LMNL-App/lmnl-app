import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { ConversationWithParticipant, Message } from '../types/database';

interface MessageState {
  conversations: ConversationWithParticipant[];
  isLoading: boolean;
  error: string | null;

  fetchConversations: () => Promise<void>;
  getOrCreateConversation: (otherUserId: string) => Promise<string | null>;
  sendMessage: (conversationId: string, content: string) => Promise<Message | null>;
  fetchMessages: (conversationId: string) => Promise<Message[]>;
  markMessagesRead: (conversationId: string) => Promise<void>;
  getTotalUnreadCount: () => number;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        set({ conversations: [], isLoading: false });
        return;
      }

      // Get participant profiles and unread counts
      const convos: ConversationWithParticipant[] = await Promise.all(
        data.map(async (conv) => {
          const otherUserId = conv.participant1_id === user.id
            ? conv.participant2_id
            : conv.participant1_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single();

          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', user.id);

          return {
            ...conv,
            participant: profile!,
            unread_count: count || 0,
          };
        })
      );

      set({ conversations: convos });
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  getOrCreateConversation: async (otherUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(
          `and(participant1_id.eq.${user.id},participant2_id.eq.${otherUserId}),` +
          `and(participant1_id.eq.${otherUserId},participant2_id.eq.${user.id})`
        )
        .single();

      if (existing) return existing.id;

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant1_id: user.id,
          participant2_id: otherUserId,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Refresh conversations list
      get().fetchConversations();
      return data?.id || null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  sendMessage: async (conversationId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update conversation's last message
      await supabase
        .from('conversations')
        .update({
          last_message: content.trim().slice(0, 100),
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Update local state
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, last_message: content.trim().slice(0, 100), last_message_at: new Date().toISOString() }
            : c
        ),
      }));

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  fetchMessages: async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  },

  markMessagesRead: async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unread_count: 0 } : c
        ),
      }));
    } catch (error) {
      console.error('Error marking messages read:', error);
    }
  },

  getTotalUnreadCount: () => {
    return get().conversations.reduce((total, c) => total + c.unread_count, 0);
  },
}));
