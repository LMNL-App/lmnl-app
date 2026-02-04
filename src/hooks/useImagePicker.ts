/**
 * Image picker hook
 * Handles image selection and compression
 */
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { compressImage } from '../utils/imageCompressor';

type ImagePickerOptions = {
  aspect?: [number, number];
  quality?: number;
  allowsEditing?: boolean;
  compress?: boolean;
};

export function useImagePicker(options: ImagePickerOptions = {}) {
  const {
    aspect = [1, 1],
    quality = 0.8,
    allowsEditing = true,
    compress = true,
  } = options;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPickerLoading, setIsPickerLoading] = useState(false);

  const requestPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to upload images.'
      );
      return false;
    }
    return true;
  }, []);

  const pickImage = useCallback(async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return null;

    setIsPickerLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing,
        aspect,
        quality,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const finalUri = compress ? await compressImage(uri) : uri;
        setImageUri(finalUri);
        return finalUri;
      }
      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    } finally {
      setIsPickerLoading(false);
    }
  }, [requestPermission, allowsEditing, aspect, quality, compress]);

  const clearImage = useCallback(() => {
    setImageUri(null);
  }, []);

  return {
    imageUri,
    isPickerLoading,
    pickImage,
    clearImage,
    setImageUri,
  };
}
