'use client';

const principles = [
  {
    index: '01',
    title: 'Read-only by default',
    body: 'Every skill ships a report path first. Mutation is opt-in, never the default. You read before you write.',
  },
  {
    index: '02',
    title: 'Confirmation is a feature',
    body: 'Every destructive action previews the diff and asks for a literal yes. Automation that skips the prompt is automation waiting to go wrong.',
  },
  {
    index: '03',
    title: 'Your tokens, your machine',
    body: 'OAuth tokens are AES-256-GCM encrypted on disk under ~/.adskills. No telemetry, no cloud keystore, no proxy. Lose the password, lose the tokens — the tradeoff is deliberate.',
  },
  {
    index: '04',
    title: 'Partial success is honest',
    body: 'When one platform in a cross-platform run fails, the others still finish. The report surfaces which worked and which didn’t. No silent swallowing.',
  },
  {
    index: '05',
    title: 'Reports beat dashboards',
    body: 'Every command emits a standalone HTML file and a markdown companion. Slack, email, archive, diff. You own the artifact, not a SaaS URL that expires.',
  },
  {
    index: '06',
    title: 'Terminal is the UI',
    body: 'Ads managers train you to click. Claude Code and adskills let you describe. The same intent becomes a reviewable, replayable transcript instead of a browser tab graveyard.',
  },
];

export function Principles() {
  return (
    <section className="relative px-6 sm:px-10 py-24 sm:py-32 border-t border-ink-800">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline justify-between gap-4 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-12 bg-amber-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
                §05 · the doctrine
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-7xl leading-[0.98] tracking-[-0.025em] text-ink-50 max-w-3xl">
              Six rules we refuse to{' '}
              <em className="italic font-light text-ink-300">compromise on.</em>
            </h2>
          </div>
          <span className="hidden md:inline font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 whitespace-nowrap self-end pb-2">
            opinion · convention · code
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-ink-800 border border-ink-800">
          {principles.map((p) => (
            <article
              key={p.index}
              className="group relative bg-ink-950 hover:bg-ink-900 transition-colors p-8 min-h-[240px]"
            >
              <div className="flex items-start justify-between mb-5">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-jade-400">
                  rule {p.index}
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
            Every line of adskills is an application of these rules. Fork the
            repo, disagree, and write your own doctrine &mdash; that&rsquo;s
            what MIT is for.
          </p>
          <div className="h-px w-12 bg-ink-600" />
        </div>
      </div>
    </section>
  );
}
