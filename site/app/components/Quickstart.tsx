'use client';

import { useState } from 'react';
import { useLocale } from '../i18n/LocaleContext';

export function Quickstart() {
  const { t, locale } = useLocale();

  const recipes = [
    {
      label: t.quickstart.recipeLabels.install,
      file: '~/adskills',
      body: [
        { k: 'cmt', tx: t.quickstart.commentInstall },
        { k: 'cmd', tx: 'git clone https://github.com/your-org/adskills' },
        { k: 'cmd', tx: 'cd adskills && pnpm install' },
        { k: 'cmt', tx: '' },
        { k: 'cmt', tx: t.quickstart.commentEnv },
        { k: 'cmd', tx: 'cp .env.example .env' },
        { k: 'cmd', tx: 'pnpm cli init' },
      ],
    },
    {
      label: t.quickstart.recipeLabels.bulkCreatives,
      file: 'meta-ads/creative-strategy',
      body: [
        { k: 'cmt', tx: t.quickstart.commentBulk },
        { k: 'cmd', tx: 'adskills meta upload \\' },
        { k: 'arg', tx: '  --account acme \\' },
        { k: 'arg', tx: '  --folder ./assets/q2-2026 \\' },
        { k: 'arg', tx: '  --adset 23850123456789 \\' },
        { k: 'arg', tx: '  --page 100012345678 \\' },
        { k: 'arg', tx: '  --link https://landing.example.com \\' },
        { k: 'arg', tx: '  --cta LEARN_MORE' },
      ],
    },
    {
      label: t.quickstart.recipeLabels.crmSync,
      file: 'cross-platform/crm-sync',
      body: [
        { k: 'cmt', tx: t.quickstart.commentCrm },
        { k: 'cmd', tx: 'adskills cross crm-sync \\' },
        { k: 'arg', tx: '  --account acme \\' },
        { k: 'arg', tx: '  --csv ./leads/abril-hot.csv \\' },
        { k: 'arg', tx: '  --name "Hot Leads — Abril 2026"' },
      ],
    },
    {
      label: t.quickstart.recipeLabels.fatigueScan,
      file: 'meta-ads/fatigue-monitor',
      body: [
        { k: 'cmt', tx: t.quickstart.commentFatigue },
        { k: 'cmd', tx: 'adskills meta fatigue \\' },
        { k: 'arg', tx: '  --account acme \\' },
        { k: 'arg', tx: '  --lookback 7' },
      ],
    },
  ];

  const [active, setActive] = useState(0);
  const recipe = recipes[active]!;

  return (
    <section id="quickstart" className="relative px-6 sm:px-10 py-20 sm:py-28 border-t border-ink-800">
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-jade-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-jade-400">
              {t.quickstart.kicker}
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl leading-[0.98] tracking-[-0.02em] text-ink-50">
            {t.quickstart.titleA}{' '}
            <em className="italic font-light text-ink-300">{t.quickstart.titleB}</em>
          </h2>
          <p className="mt-8 text-ink-300 leading-relaxed max-w-md">
            {t.quickstart.body.a}
            <code className="font-mono text-jade-300 mx-1">{t.quickstart.body.code1}</code>
            {t.quickstart.body.mid}
            <code className="font-mono text-jade-300 mx-1">{t.quickstart.body.code2}</code>
            {t.quickstart.body.z}
          </p>

          <div className="mt-10 space-y-1.5">
            {recipes.map((r, i) => (
              <button
                key={r.label}
                onClick={() => setActive(i)}
                className={`w-full group text-left px-4 py-3 border-l-2 transition-all ${
                  i === active
                    ? 'bg-ink-900 border-jade-400'
                    : 'bg-transparent border-ink-700 hover:border-ink-500 hover:bg-ink-900/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-500">
                      {t.quickstart.stepLabel} {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className={`mt-1 font-[family-name:var(--font-fraunces)] text-xl ${i === active ? 'text-ink-50' : 'text-ink-200'}`}>
                      {r.label}
                    </div>
                  </div>
                  <span className={`font-mono text-lg transition-transform ${i === active ? 'text-jade-400 translate-x-0' : 'text-ink-600 -translate-x-1'}`}>
                    →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 lg:pl-4">
          <div className="relative">
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
                <span className="text-ink-500">code </span>
                {recipe.file}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
                fig. 0{active + 2}
              </span>
            </div>

            <div className="border border-ink-600 bg-ink-900/80">
              <div className="flex items-center justify-between border-b border-ink-700 px-5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-ink-500" />
                  <span className="h-2 w-2 rounded-full bg-ink-500" />
                  <span className="h-2 w-2 rounded-full bg-jade-400" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink-400">
                  zsh — {recipe.label}
                </span>
                <button className="font-mono text-[10px] text-ink-500 hover:text-ink-200 uppercase tracking-widest">
                  {locale === 'pt' ? 'copiar' : 'copy'}
                </button>
              </div>

              <pre className="px-6 py-6 font-mono text-[13px] leading-[1.8] overflow-x-auto min-h-[340px]">
                {recipe.body.map((row, i) => (
                  <div key={i} className="whitespace-pre">
                    {row.k === 'cmt' && (
                      <span className="text-ink-500">{row.tx || ' '}</span>
                    )}
                    {row.k === 'cmd' && (
                      <>
                        <span className="text-ink-500">❯ </span>
                        <span className="text-jade-300">{row.tx.split(' ')[0]}</span>
                        <span className="text-ink-100">{row.tx.slice(row.tx.split(' ')[0]!.length)}</span>
                      </>
                    )}
                    {row.k === 'arg' && <span className="text-ink-300">{row.tx}</span>}
                  </div>
                ))}
              </pre>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-4 text-[11px] font-mono uppercase tracking-widest text-ink-500">
              <span>{t.quickstart.chipA}</span>
              <span className="text-center">{t.quickstart.chipB}</span>
              <span className="text-right">{t.quickstart.chipC}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
