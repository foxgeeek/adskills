'use client';

import { useLocale } from '../i18n/LocaleContext';

export function Principles() {
  const { t } = useLocale();
  return (
    <section className="relative px-6 sm:px-10 py-24 sm:py-32 border-t border-ink-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between gap-4 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-amber-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
                {t.principles.kicker}
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-7xl leading-[0.98] tracking-[-0.025em] text-ink-50 max-w-3xl">
              {t.principles.titleA}{' '}
              <em className="italic font-light text-ink-300">{t.principles.titleB}</em>
            </h2>
          </div>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 whitespace-nowrap self-end pb-2">
            {t.principles.tag}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-800 border border-ink-800">
          {t.principles.rules.map((p) => (
            <article
              key={p.index}
              className="group relative bg-ink-950 hover:bg-ink-900 transition-colors p-8 min-h-[240px]"
            >
              <div className="flex items-start justify-between mb-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-jade-400">
                  {t.principles.ruleLabel} {p.index}
                </span>
                <span className="font-mono text-ink-700 group-hover:text-jade-400 transition-colors text-xl">
                  ¶
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-fraunces)] text-2xl leading-tight tracking-tight text-ink-50">
                {p.title}
              </h3>
              <p className="mt-4 text-ink-300 leading-relaxed text-[15px]">
                {p.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-center">
          <div className="h-px w-12 bg-ink-600" />
          <p className="max-w-xl text-ink-400 leading-relaxed text-sm">
            {t.principles.footer}
          </p>
          <div className="h-px w-12 bg-ink-600" />
        </div>
      </div>
    </section>
  );
}
