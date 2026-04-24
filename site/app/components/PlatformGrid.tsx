'use client';

import { useLocale } from '../i18n/LocaleContext';
import type { Locale } from '../i18n/dictionary';

interface Platform {
  code: 'meta' | 'google' | 'linkedin' | 'cross';
  label: string;
  subtitle: string;
  accent: string;
  skills: Array<{ name: string; note: { en: string; pt: string } }>;
}

const platforms: Platform[] = [
  {
    code: 'meta',
    label: 'Meta Ads',
    subtitle: 'Facebook · Instagram',
    accent: '#3b82f6',
    skills: [
      { name: 'creative-strategy', note: { en: 'bulk upload · copy variations', pt: 'upload em massa · variações de copy' } },
      { name: 'audience-builder', note: { en: 'CSV → hashed custom audience', pt: 'CSV → custom audience com hash' } },
      { name: 'fatigue-monitor', note: { en: 'CTR decay · frequency cap', pt: 'queda de CTR · freq cap' } },
      { name: 'spend-tracker', note: { en: 'MTD pacing · burn alerts', pt: 'pacing do mês · alertas de burn' } },
    ],
  },
  {
    code: 'google',
    label: 'Google Ads',
    subtitle: 'Search · Performance Max',
    accent: '#fbbf24',
    skills: [
      { name: 'performance-auditor', note: { en: 'period-over-period audit', pt: 'auditoria período vs período' } },
      { name: 'keyword-analyzer', note: { en: 'QS · impression share · CPC', pt: 'QS · impression share · CPC' } },
      { name: 'search-terms', note: { en: 'intent classifier · PT + EN', pt: 'classificador de intenção · PT + EN' } },
      { name: 'negative-keywords', note: { en: 'mine + bulk apply EXACT', pt: 'mineração + apply EXACT em bulk' } },
    ],
  },
  {
    code: 'linkedin',
    label: 'LinkedIn Ads',
    subtitle: 'ABM · Sponsored Content',
    accent: '#38bdf8',
    skills: [
      { name: 'audience-builder', note: { en: 'DMP segment · USER or COMPANY', pt: 'segmento DMP · USER ou COMPANY' } },
      { name: 'bid-optimizer', note: { en: 'CTR / CPC heuristics + apply', pt: 'heurísticas CTR / CPC + apply' } },
      { name: 'bulk-editor', note: { en: 'CSV → status · budget · bid', pt: 'CSV → status · budget · bid' } },
      { name: 'creative-strategist', note: { en: 'format performance + tests', pt: 'performance por formato + testes' } },
    ],
  },
  {
    code: 'cross',
    label: 'Cross-platform',
    subtitle: 'Meta ∙ Google ∙ LinkedIn',
    accent: '#34d399',
    skills: [
      { name: 'crm-sync', note: { en: 'one CSV → three audiences', pt: 'um CSV → três audiências' } },
      { name: 'dashboard', note: { en: 'unified HTML · donut shares', pt: 'HTML unificado · donut de share' } },
      { name: 'budget-rebalance', note: { en: 'CPA-weighted reallocation', pt: 'realocação ponderada por CPA' } },
      { name: 'drive-fetch', note: { en: 'Drive folder → meta upload', pt: 'pasta do Drive → meta upload' } },
    ],
  },
];

export function PlatformGrid() {
  const { t, locale } = useLocale();

  return (
    <section id="skills" className="relative px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-ink-800">
      <div className="max-w-7xl mx-auto">
      <div className="flex items-baseline justify-between gap-4 mb-14">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
              {t.platforms.kicker}
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl leading-[0.98] tracking-[-0.02em] text-ink-50 max-w-2xl">
            {t.platforms.titleA}{' '}
            <em className="italic font-light text-ink-300">{t.platforms.titleB}</em>
          </h2>
        </div>
        <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 whitespace-nowrap self-end pb-2">
          {t.platforms.section}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-px bg-ink-800 border border-ink-800">
        {platforms.map((p) => (
          <article
            key={p.code}
            className="group relative bg-ink-950 hover:bg-ink-900 transition-colors p-7 min-h-[380px] flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: p.accent }} />

            <div className="flex items-baseline justify-between">
              <span
                className="font-mono text-[10px] uppercase tracking-[0.32em]"
                style={{ color: p.accent }}
              >
                {p.code}/
              </span>
              <span className="font-mono text-[10px] text-ink-500">02.{String(platforms.indexOf(p) + 1).padStart(2, '0')}</span>
            </div>

            <h3 className="mt-6 font-[family-name:var(--font-fraunces)] text-3xl leading-none tracking-tight text-ink-50">
              {p.label}
            </h3>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-ink-400">
              {p.subtitle}
            </p>

            <ul className="mt-7 space-y-3 flex-1">
              {p.skills.map((s) => (
                <li key={s.name} className="group/skill">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] text-ink-500 group-hover/skill:text-ink-300 transition-colors">
                      —
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[13px] text-ink-100 group-hover/skill:text-jade-300 transition-colors">
                        {s.name}
                      </div>
                      <div className="text-[12px] text-ink-400 leading-snug mt-0.5">
                        {s.note[locale as Locale]}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-5 border-t border-ink-800 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-500 uppercase tracking-widest">
                {t.platforms.pathPrefix}{p.code === 'cross' ? 'cross-platform' : p.code + '-ads'}/
              </span>
              <span
                className="font-mono text-xs group-hover:translate-x-0.5 transition-transform"
                style={{ color: p.accent }}
              >
                →
              </span>
            </div>
          </article>
        ))}
      </div>
      </div>
    </section>
  );
}
