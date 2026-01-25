/**
 * Image compression utilities
 * Ensures images are within the 5MB limit before upload
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { APP_CONFIG } from '../constants/config';

interface CompressOptions {
  maxSize?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Get file size safely
 */
async function getFileSize(uri: string): Promise<number | null> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Compress an image to meet size requirements
 * Iteratively reduces quality until size is acceptable
 */
export async function compressImage(
  uri: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxSize = APP_CONFIG.maxImageSize,
    maxWidth = APP_CONFIG.maxImageDimensions.width,
    maxHeight = APP_CONFIG.maxImageDimensions.height,
    quality = APP_CONFIG.imageQuality,
  } = options;

  // First pass: resize if needed
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth, height: maxHeight } }],
    { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
  );

  // Check file size
  let fileSize = await getFileSize(result.uri);

  // If still too large, iteratively reduce quality
  let currentQuality = quality;
  while (fileSize && fileSize > maxSize && currentQuality > 0.1) {
    currentQuality -= 0.1;
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { compress: currentQuality, format: ImageManipulator.SaveFormat.JPEG }
    );
    fileSize = await getFileSize(result.uri);
  }

  return result.uri;
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const { Image } = require('react-native');
    Image.getSize(
      uri,
      (width: number, height: number) => resolve({ width, height }),
      (error: Error) => reject(error)
    );
  });
}

/**
 * Check if an image needs compression
 */
export async function needsCompression(uri: string): Promise<boolean> {
  const fileSize = await getFileSize(uri);
  if (!fileSize) return false;
  return fileSize > APP_CONFIG.maxImageSize;
}

/**
 * Get file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
