import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FlowPulse AI — Predictive Hospital Flow Intelligence',
  description:
    'Predictive Hospital Flow Intelligence & Counterfactual Operations Platform. Real-time patient flow, capacity, and ripple analysis for modern hospital command centers.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#26304a',
  colorScheme: 'light',
}

import { FlowPulseProvider } from '@/components/providers/flowpulse-provider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`bg-background ${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <FlowPulseProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </FlowPulseProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
