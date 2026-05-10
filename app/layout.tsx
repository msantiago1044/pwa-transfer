import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { ChunkLoadErrorHandler } from '@/components/chunk-load-error-handler'
import PWARegister from './_components/pwa-register'
import type { Metadata, Viewport } from 'next'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const jakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-display' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export const metadata: Metadata = {
  title: 'Transferencia - Compartir sin Limites',
  description: 'Transferencia de archivos e imagenes en tiempo real entre PC y movil sin registro',
  manifest: '/manifest.json',
  keywords: ['transferencia', 'archivos', 'compartir', 'PWA', 'tiempo real'],
  authors: [{ name: 'Abacus AI' }],
  creator: 'Abacus AI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Transferencia',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    url: 'https://transferencia.app',
    title: 'Transferencia - Compartir sin Limites',
    description: 'Transferencia de archivos e imagenes en tiempo real entre PC y movil',
    siteName: 'Transferencia',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Transferencia - Compartir sin Limites',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Transferencia',
    description: 'Transferencia de archivos sin registro',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" async></script>
      </head>
      <body className={`${dmSans.variable} ${jakartaSans.variable} ${jetbrainsMono.variable} font-sans`}>
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PWARegister />
          {children}
          <Toaster />
          <ChunkLoadErrorHandler />
        </ThemeProvider>
      </body>
    </html>
  )
}
