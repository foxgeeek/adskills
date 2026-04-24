import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05070a',
          fontFamily: 'serif',
          fontSize: 24,
          fontWeight: 500,
          color: '#d9dfe7',
        }}
      >
        a<span style={{ color: '#10b981', marginLeft: -2 }}>.</span>
      </div>
    ),
    size,
  );
}
