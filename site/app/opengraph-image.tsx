import { ImageResponse } from 'next/og';

export const alt = 'AdSkills — ad operations, from the terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at top, #0f172a, #020617)',
          color: '#e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          position: 'relative',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div style={{ width: 48, height: 2, background: '#10b981' }} />
          <div
            style={{
              fontSize: 16,
              letterSpacing: '0.35em',
              color: '#10b981',
              textTransform: 'uppercase',
              fontFamily: 'monospace',
            }}
          >
            adskills · mit · open source
          </div>
        </div>

        <div
          style={{
            fontSize: 110,
            fontFamily: 'serif',
            lineHeight: 0.94,
            letterSpacing: '-0.035em',
            fontWeight: 500,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span style={{ color: '#f3f5f8' }}>Ad operations,</span>
          <span style={{ color: '#b8c0cc', fontStyle: 'italic', fontWeight: 300 }}>
            from the
          </span>
          <span style={{ color: '#34d399', fontWeight: 500 }}>terminal.</span>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 80,
            left: 80,
            right: 80,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            fontSize: 22,
            color: '#8a94a6',
            fontFamily: 'monospace',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ color: '#d9dfe7' }}>
              Meta · Google · LinkedIn · Cross-platform
            </span>
            <span style={{ fontSize: 18 }}>
              14 Claude Code Skills · 15 CLI commands · Node 22
            </span>
          </div>
          <div
            style={{
              fontSize: 44,
              fontFamily: 'serif',
              color: '#f3f5f8',
              display: 'flex',
            }}
          >
            adskills<span style={{ color: '#10b981' }}>.</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
