import { createContext, useContext, useState } from 'react';
import { en } from '../translations/en.js';
import { kn } from '../translations/kn.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app_language') || 'en');
  const toggle = () => {
    const next = lang === 'en' ? 'kn' : 'en';
    setLang(next);
    localStorage.setItem('app_language', next);
  };
  const t = (key) => (lang === 'en' ? en[key] : kn[key]) || key;
  return (
    <LanguageContext.Provider value={{ lang, toggle, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslation = () => useContext(LanguageContext);
