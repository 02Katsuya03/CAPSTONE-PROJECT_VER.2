// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      title: "SAFE",
      subtitle: "Sex Awareness & Facts for Everyone",
      login: "Login",
      register: "Register"
    }
  },
  fil: {
    translation: {
      title: "LIGTAS",
      subtitle: "Kaalaman ukol sa Sex para sa Lahat",
      login: "Mag-login",
      register: "Magrehistro"
    }
  }
};

i18n
  .use(LanguageDetector) // Detects language from localStorage, cookies, etc.
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
