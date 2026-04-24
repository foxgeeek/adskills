'use client';

export function Hero() {
  return (
    <section className="relative px-6 sm:px-10 pt-10 pb-20 sm:pt-20 sm:pb-28 halo">
      <div className="grid grid-cols-12 gap-6">
        {/* Left: display type */}
        <div className="col-span-12 lg:col-span-7">
          <div className="rise" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-jade-400" />
              <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-jade-400">
                Issue 01 · adskills quarterly
              </span>
            </div>
          </div>

          <h1 className="rise font-[family-name:var(--font-fraunces)] leading-[0.94] tracking-[-0.035em] text-[60px] sm:text-[92px] lg:text-[128px]" style={{ animationDelay: '200ms' }}>
            <span className="block text-ink-50">Ad operations,</span>
            <span className="block italic font-light text-ink-200">from the</span>
            <span className="block shimmer-text font-medium">terminal.</span>
          </h1>

          <p className="rise mt-10 max-w-xl text-lg sm:text-xl leading-relaxed text-ink-300" style={{ animationDelay: '400ms' }}>
            A <em className="text-ink-100 font-[family-name:var(--font-fraunces)] italic">Claude Code Skills</em> framework for
            operating Meta, Google, and LinkedIn campaigns in natural language. Bulk uploads, fatigue
            detection, CRM syncs, cross-platform dashboards &mdash; every action auditable,
            every mutation confirmed.
          </p>

          <div className="rise mt-10 flex flex-wrap items-center gap-4" style={{ animationDelay: '600ms' }}>
            <a
              href="#quickstart"
              className="group inline-flex items-center gap-3 bg-jade-400 hover:bg-jade-300 text-ink-950 font-mono text-sm font-medium px-5 py-3 rounded-sm transition-colors"
            >
              <span>install</span>
              <span className="text-ink-950/60 group-hover:text-ink-950">→</span>
            </a>
            <a
              href="https://github.com/your-org/adskills"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-3 border border-ink-600 hover:border-ink-400 text-ink-100 font-mono text-sm px-5 py-3 rounded-sm transition-colors"
            >
              <span>read the source</span>
              <span className="text-ink-400 group-hover:text-ink-200">↗</span>
            </a>
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400 hidden sm:inline">
              <kbd className="kbd">MIT</kbd> · Node 22 · TypeScript
            </span>
          </div>

          <div className="rise mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 pr-4" style={{ animationDelay: '800ms' }}>
            <Stat num="15" label="CLI commands" />
            <Stat num="14" label="Claude Skills" />
            <Stat num="3+1" label="ad platforms" />
            <Stat num="36 / 36" label="unit tests" />
          </div>
        </div>

        {/* Right: terminal */}
        <div className="col-span-12 lg:col-span-5 lg:pl-8 mt-8 lg:mt-0">
          <TerminalBlock />
        </div>
      </div>
    </section>
  );
}

function Stat({ num, label }: { num: string; label: string }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-fraunces)] text-4xl text-ink-50 leading-none tabular-nums">{num}</div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-400">
        {label}
      </div>
    </div>
  );
}

function TerminalBlock() {
  return (
    <div className="relative rise" style={{ animationDelay: '500ms' }}>
      {/* Frame label top */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          ~/pessoal/adskills
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          fig. 1
        </span>
      </div>

      <div className="relative border border-ink-600 bg-ink-900/80 backdrop-blur">
        {/* Traffic lights */}
        <div className="flex items-center gap-2 border-b border-ink-700 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-500" />
          <span className="h-2.5 w-2.5 rounded-full bg-jade-400" />
          <span className="ml-3 font-mono text-[10px] tracking-widest uppercase text-ink-400">
            claude-code — adskills
          </span>
        </div>

        <pre className="px-5 py-5 font-mono text-[12.5px] leading-[1.7] text-ink-200 overflow-x-auto">
          <Line delay={900}>
            <Prompt />
            <span className="text-ink-100">rebalance $8k across platforms for account </span>
            <span className="text-amber-300">acme</span>
          </Line>

          <Line delay={1300}>
            <span className="text-jade-400">›</span>
            <span className="text-ink-300"> invoking skill </span>
            <span className="text-jade-300 font-medium">cross-platform/budget-rebalance</span>
          </Line>

          <Line delay={1600}>
            <span className="text-ink-500">  fetching 30d performance · 3 platforms</span>
          </Line>

          <Line delay={1900}>
            <span className="text-ink-500">  </span>
            <span className="text-ink-300">Meta</span>
            <span className="text-ink-500">      CPA $14.20 </span>
            <span className="text-jade-400">efficiency 100%</span>
          </Line>

          <Line delay={2050}>
            <span className="text-ink-500">  </span>
            <span className="text-ink-300">Google</span>
            <span className="text-ink-500">    CPA $26.80 </span>
            <span className="text-amber-300">efficiency  53%</span>
          </Line>

          <Line delay={2200}>
            <span className="text-ink-500">  </span>
            <span className="text-ink-300">LinkedIn</span>
            <span className="text-ink-500">  CPA $51.40 </span>
            <span className="text-rose-300">efficiency  28%</span>
          </Line>

          <Line delay={2400}>
            <span className="text-ink-500">  ────────────────────────────────</span>
          </Line>

          <Line delay={2550}>
            <span className="text-ink-500">  </span>
            <span className="text-jade-400">→</span>
            <span className="text-ink-300"> shift </span>
            <span className="text-jade-300">+$1,840</span>
            <span className="text-ink-400"> from LinkedIn to Meta</span>
          </Line>

          <Line delay={2750}>
            <span className="text-ink-500">  </span>
            <span className="text-jade-400">✓</span>
            <span className="text-ink-400"> report </span>
            <span className="text-ink-300 underline decoration-dotted decoration-ink-500">
              reports/cross-ads/budget-rebalance/
            </span>
          </Line>

          <Line delay={3050}>
            <Prompt />
            <span className="text-ink-100">negative-keyword mine last 14 days</span>
            <span className="caret" />
          </Line>
        </pre>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          every mutation confirmed · status=paused by default
        </span>
        <span className="font-mono text-[10px] text-ink-600">01.04</span>
      </div>
    </div>
  );
}

function Prompt() {
  return (
    <span>
      <span className="text-ink-500">❯</span>
      <span className="text-jade-400"> adskills</span>
      <span className="text-ink-300"> </span>
    </span>
  );
}

function Line({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <div className="rise" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both', opacity: 0 }}>
      {children}
      <br />
    </div>
  );
}
