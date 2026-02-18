/**
 * Create Post Screen
 * Create a new post with text and/or image
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useUsageStore } from '../../src/stores/usageStore';
import { useFeedStore } from '../../src/stores/feedStore';
import { supabase } from '../../src/lib/supabase';
import { uploadPostImage } from '../../src/lib/storage';
import { compressImage } from '../../src/utils/imageCompressor';
import { validatePostContent } from '../../src/utils/validation';
import { getPostLimit, isLimitError, parseLimitError } from '../../src/constants/limits';
import { APP_CONFIG } from '../../src/constants/config';
import { Button } from '../../src/components/ui';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

export default function CreatePostScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ draftId?: string; draftContent?: string; draftImageUrl?: string }>();
  const { colors } = useThemeStore();
  const { profile, user } = useAuthStore();
  const { postsRemaining, canPost, incrementPosts, fetchUsage } = useUsageStore();
  const { addPost } = useFeedStore();

  const [content, setContent] = useState(params.draftContent || '');
  const [imageUri, setImageUri] = useState<string | null>(params.draftImageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(params.draftId || null);

  const postLimit = profile ? getPostLimit(profile.role, profile.is_verified) : 5;
  const canCreatePost = canPost(profile?.role || 'student', profile?.is_verified || false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // Compress image
      const compressed = await compressImage(result.assets[0].uri);
      setImageUri(compressed);
    }
  };

  const removeImage = () => {
    setImageUri(null);
  };

  const handleSubmit = async () => {
    // Validate
    const validationError = validatePostContent(content, !!imageUri);
    if (validationError) {
      Alert.alert('Invalid Post', validationError);
      return;
    }

    if (!canCreatePost) {
      Alert.alert(
        'Daily Limit Reached',
        `You've used all ${postLimit} posts for today. Come back tomorrow!`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if selected
      if (imageUri && user) {
        imageUrl = await uploadPostImage(user.id, imageUri);
      }

      // Create post
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user?.id,
          content: content.trim() || null,
          image_url: imageUrl,
        })
        .select(`
          *,
          profiles:user_id (*)
        `)
        .single();

      if (error) throw error;

      // Delete draft if we were restoring one
      if (draftId) {
        await supabase.from('drafts').delete().eq('id', draftId);
        setDraftId(null);
      }

      // Update local state
      incrementPosts();

      // Add to feed
      if (data && profile) {
        addPost({
          ...data,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
          likes_count: 0,
          comments_count: 0,
          is_liked: false,
          is_saved: false,
        });
      }

      // Reset form
      setContent('');
      setImageUri(null);

      Alert.alert('Success', 'Your post has been shared!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      if (isLimitError(error.message)) {
        const parsed = parseLimitError(error.message);
        Alert.alert('Daily Limit Reached', parsed?.message || 'Post limit reached');
        fetchUsage(); // Refresh usage
      } else {
        // Show specific error message for upload failures
        const errorMessage = error.message || 'Failed to create post. Please try again.';
        Alert.alert('Error', errorMessage);
        console.error('Create post error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Post</Text>
        <Button
          title="Share"
          onPress={handleSubmit}
          disabled={(!content.trim() && !imageUri) || isSubmitting}
          loading={isSubmitting}
          size="small"
        />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {/* Limit Warning */}
        <View style={[styles.limitWarning, { backgroundColor: colors.backgroundSecondary }]}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={postsRemaining > 0 ? colors.textTertiary : colors.error}
          />
          <Text
            style={[
              styles.limitText,
              { color: postsRemaining > 0 ? colors.textSecondary : colors.error },
            ]}
          >
            {postsRemaining > 0
              ? `You can only post ${postsRemaining} more time${postsRemaining === 1 ? '' : 's'} today`
              : "You've reached your daily post limit"}
          </Text>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View style={styles.imagePreview}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              Post preview
            </Text>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={[styles.removeButton, { backgroundColor: colors.background }]}
                onPress={removeImage}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Caption Input */}
        <View style={styles.inputContainer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Share what mattered most today..."
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { color: colors.text }]}
            multiline
            maxLength={APP_CONFIG.maxChars.post}
            editable={!isSubmitting}
          />
          <Text style={[styles.charCount, { color: colors.textTertiary }]}>
            {content.length}/{APP_CONFIG.maxChars.post}
          </Text>
        </View>

        {/* Image Picker */}
        {!imageUri && (
          <TouchableOpacity
            style={[styles.imagePicker, { borderColor: colors.border }]}
            onPress={pickImage}
            disabled={isSubmitting}
          >
            <Ionicons name="image-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>
              Add a photo
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
  },
  content: {
    flex: 1,
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.base,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  limitText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.sizes.sm,
    flex: 1,
  },
  imagePreview: {
    padding: Spacing.base,
  },
  previewLabel: {
    fontSize: Typography.sizes.sm,
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#E5E2DD',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    padding: Spacing.base,
  },
  input: {
    fontSize: Typography.sizes.lg,
    lineHeight: Typography.sizes.lg * Typography.lineHeights.relaxed,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.sm,
  },
  imagePicker: {
    margin: Spacing.base,
    padding: Spacing.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sizes.base,
  },
});
