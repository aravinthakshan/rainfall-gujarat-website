import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TopNavigation } from "@/components/top-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "RainInsight - Water & Climate Lab",
  description: "Advanced rainfall monitoring and analytics platform for Gujarat. Interactive maps, real-time data visualization, and comprehensive rainfall analysis tools.",
  keywords: ["rainfall", "climate", "monitoring", "analytics", "Gujarat", "weather", "data visualization", "maps"],
  authors: [{ name: "Water & Climate Lab" }],
  creator: "Water & Climate Lab",
  publisher: "Water & Climate Lab",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rainfall-gujarat-website.vercel.app'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://rainfall-gujarat-website.vercel.app', // Replace with your actual domain
    title: 'RainInsight - Advanced Rainfall Analytics Platform',
    description: 'Interactive rainfall monitoring and analytics platform for Gujarat. Explore real-time data, interactive maps, and comprehensive rainfall analysis tools.',
    siteName: 'RainInsight',
    images: [
      {
        url: '/og-image.svg', // Updated to use SVG
        width: 1200,
        height: 630,
        alt: 'RainInsight - Rainfall Analytics Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RainInsight - Advanced Rainfall Analytics Platform',
    description: 'Interactive rainfall monitoring and analytics platform for Gujarat. Explore real-time data, interactive maps, and comprehensive rainfall analysis tools.',
    images: ['/og-image.svg'], // Updated to use SVG
    creator: '@yourtwitterhandle', // Replace with your Twitter handle if you have one
    site: '@yourtwitterhandle', // Replace with your Twitter handle if you have one
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
  verification: {
    google: 'your-google-verification-code', // Optional: Add if you have Google Search Console verification
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="min-h-screen w-full flex flex-col">
            <TopNavigation />
            <main className="flex-1 w-full">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}