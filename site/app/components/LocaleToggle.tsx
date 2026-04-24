'use client';

import { useLocale } from '../i18n/LocaleContext';
import type { Locale } from '../i18n/dictionary';

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="language switcher"
      className="flex items-center border border-ink-700 rounded-sm overflow-hidden"
    >
      <Btn active={locale === 'en'} onClick={() => setLocale('en')} label="EN" />
      <span className="w-px h-4 bg-ink-700" />
      <Btn active={locale === 'pt'} onClick={() => setLocale('pt')} label="PT" />
    </div>
  );
}

function Btn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] transition-colors ${
        active
          ? 'bg-jade-400 text-ink-950'
          : 'text-ink-400 hover:text-ink-100 hover:bg-ink-800'
      }`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}
