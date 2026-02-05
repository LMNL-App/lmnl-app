/**
 * Offline queue state management
 * Queues actions when offline and retries when back online
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type QueuedAction = {
  id: string;
  type: 'like' | 'unlike' | 'comment' | 'follow' | 'unfollow' | 'save' | 'unsave';
  payload: Record<string, any>;
  createdAt: string;
  retryCount: number;
};

interface OfflineState {
  isOnline: boolean;
  queue: QueuedAction[];
  isProcessing: boolean;

  setOnline: (online: boolean) => void;
  addToQueue: (action: Omit<QueuedAction, 'id' | 'createdAt' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  processQueue: (processor: (action: QueuedAction) => Promise<boolean>) => Promise<void>;
  loadQueue: () => Promise<void>;
  saveQueue: () => Promise<void>;
  clearQueue: () => void;
}

const QUEUE_STORAGE_KEY = '@lmnl/offline_queue';

export const useOfflineStore = create<OfflineState>((set, get) => ({
  isOnline: true,
  queue: [],
  isProcessing: false,

  setOnline: (online) => {
    set({ isOnline: online });
  },

  addToQueue: (action) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    set((state) => ({
      queue: [...state.queue, queuedAction],
    }));

    get().saveQueue();
  },

  removeFromQueue: (id) => {
    set((state) => ({
      queue: state.queue.filter((a) => a.id !== id),
    }));
    get().saveQueue();
  },

  processQueue: async (processor) => {
    const { queue, isProcessing, isOnline } = get();
    if (isProcessing || !isOnline || queue.length === 0) return;

    set({ isProcessing: true });

    const remainingQueue: QueuedAction[] = [];

    for (const action of queue) {
      try {
        const success = await processor(action);
        if (!success && action.retryCount < 3) {
          remainingQueue.push({
            ...action,
            retryCount: action.retryCount + 1,
          });
        }
      } catch {
        if (action.retryCount < 3) {
          remainingQueue.push({
            ...action,
            retryCount: action.retryCount + 1,
          });
        }
      }
    }

    set({ queue: remainingQueue, isProcessing: false });
    get().saveQueue();
  },

  loadQueue: async () => {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        set({ queue: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  },

  saveQueue: async () => {
    try {
      const { queue } = get();
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  },

  clearQueue: () => {
    set({ queue: [] });
    AsyncStorage.removeItem(QUEUE_STORAGE_KEY).catch(console.error);
  },
}));
