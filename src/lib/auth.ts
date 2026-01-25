/**
 * Authentication utilities for LMNL app
 */
import { supabase } from './supabase';
import type { SignUpData, SignInData, Profile } from '../types/database';

/**
 * Sign up a new user
 */
export async function signUp({ email, password, fullName, username }: SignUpData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        username: username,
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in an existing user with email or username
 */
export async function signIn({ email, password }: SignInData) {
  let signInEmail = email;

  // Check if the input looks like an email (contains @)
  // If not, treat it as a username and look up the email
  if (!email.includes('@')) {
    const { data: lookupEmail, error: lookupError } = await supabase.rpc(
      'get_email_by_username',
      { input_username: email }
    );

    if (lookupError) {
      throw new Error('Error looking up username');
    }

    if (!lookupEmail) {
      throw new Error('Username not found');
    }

    signInEmail = lookupEmail;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: signInEmail,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'lmnl://reset-password',
  });

  if (error) throw error;
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update the current user's profile
 */
export async function updateProfile(updates: Partial<Profile>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  return !data;
}

/**
 * Delete the current user's account
 */
export async function deleteAccount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Delete profile (cascade will handle related data)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (profileError) throw profileError;

  // Sign out
  await signOut();
}
