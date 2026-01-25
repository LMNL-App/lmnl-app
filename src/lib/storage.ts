/**
 * Storage utilities for LMNL app
 * Handles image uploads to Supabase Storage
 */
import { supabase } from './supabase';
import { STORAGE_BUCKETS } from '../constants/config';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Upload an avatar image
 */
export async function uploadAvatar(
  userId: string,
  uri: string
): Promise<string> {
  const fileName = `${userId}/avatar_${Date.now()}.jpg`;

  try {
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found. Please select the image again.');
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.length === 0) {
      throw new Error('Failed to read image file. Please try again.');
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.avatars)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase avatar upload error:', uploadError);
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage not configured. Please contact support.');
      }
      if (uploadError.message.includes('row-level security')) {
        throw new Error('Permission denied. Please log in again.');
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.avatars)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    throw error;
  }
}

/**
 * Upload a post image
 */
export async function uploadPostImage(
  userId: string,
  uri: string
): Promise<string> {
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

  try {
    // Verify file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found. Please select the image again.');
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.length === 0) {
      throw new Error('Failed to read image file. Please try again.');
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.posts)
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error('Supabase post image upload error:', uploadError);
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error('Storage not configured. Please contact support.');
      }
      if (uploadError.message.includes('row-level security')) {
        throw new Error('Permission denied. Please log in again.');
      }
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from(STORAGE_BUCKETS.posts)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Post image upload error:', error);
    throw error;
  }
}

/**
 * Delete an avatar image
 */
export async function deleteAvatar(userId: string, url: string): Promise<void> {
  // Extract file path from URL
  const path = url.split(`${STORAGE_BUCKETS.avatars}/`)[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.avatars)
    .remove([path]);

  if (error) throw error;
}

/**
 * Delete a post image
 */
export async function deletePostImage(url: string): Promise<void> {
  // Extract file path from URL
  const path = url.split(`${STORAGE_BUCKETS.posts}/`)[1];
  if (!path) return;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKETS.posts)
    .remove([path]);

  if (error) throw error;
}
