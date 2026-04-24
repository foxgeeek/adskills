'use client';

import { useLocale } from '../i18n/LocaleContext';

export function CTA() {
  const { t } = useLocale();
  return (
    <section className="relative px-6 sm:px-10 lg:px-16 py-24 sm:py-28 border-t border-ink-800">
      <div className="max-w-5xl mx-auto relative">
        <div className="absolute inset-0 bg-gradient-to-br from-jade-500/15 via-transparent to-amber-400/10 blur-3xl pointer-events-none" />

        <div className="relative border border-jade-400/30 bg-ink-900/50 backdrop-blur p-10 sm:p-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-jade-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-jade-400">
              {t.cta.kicker}
            </span>
          </div>

          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-7xl leading-[0.95] tracking-[-0.025em] text-ink-50 max-w-3xl">
            {t.cta.titleA} <em className="italic font-light text-ink-300">{t.cta.titleB}</em> {t.cta.titleC}{' '}
            <span className="shimmer-text font-medium">{t.cta.titleD}</span>
          </h2>

          <p className="mt-8 max-w-xl text-lg text-ink-300 leading-relaxed">
            {t.cta.body}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="https://github.com/your-org/adskills"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 bg-ink-50 hover:bg-jade-300 text-ink-950 font-mono text-sm font-medium px-6 py-3.5 rounded-sm transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>{t.cta.ctaPrimary}</span>
              <span className="text-ink-950/60 group-hover:text-ink-950">↗</span>
            </a>
            <a
              href="#quickstart"
              className="group inline-flex items-center gap-3 border border-ink-600 hover:border-ink-400 text-ink-100 font-mono text-sm px-6 py-3.5 rounded-sm transition-colors"
            >
              <span>{t.cta.ctaSecondary}</span>
              <span className="text-ink-400 group-hover:text-ink-200">↓</span>
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 flex items-center gap-2">
              <kbd className="kbd">⌘</kbd>
              <kbd className="kbd">K</kbd>
              <span>{t.cta.chip}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
