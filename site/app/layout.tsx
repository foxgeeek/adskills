import type { Metadata, Viewport } from 'next';
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://adskills.vercel.app';
const SITE_NAME = 'AdSkills';
const SITE_TITLE = 'AdSkills — ad operations, from the terminal';
const SITE_DESCRIPTION =
  'Claude Code Skills framework for multi-platform ad operations. Run Meta, Google, and LinkedIn Ads campaigns in natural language — bulk uploads, fatigue detection, CRM syncs, and cross-platform dashboards with audited, confirmation-gated mutations.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s · AdSkills',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: 'Next.js',
  keywords: [
    'Claude Code',
    'Claude Code Skills',
    'Anthropic',
    'ad operations',
    'ad ops',
    'Meta Ads',
    'Facebook Ads',
    'Instagram Ads',
    'Google Ads',
    'LinkedIn Ads',
    'marketing automation',
    'paid media',
    'CLI',
    'TypeScript',
    'Next.js',
    'open source',
    'MIT licensed',
    'OAuth',
    'custom audiences',
    'creative fatigue',
    'cross-platform',
    'ABM',
    'performance marketing',
    'adskills',
  ],
  authors: [{ name: 'foxgeeek', url: 'https://github.com/foxgeeek' }],
  creator: 'foxgeeek',
  publisher: 'foxgeeek',
  category: 'technology',
  alternates: {
    canonical: SITE_URL,
    languages: {
      'en-US': SITE_URL,
      'pt-BR': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
    alternateLocale: ['pt_BR'],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: '@foxgeeek',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon', type: 'image/png', sizes: '32x32' },
    ],
    apple: '/icon',
  },
  other: {
    'theme-color': '#05070a',
    'color-scheme': 'dark',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#05070a' },
    { media: '(prefers-color-scheme: light)', color: '#05070a' },
  ],
  colorScheme: 'dark',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE_URL}/#software`,
      name: 'AdSkills',
      alternateName: 'adskills',
      description: SITE_DESCRIPTION,
      applicationCategory: 'DeveloperApplication',
      applicationSubCategory: 'CLI',
      operatingSystem: 'macOS, Linux, Windows',
      softwareVersion: '0.1.0',
      url: SITE_URL,
      downloadUrl: 'https://github.com/foxgeeek/adskills',
      license: 'https://opensource.org/licenses/MIT',
      programmingLanguage: 'TypeScript',
      runtimePlatform: 'Node.js 22+',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      author: {
        '@type': 'Person',
        name: 'foxgeeek',
        url: 'https://github.com/foxgeeek',
      },
      featureList: [
        'Meta Ads bulk creative upload',
        'Google Ads keyword analysis',
        'LinkedIn Ads ABM audience builder',
        'Cross-platform CRM sync',
        'Unified performance dashboard',
        'Budget rebalance recommendations',
        'Encrypted OAuth token store',
      ],
    },
    {
      '@type': 'SoftwareSourceCode',
      '@id': `${SITE_URL}/#source`,
      name: 'adskills',
      codeRepository: 'https://github.com/foxgeeek/adskills',
      programmingLanguage: 'TypeScript',
      license: 'https://opensource.org/licenses/MIT',
      author: {
        '@type': 'Person',
        name: 'foxgeeek',
        url: 'https://github.com/foxgeeek',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      inLanguage: ['en-US', 'pt-BR'],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${plex.variable} ${mono.variable}`}>
      <head>
        <style>{`
          :root { font-family: var(--font-plex); }
          html, body { font-family: var(--font-plex); }
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
