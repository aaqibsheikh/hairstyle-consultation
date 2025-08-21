import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MKH Hair Color Analysis | Professional Hair Consultation',
  description: 'Get your personalized hair color analysis and schedule your perfect hair days with MKH Hair. Professional consultation for balayage, highlights, and hair styling.',
  keywords: 'hair color analysis, hair consultation, balayage, highlights, hair styling, MKH Hair, professional hair salon',
  authors: [{ name: 'MKH Hair' }],
  creator: 'MKH Hair',
  publisher: 'MKH Hair',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mkh-hair.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MKH Hair Color Analysis | Professional Hair Consultation',
    description: 'Get your personalized hair color analysis and schedule your perfect hair days with MKH Hair. Professional consultation for balayage, highlights, and hair styling.',
    url: 'https://mkh-hair.com',
    siteName: 'MKH Hair',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MKH Hair Color Analysis - Professional Hair Consultation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MKH Hair Color Analysis | Professional Hair Consultation',
    description: 'Get your personalized hair color analysis and schedule your perfect hair days with MKH Hair.',
    images: ['/og-image.jpg'],
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
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#ff7f50' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#ff7f50',
  colorScheme: 'dark',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="application-name" content="MKH Hair Color Analysis" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="MKH Hair" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#ff7f50" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
