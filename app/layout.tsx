import type React from "react"
import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-serif", weight: ["400", "600", "700"] })

export const metadata: Metadata = {
  title: "FPH Agentic Sales OS",
  description: "AI Real-Estate Sales Agent Operating System - First Projects Holding",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${cinzel.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <Script
          src="https://unpkg.com/@elevenlabs/convai-widget-embed@beta"
          strategy="lazyOnload"
          type="text/javascript"
        />
      </body>
    </html>
  )
}
