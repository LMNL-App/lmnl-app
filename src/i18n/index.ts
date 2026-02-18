import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import fr from './locales/fr';
import es from './locales/es';

const LANGUAGE_KEY = '@lmnl/language';

export type SupportedLanguage = 'en' | 'fr' | 'es';

export const LANGUAGES: { code: SupportedLanguage; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
];

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && ['en', 'fr', 'es'].includes(saved)) {
      await i18n.changeLanguage(saved);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
}

export async function changeLanguage(lng: SupportedLanguage) {
  try {
    await i18n.changeLanguage(lng);
    await AsyncStorage.setItem(LANGUAGE_KEY, lng);
  } catch (error) {
    console.error('Error changing language:', error);
  }
}

export default i18n;
