'use client';

export function Marquee() {
  const items = [
    'AES-256-GCM encrypted tokens',
    'destructive actions require confirmation',
    'status=PAUSED by default',
    'SHA-256 PII hashing client-side',
    'LGPD-friendly',
    'Node 22 · strict TypeScript',
    'GAQL · Meta Graph · LinkedIn REST v202410',
    'Chart.js in the reports',
  ];
  const doubled = [...items, ...items];

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
