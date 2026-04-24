import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
import { LocaleProvider } from './i18n/LocaleContext';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz', 'SOFT'],
  display: 'swap',
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AdSkills — ad operations, from the terminal',
  description:
    'AdSkills — Claude Code Skills framework for multi-platform ad operations. Meta, Google, LinkedIn. One prompt, any action.',
  metadataBase: new URL('https://adskills.dev'),
  openGraph: {
    title: 'AdSkills — ad operations, from the terminal',
    description:
      'Run Meta, Google, and LinkedIn ad operations from Claude Code via natural language.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plex.variable} ${mono.variable}`}>
      <head>
        <style>{`
          :root { font-family: var(--font-plex); }
          html, body { font-family: var(--font-plex); }
        `}</style>
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
