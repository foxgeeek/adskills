'use client';

import { useLocale } from '../i18n/LocaleContext';

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="relative px-6 sm:px-10 pt-12 pb-10 border-t border-ink-800">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-5">
          <div className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-ink-100">
            adskills<span className="text-jade-400">.</span>
          </div>
          <p className="mt-3 text-sm text-ink-400 max-w-sm leading-relaxed">
            {t.footer.tagline}
          </p>
        </div>

        <div className="md:col-span-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 mb-4">
            {t.footer.platformsTitle}
          </div>
          <ul className="space-y-2 text-sm text-ink-200 font-mono">
            <li>meta-ads/</li>
            <li>google-ads/</li>
            <li>linkedin-ads/</li>
            <li>cross-platform/</li>
          </ul>
        </div>

        <div className="md:col-span-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 mb-4">
            {t.footer.docsTitle}
          </div>
          <ul className="space-y-2 text-sm text-ink-200">
            {t.footer.docsLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="hover:text-jade-300 transition-colors">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-14 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          {t.footer.copyright}
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          <span>v0.1.0</span>
          <span className="h-1 w-1 rounded-full bg-ink-600" />
          <span>node ≥ 22</span>
          <span className="h-1 w-1 rounded-full bg-ink-600" />
          <span className="text-jade-400">{t.footer.ship}</span>
        </div>
      </div>
    </footer>
  );
}
