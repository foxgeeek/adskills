'use client';

import { useLocale } from '../i18n/LocaleContext';

export function Architecture() {
  const { t } = useLocale();
  return (
    <section id="architecture" className="relative px-6 sm:px-10 lg:px-16 py-20 sm:py-28 border-t border-ink-800">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
              {t.architecture.kicker}
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl leading-[0.98] tracking-[-0.02em] text-ink-50">
            {t.architecture.titleA}{' '}
            <em className="italic font-light text-ink-300">{t.architecture.titleB}</em>
          </h2>
          <p className="mt-8 text-ink-300 leading-relaxed max-w-md">
            <code className="text-jade-300 font-mono">SKILL.md</code> {t.architecture.body.a}
          </p>

          <dl className="mt-10 space-y-5">
            {t.architecture.layers.map((l) => (
              <Layer key={l.index} index={l.index} title={l.title} body={l.body} />
            ))}
          </dl>
        </div>

        <div className="col-span-12 lg:col-span-7 lg:pl-8">
          <DiagramCard />
        </div>
      </div>
    </section>
  );
}

function Layer({ index, title, body }: { index: string; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-6 border-b border-ink-800 pb-5">
      <dt className="font-mono text-xs text-jade-400 tracking-widest pt-1">{index}</dt>
      <dd>
        <div className="font-[family-name:var(--font-fraunces)] text-2xl text-ink-50 leading-none">
          {title}
        </div>
        <p className="mt-2 text-ink-300 leading-relaxed">{body}</p>
      </dd>
    </div>
  );
}

function DiagramCard() {
  const { t } = useLocale();
  const d = t.architecture.diagram;
  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          {d.caption}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          {d.fig}
        </span>
      </div>

      <div className="ruled border border-ink-700 bg-ink-950 p-8 sm:p-10">
        <DiagramRow
          label={d.youLabel}
          content={<span className="italic text-ink-200 font-[family-name:var(--font-fraunces)]">{d.youContent}</span>}
          arrow
        />
        <DiagramRow
          tag="skill"
          tagColor="text-jade-400"
          label="SKILL.md"
          content={<code className="font-mono text-[12px] text-ink-200">.claude/skills/meta-ads/creative-strategy/</code>}
          arrow
        />
        <DiagramRow
          tag="cli"
          tagColor="text-amber-400"
          label={d.cmdLabel}
          content={<code className="font-mono text-[12px] text-ink-200">{d.cmdContent}</code>}
          arrow
        />
        <DiagramRow
          tag="cmd"
          tagColor="text-ink-200"
          label={d.cmdFileLabel}
          content={
            <span className="font-mono text-[12px] text-ink-400">
              {d.cmdFileContent.map((step, i) => (
                <span key={step}>
                  {i > 0 && ' · '}
                  <span className="text-ink-200">{step}</span>
                </span>
              ))}
            </span>
          }
          arrow
        />
        <DiagramRow
          tag="core"
          tagColor="text-ink-400"
          label={d.coreLabel}
          content={<span className="font-mono text-[12px] text-ink-400">{d.coreContent}</span>}
          arrow
        />
        <DiagramRow
          tag="api"
          tagColor="text-rose-300"
          label={d.apiLabel}
          content={
            <span className="font-mono text-[12px] text-ink-400">
              {d.apiPrefix}
              {d.apiPaths.map((p, i) => (
                <span key={p}>
                  {i > 0 && ', '}
                  <span className="text-amber-300">{p}</span>
                </span>
              ))}
            </span>
          }
          arrow
        />
        <DiagramRow
          tag="out"
          tagColor="text-jade-300"
          label={d.outLabel}
          content={<span className="font-mono text-[12px] text-ink-400">{d.outContent}</span>}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-[11px] font-mono uppercase tracking-widest text-ink-500">
        <span>{t.architecture.chips[0]}</span>
        <span className="text-center">{t.architecture.chips[1]}</span>
        <span className="text-right">{t.architecture.chips[2]}</span>
      </div>
    </div>
  );
}

function DiagramRow({
  label,
  tag,
  tagColor,
  content,
  arrow,
}: {
  label: string;
  tag?: string;
  tagColor?: string;
  content: React.ReactNode;
  arrow?: boolean;
}) {
  return (
    <>
      <div className="grid grid-cols-[56px_140px_1fr] items-baseline gap-4 py-2">
        <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${tagColor ?? 'text-ink-400'}`}>
          {tag ?? '›'}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-400 truncate">
          {label}
        </span>
        <span className="text-sm">{content}</span>
      </div>
      {arrow && (
        <div className="grid grid-cols-[56px_140px_1fr] py-0.5">
          <div />
          <div className="font-mono text-ink-600 text-sm">│</div>
          <div />
        </div>
      )}
    </>
  );
}
