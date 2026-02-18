import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../src/stores/themeStore';
import { LANGUAGES, changeLanguage, type SupportedLanguage } from '../../src/i18n';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

export default function LanguageScreen() {
  const { colors } = useThemeStore();
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language as SupportedLanguage;

  const handleSelect = async (code: SupportedLanguage) => {
    if (code !== currentLanguage) {
      await changeLanguage(code);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('language.title'),
          headerBackTitle: t('common.back'),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.list}>
        {LANGUAGES.map((lang) => {
          const isSelected = lang.code === currentLanguage;

          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.item,
                { backgroundColor: colors.surface, borderBottomColor: colors.border },
              ]}
              onPress={() => handleSelect(lang.code)}
            >
              <View style={styles.labelContainer}>
                <Text style={[styles.nativeLabel, { color: colors.text }]}>
                  {lang.nativeLabel}
                </Text>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {lang.label}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark" size={22} color={colors.success} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    margin: Spacing.base,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  labelContainer: {
    flex: 1,
  },
  nativeLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
  },
  label: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
});
