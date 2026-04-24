'use client';

const platforms = [
  {
    code: 'meta',
    label: 'Meta Ads',
    subtitle: 'Facebook · Instagram',
    accent: '#3b82f6',
    skills: [
      { name: 'creative-strategy', note: 'bulk upload · copy variations' },
      { name: 'audience-builder', note: 'CSV → hashed custom audience' },
      { name: 'fatigue-monitor', note: 'CTR decay · frequency cap' },
      { name: 'spend-tracker', note: 'MTD pacing · burn alerts' },
    ],
  },
  {
    code: 'google',
    label: 'Google Ads',
    subtitle: 'Search · Performance Max',
    accent: '#fbbf24',
    skills: [
      { name: 'performance-auditor', note: 'period-over-period audit' },
      { name: 'keyword-analyzer', note: 'QS · impression share · CPC' },
      { name: 'search-terms', note: 'intent classifier · PT + EN' },
      { name: 'negative-keywords', note: 'mine + bulk apply EXACT' },
    ],
  },
  {
    code: 'linkedin',
    label: 'LinkedIn Ads',
    subtitle: 'ABM · Sponsored Content',
    accent: '#38bdf8',
    skills: [
      { name: 'audience-builder', note: 'DMP segment · USER or COMPANY' },
      { name: 'bid-optimizer', note: 'CTR / CPC heuristics + apply' },
      { name: 'bulk-editor', note: 'CSV → status · budget · bid' },
      { name: 'creative-strategist', note: 'format performance + tests' },
    ],
  },
  {
    code: 'cross',
    label: 'Cross-platform',
    subtitle: 'Meta ∙ Google ∙ LinkedIn',
    accent: '#34d399',
    skills: [
      { name: 'crm-sync', note: 'one CSV → three audiences' },
      { name: 'dashboard', note: 'unified HTML · donut shares' },
      { name: 'budget-rebalance', note: 'CPA-weighted reallocation' },
      { name: 'drive-fetch', note: 'Drive folder → meta upload' },
    ],
  },
];

export function PlatformGrid() {
  return (
    <section id="skills" className="relative px-6 sm:px-10 py-20 sm:py-28 border-t border-ink-800">
      <div className="flex items-baseline justify-between gap-4 mb-14">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
              The anatomy · 14 skills
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl leading-[0.98] tracking-[-0.02em] text-ink-50 max-w-2xl">
            Every tedious ad-ops ritual,{' '}
            <em className="italic font-light text-ink-300">assembled.</em>
          </h2>
        </div>
        <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 whitespace-nowrap self-end pb-2">
          §02 · platforms
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
                        {s.note}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-5 border-t border-ink-800 flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-500 uppercase tracking-widest">
                .claude/skills/{p.code === 'cross' ? 'cross-platform' : p.code + '-ads'}/
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
    </section>
  );
}
