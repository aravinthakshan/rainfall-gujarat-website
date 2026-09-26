import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider, themeInitScript } from "@/components/theme-provider"
import { TopNavigation } from "@/components/top-nav"

const geist = Geist({ subsets: ["latin"] })

const title = "Gujarat Monsoon Monitor · Water & Climate Lab, IIT Gandhinagar"
const description =
  "Taluka-level rainfall and dam storage across Gujarat, updated daily from official state reports. Interactive maps and history charts."

// Icons come from app/icon.png, app/apple-icon.png and app/favicon.ico
export const metadata: Metadata = {
  metadataBase: new URL("https://rainfall-gujarat-website.vercel.app"),
  title,
  description,
  keywords: ["Gujarat rainfall", "taluka rainfall", "monsoon", "dam storage", "reservoir levels", "SEOC", "IIT Gandhinagar"],
  authors: [{ name: "Water & Climate Lab, IIT Gandhinagar" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Gujarat Monsoon Monitor",
    title,
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Map of Gujarat talukas shaded by 2025 season rainfall, with the title Gujarat Monsoon Monitor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
            <div className="min-h-screen w-full flex flex-col">
              <TopNavigation />
              <main className="flex-1 w-full">{children}</main>
            </div>
        </ThemeProvider>
      </body>
    </html>
  )
}