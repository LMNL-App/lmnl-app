/**
 * Auth state hook
 * Provides convenient access to auth state and actions
 */
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    isInitialized,
    fetchProfile,
    updateProfile,
    signOut,
  } = useAuthStore();

  const isAuthenticated = !!session;
  const userId = user?.id ?? null;

  return {
    session,
    user,
    profile,
    userId,
    isAuthenticated,
    isLoading,
    isInitialized,
    fetchProfile,
    updateProfile,
    signOut,
  };
}
