/**
 * Theme Settings Screen
 */
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/stores/themeStore';
import { Typography, Spacing, BorderRadius } from '../../src/constants/theme';

type ThemeOption = 'light' | 'dark' | 'system';

interface OptionProps {
  value: ThemeOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ThemeOption({ value, label, icon, description, isSelected, onSelect }: OptionProps) {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity
      style={[
        styles.option,
        { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
      ]}
      onPress={onSelect}
    >
      <View style={[styles.optionIcon, { backgroundColor: colors.backgroundSecondary }]}>
        <Ionicons name={icon} size={24} color={colors.text} />
      </View>
      <View style={styles.optionContent}>
        <Text style={[styles.optionLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
          {description}
        </Text>
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: isSelected ? colors.primary : colors.border },
          isSelected && { backgroundColor: colors.primary },
        ]}
      >
        {isSelected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

export default function ThemeScreen() {
  const { colors, mode, setMode } = useThemeStore();

  const options: Array<{
    value: ThemeOption;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
  }> = [
    {
      value: 'light',
      label: 'Light',
      icon: 'sunny-outline',
      description: 'Always use light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: 'moon-outline',
      description: 'Always use dark theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: 'phone-portrait-outline',
      description: 'Follow system settings',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Appearance
      </Text>

      <View style={styles.options}>
        {options.map((option) => (
          <ThemeOption
            key={option.value}
            {...option}
            isSelected={mode === option.value}
            onSelect={() => setMode(option.value)}
          />
        ))}
      </View>

      <Text style={[styles.note, { color: colors.textTertiary }]}>
        Your theme preference is saved locally on this device.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.base,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  options: {
    gap: Spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  optionLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
  },
  optionDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  note: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
});
