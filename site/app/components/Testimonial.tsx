'use client';

export function Testimonial() {
  return (
    <section className="relative px-6 sm:px-10 py-24 sm:py-36 border-t border-ink-800 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]">
        <div
          className="absolute -left-16 top-10 font-[family-name:var(--font-fraunces)] text-[380px] leading-none text-jade-400 select-none"
          aria-hidden="true"
        >
          &ldquo;
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
          §05 · the prior art
        </span>
        <blockquote className="mt-8 font-[family-name:var(--font-fraunces)] text-3xl sm:text-5xl leading-[1.08] tracking-[-0.01em] text-ink-100 italic">
          &ldquo;We run{' '}
          <span className="not-italic font-medium text-jade-300">$300k / month</span>{' '}
          in ad spend at{' '}
          <span className="not-italic font-medium text-ink-50">4&times; ROAS</span>{' '}
          by letting Claude drive every bulk edit, audit, and audience push from the terminal.&rdquo;
        </blockquote>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
          <div className="h-px w-12 bg-ink-600" />
          <div className="text-center sm:text-left">
            <div className="font-mono text-[12px] uppercase tracking-[0.25em] text-ink-100">
              Michel Lieben
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
              Founder · ColdIQ · creator of &ldquo;Claude Code for Ads&rdquo;
            </div>
          </div>
          <div className="h-px w-12 bg-ink-600" />
        </div>

        <p className="mt-16 max-w-xl mx-auto text-ink-400 text-sm leading-relaxed">
          AdSkills is an open-source take on the same idea, focused on Brazilian
          workflows (WhatsApp leads, phone normalization to E.164) and
          multi-account agency use.
        </p>
      </div>
    </section>
  );
}
