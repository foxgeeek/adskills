'use client';

export function Architecture() {
  return (
    <section id="architecture" className="relative px-6 sm:px-10 py-20 sm:py-28 border-t border-ink-800">
      <div className="grid grid-cols-12 gap-6 items-start">
        <div className="col-span-12 lg:col-span-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-amber-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
              §04 · architecture
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-fraunces)] text-5xl sm:text-6xl leading-[0.98] tracking-[-0.02em] text-ink-50">
            Five layers,{' '}
            <em className="italic font-light text-ink-300">
              each minding its business.
            </em>
          </h2>
          <p className="mt-8 text-ink-300 leading-relaxed max-w-md">
            <code className="text-jade-300 font-mono">SKILL.md</code> files
            describe intent in plain markdown. The CLI parses flags and
            delegates to a command module. Commands orchestrate —
            clients execute, reporters render.
          </p>

          <dl className="mt-10 space-y-5">
            <Layer index="01" title="skills" body="Plain-English skill docs in .claude/skills/ — Claude Code reads them as instructions." />
            <Layer index="02" title="cli" body="commander-based argument parsing, interactive prompts, password-protected token unlock." />
            <Layer index="03" title="commands" body="One file per CLI command. Scan → confirm → batch → report." />
            <Layer index="04" title="clients" body="Thin, typed wrappers over Graph API, google-ads-api, LinkedIn REST." />
            <Layer index="05" title="reporters" body="Self-contained HTML via Tailwind + Chart.js CDN, plus a markdown companion." />
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
  return (
    <div className="relative">
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-400">
          layered flow · request lifetime
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-500">
          fig. 06
        </span>
      </div>

      <div className="ruled border border-ink-700 bg-ink-950 p-8 sm:p-10">
        <DiagramRow
          label="you, in claude code"
          content={<span className="italic text-ink-200 font-[family-name:var(--font-fraunces)]">&ldquo;upload q2 creatives and pause fatigued ones&rdquo;</span>}
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
          label="commander"
          content={<code className="font-mono text-[12px] text-ink-200">adskills meta upload --account coldiq ...</code>}
          arrow
        />
        <DiagramRow
          tag="cmd"
          tagColor="text-ink-200"
          label="src/commands/meta-upload.ts"
          content={
            <span className="font-mono text-[12px] text-ink-400">
              <span className="text-ink-200">scan</span> · <span className="text-ink-200">prompt</span> · <span className="text-ink-200">batch</span> · <span className="text-ink-200">render</span>
            </span>
          }
          arrow
        />
        <DiagramRow
          tag="core"
          tagColor="text-ink-400"
          label="auth.ts · rate-limiter"
          content={<span className="font-mono text-[12px] text-ink-400">unlock tokens · throttle calls</span>}
          arrow
        />
        <DiagramRow
          tag="api"
          tagColor="text-rose-300"
          label="MetaClient"
          content={
            <span className="font-mono text-[12px] text-ink-400">
              POST <span className="text-amber-300">/adimages</span>, <span className="text-amber-300">/adcreatives</span>, <span className="text-amber-300">/ads</span>
            </span>
          }
          arrow
        />
        <DiagramRow
          tag="out"
          tagColor="text-jade-300"
          label="reporters"
          content={
            <span className="font-mono text-[12px] text-ink-400">
              <span className="text-ink-200">.html</span> · <span className="text-ink-200">.md</span> → <span className="text-ink-300 underline decoration-dotted decoration-ink-600">reports/</span>
            </span>
          }
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-[11px] font-mono uppercase tracking-widest text-ink-500">
        <span>Node 22 · strict TS</span>
        <span className="text-center">no mocks in prod paths</span>
        <span className="text-right">fail partial, report honest</span>
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
