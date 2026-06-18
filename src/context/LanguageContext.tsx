import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { translations, TranslationKey } from "../i18n/translations";

interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  ready: boolean;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "fr",
  setLanguage: () => {},
  ready: false,
  t: (key) => key,
  isRTL: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState("fr");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((val) => {
      if (val) setLanguageState(val);
      setReady(true);
    });
  }, []);

  const setLanguage = (code: string) => {
    setLanguageState(code);
    AsyncStorage.setItem("app_language", code);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language as keyof typeof translations] ?? translations.fr;
    return dict[key] ?? translations.fr[key] ?? key;
  };

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider value={{ language, setLanguage, ready, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}