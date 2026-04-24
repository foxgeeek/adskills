'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { dictionaries, type Dictionary, type Locale } from './dictionary';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = 'adskills-locale';

function detectInitial(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
  if (stored === 'en' || stored === 'pt') return stored;
  const nav = navigator.language?.toLowerCase() ?? '';
  return nav.startsWith('pt') ? 'pt' : 'en';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(detectInitial());
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === 'pt' ? 'pt-BR' : 'en';
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
