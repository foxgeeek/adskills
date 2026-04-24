'use client';

import Link from 'next/link';
import { useLocale } from '../i18n/LocaleContext';
import { LocaleToggle } from './LocaleToggle';

export function Nav() {
  const { t } = useLocale();
  return (
    <header className="relative z-10 px-6 sm:px-10 lg:px-16 pt-6 pb-4 max-w-7xl mx-auto flex items-center justify-between">
      <div className="flex items-baseline gap-3">
        <span className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-ink-100">
          adskills<span className="text-jade-400">.</span>
        </span>
        <span className="hidden sm:inline text-[10px] uppercase tracking-[0.3em] text-ink-400 font-mono">
          {t.nav.version}
        </span>
      </div>
      <nav className="flex items-center gap-1 sm:gap-3 text-sm font-[family-name:var(--font-plex)]">
        <Link
          href="#skills"
          className="hidden sm:inline-block px-3 py-1.5 rounded-sm text-ink-300 hover:text-ink-50 transition-colors"
        >
          {t.nav.skills}
        </Link>
        <Link
          href="#architecture"
          className="hidden sm:inline-block px-3 py-1.5 rounded-sm text-ink-300 hover:text-ink-50 transition-colors"
        >
          {t.nav.architecture}
        </Link>
        <Link
          href="#quickstart"
          className="hidden sm:inline-block px-3 py-1.5 rounded-sm text-ink-300 hover:text-ink-50 transition-colors"
        >
          {t.nav.quickstart}
        </Link>
        <LocaleToggle />
        <a
          href="https://github.com/your-org/adskills"
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2 px-3 py-1.5 border border-ink-600 hover:border-jade-400 rounded-sm transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-ink-200 group-hover:text-jade-400 transition-colors">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <span className="text-xs font-mono tracking-tight text-ink-200 group-hover:text-jade-400">
            {t.nav.github}
          </span>
          <span className="text-[10px] font-mono text-ink-400 group-hover:text-ink-300">↗</span>
        </a>
      </nav>
    </header>
  );
}
