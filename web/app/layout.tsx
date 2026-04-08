import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Lexify - AI-Powered Language Learning',
  description: 'Master vocabulary with AI explanations, IELTS coaching, and intelligent quizzes directly in Telegram.',
  keywords: ['language learning', 'vocabulary', 'IELTS', 'AI tutor', 'Telegram bot'],
  authors: [{ name: 'Lexify' }],
  openGraph: {
    title: 'Lexify - AI-Powered Language Learning',
    description: 'Master vocabulary with AI explanations, IELTS coaching, and intelligent quizzes.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-background text-white`}>
        {children}
      </body>
    </html>
  )
}
