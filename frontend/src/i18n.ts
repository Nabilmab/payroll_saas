import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Define resources directly in the code
const resources = {
  en: {
    translation: {
      "salaryComponents": {
        "pageTitle": "Manage Salary Components (from code)"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    }
  });

// --- THIS IS THE CORRECTED LINE ---
export default i18n;