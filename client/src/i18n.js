// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // loads translations from your /public/locales folder
  .use(LanguageDetector) // detects user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    // This option will use English if the detected language is not available.
    fallbackLng: 'en', 

    // Set to false for production
    debug: true, 

    interpolation: {
      escapeValue: false, // React already protects from xss
    },

    backend: {
      // Path to your translation files
      loadPath: '/locales/{{lng}}/translation.json',
    },
  });

export default i18n;