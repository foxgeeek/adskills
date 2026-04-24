'use client';

export function Footer() {
  return (
    <footer className="relative px-6 sm:px-10 pt-12 pb-10 border-t border-ink-800">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
        <div className="md:col-span-5">
          <div className="font-[family-name:var(--font-fraunces)] text-2xl tracking-tight text-ink-100">
            adskills<span className="text-jade-400">.</span>
          </div>
          <p className="mt-3 text-sm text-ink-400 max-w-sm leading-relaxed">
            Ad ops, from the terminal. A Claude Code Skills framework.
            Fork it, extend it, rebrand it &mdash; it&rsquo;s yours.
          </p>
        </div>

        <div className="md:col-span-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500 mb-4">
            platforms
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
            documentation
          </div>
          <ul className="space-y-2 text-sm text-ink-200">
            <li>
              <a href="https://github.com/your-org/adskills#readme" className="hover:text-jade-300 transition-colors">
                → README
              </a>
            </li>
            <li>
              <a href="https://github.com/your-org/adskills/blob/main/docs/architecture.md" className="hover:text-jade-300 transition-colors">
                → architecture
              </a>
            </li>
            <li>
              <a href="https://github.com/your-org/adskills/blob/main/docs/auth-setup.md" className="hover:text-jade-300 transition-colors">
                → auth setup per platform
              </a>
            </li>
            <li>
              <a href="https://github.com/your-org/adskills/blob/main/CONTRIBUTING.md" className="hover:text-jade-300 transition-colors">
                → contributing
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-14 pt-6 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          MIT · 2026 · AdSkills contributors
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          <span>v0.1.0</span>
          <span className="h-1 w-1 rounded-full bg-ink-600" />
          <span>node ≥ 22</span>
          <span className="h-1 w-1 rounded-full bg-ink-600" />
          <span className="text-jade-400">ship it</span>
        </div>
      </div>
    </footer>
  );
}
