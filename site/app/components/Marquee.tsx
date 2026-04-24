'use client';

import { useLocale } from '../i18n/LocaleContext';

export function Marquee() {
  const { t } = useLocale();
  const doubled = [...t.marquee, ...t.marquee];

  return (
    <section className="relative border-y border-ink-800 py-5 overflow-hidden bg-ink-900/30">
      <div className="marq flex">
        <div className="flex gap-12 whitespace-nowrap font-mono text-xs uppercase tracking-[0.25em] text-ink-400 animate-[scroll_40s_linear_infinite]">
          {doubled.map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              <span className="text-jade-400">◆</span>
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
