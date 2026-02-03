/**
 * Edit Profile Screen
 */
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useThemeStore } from '../../src/stores/themeStore';
import { useAuthStore } from '../../src/stores/authStore';
import { uploadAvatar } from '../../src/lib/storage';
import { compressImage } from '../../src/utils/imageCompressor';
import { validateUsername, validateFullName, validateBio, validateWebsite } from '../../src/utils/validation';
import { Avatar, Button, Input } from '../../src/components/ui';
import { APP_CONFIG } from '../../src/constants/config';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useThemeStore();
  const { profile, updateProfile, user } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const compressed = await compressImage(result.assets[0].uri);
      setAvatarUri(compressed);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameError = validateFullName(fullName);
    if (nameError) newErrors.fullName = nameError;

    const usernameError = validateUsername(username);
    if (usernameError) newErrors.username = usernameError;

    const bioError = validateBio(bio);
    if (bioError) newErrors.bio = bioError;

    const websiteError = validateWebsite(website);
    if (websiteError) newErrors.website = websiteError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      let avatarUrl = profile?.avatar_url;

      // Upload new avatar if changed
      if (avatarUri && user) {
        avatarUrl = await uploadAvatar(user.id, avatarUri);
      }

      await updateProfile({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        avatar_url: avatarUrl,
      });

      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        setErrors({ username: 'This username is already taken' });
      } else {
        // Show specific error message for upload failures
        const errorMessage = error.message || 'Failed to update profile. Please try again.';
        Alert.alert('Error', errorMessage);
        console.error('Edit profile error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayAvatar = avatarUri || profile?.avatar_url;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Avatar */}
      <TouchableOpacity style={styles.avatarSection} onPress={handlePickAvatar}>
        <Avatar
          uri={displayAvatar}
          name={fullName}
          size="xlarge"
        />
        <Text style={[styles.changePhoto, { color: colors.textSecondary }]}>
          Change photo
        </Text>
      </TouchableOpacity>

      {/* Form */}
      <View style={styles.form}>
        <Input
          label="Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your full name"
          error={errors.fullName}
          maxLength={APP_CONFIG.maxChars.fullName}
        />

        <Input
          label="Username"
          value={username}
          onChangeText={setUsername}
          placeholder="username"
          error={errors.username}
          autoCapitalize="none"
          maxLength={APP_CONFIG.maxChars.username}
          leftIcon="at"
        />

        <Input
          label="Bio"
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          error={errors.bio}
          multiline
          numberOfLines={3}
          maxLength={APP_CONFIG.maxChars.bio}
        />

        <Input
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://yourwebsite.com"
          error={errors.website}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>

      {/* Save Button */}
      <View style={styles.buttonContainer}>
        <Button
          title="Save"
          onPress={handleSave}
          loading={isLoading}
          fullWidth
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.base,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  changePhoto: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    paddingBottom: Spacing.xl,
  },
});
