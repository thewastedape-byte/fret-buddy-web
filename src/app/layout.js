import './globals.css'
import Nav from '@/components/Nav'

export const metadata = {
  title: 'Fret Buddy - AI Guitar Teacher',
  description: 'Your AI-powered guitar teacher. Camera analysis, voice lessons, tabs, theory and more.',
  manifest: '/manifest.json',
  themeColor: '#0d0d1a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fret Buddy',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Fret Buddy" />
        <meta name="theme-color" content="#0d0d1a" />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
      </body>
    </html>
  )
}
