import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es }
};

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const storedLang = await AsyncStorage.getItem('user_language');
      if (storedLang) {
        callback(storedLang);
        return;
      }
    } catch (error) {
      console.log('Error reading language', error);
    }
    callback('es'); // default to Spanish
  },
  init: () => {},
  cacheUserLanguage: (language) => {
    AsyncStorage.setItem('user_language', language).catch(() => {});
  }
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
