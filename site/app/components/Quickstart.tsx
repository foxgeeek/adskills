'use client';

import { useState } from 'react';

const recipes = [
  {
    label: 'install',
    file: '~/adskills',
    body: [
      { k: 'cmt', t: '# clone & install' },
      { k: 'cmd', t: 'git clone https://github.com/your-org/adskills' },
      { k: 'cmd', t: 'cd adskills && pnpm install' },
      { k: 'cmt', t: '' },
      { k: 'cmt', t: '# set up OAuth for Meta, Google, and LinkedIn' },
      { k: 'cmd', t: 'cp .env.example .env' },
      { k: 'cmd', t: 'pnpm dev init' },
    ],
  },
  {
    label: 'bulk creatives',
    file: 'meta-ads/creative-strategy',
    body: [
      { k: 'cmt', t: '# scan folder, preview, confirm, upload as PAUSED' },
      { k: 'cmd', t: 'adskills meta upload \\' },
      { k: 'arg', t: '  --account coldiq \\' },
      { k: 'arg', t: '  --folder ./assets/q2-2026 \\' },
      { k: 'arg', t: '  --adset 23850123456789 \\' },
      { k: 'arg', t: '  --page 100012345678 \\' },
      { k: 'arg', t: '  --link https://landing.example.com \\' },
      { k: 'arg', t: '  --cta LEARN_MORE' },
    ],
  },
  {
    label: 'crm sync',
    file: 'cross-platform/crm-sync',
    body: [
      { k: 'cmt', t: '# upload once, syncs Meta + Google + LinkedIn' },
      { k: 'cmd', t: 'adskills cross crm-sync \\' },
      { k: 'arg', t: '  --account coldiq \\' },
      { k: 'arg', t: '  --csv ./leads/abril-hot.csv \\' },
      { k: 'arg', t: '  --name "Hot Leads — Abril 2026"' },
    ],
  },
  {
    label: 'fatigue scan',
    file: 'meta-ads/fatigue-monitor',
    body: [
      { k: 'cmt', t: '# flag ads with CTR ↓20% or frequency ≥ 3.5' },
      { k: 'cmd', t: 'adskills meta fatigue \\' },
      { k: 'arg', t: '  --account coldiq \\' },
      { k: 'arg', t: '  --lookback 7' },
    ],
  },
];

export function Quickstart() {
  const [active, setActive] = useState(0);
  const recipe = recipes[active]!;

  return (
    <section id="quickstart" className="relative px-6 sm:px-10 py-20 sm:py-28 border-t border-ink-800">
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-jade-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-jade-400">
              §03 · quickstart
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl leading-[0.98] tracking-[-0.02em] text-ink-50">
            Four recipes,{' '}
            <em className="italic font-light text-ink-300">zero yak-shaving.</em>
          </h2>
          <p className="mt-8 text-ink-300 leading-relaxed max-w-md">
            Every command previews the change list and asks for
            confirmation before it touches the API. Ads default to
            <code className="font-mono text-jade-300 mx-1">PAUSED</code>.
            Your tokens never leave
            <code className="font-mono text-jade-300 mx-1">~/.adskills</code>.
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
                      step {String(i + 1).padStart(2, '0')}
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
                  copy
                </button>
              </div>

              <pre className="px-6 py-6 font-mono text-[13px] leading-[1.8] overflow-x-auto min-h-[340px]">
                {recipe.body.map((row, i) => (
                  <div key={i} className="whitespace-pre">
                    {row.k === 'cmt' && (
                      <span className="text-ink-500">{row.t || ' '}</span>
                    )}
                    {row.k === 'cmd' && (
                      <>
                        <span className="text-ink-500">❯ </span>
                        <span className="text-jade-300">{row.t.split(' ')[0]}</span>
                        <span className="text-ink-100">{row.t.slice(row.t.split(' ')[0]!.length)}</span>
                      </>
                    )}
                    {row.k === 'arg' && <span className="text-ink-300">{row.t}</span>}
                  </div>
                ))}
              </pre>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-4 text-[11px] font-mono uppercase tracking-widest text-ink-500">
              <span>encrypted tokens · AES-256-GCM</span>
              <span className="text-center">preview · confirm · execute</span>
              <span className="text-right">html + md reports</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
