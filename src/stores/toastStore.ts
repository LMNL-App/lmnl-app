/**
 * Toast notification state management
 * Provides a global toast system for success/error/info messages
 */
import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration: number;

  show: (message: string, type?: ToastType, duration?: number) => void;
  hide: () => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  duration: 3000,

  show: (message, type = 'info', duration = 3000) => {
    set({ visible: true, message, type, duration });
  },

  hide: () => {
    set({ visible: false });
  },

  success: (message) => {
    set({ visible: true, message, type: 'success', duration: 3000 });
  },

  error: (message) => {
    set({ visible: true, message, type: 'error', duration: 4000 });
  },

  warning: (message) => {
    set({ visible: true, message, type: 'warning', duration: 3500 });
  },

  info: (message) => {
    set({ visible: true, message, type: 'info', duration: 3000 });
  },
}));
