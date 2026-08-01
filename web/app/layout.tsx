import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: 'Lexify - AI-Powered Language Learning & IELTS Prep in Telegram',
  description: 'Master English vocabulary with AI explanations, IELTS writing evaluation, and spaced repetition quizzes directly in Telegram and Web.',
  keywords: [
    'language learning',
    'vocabulary builder',
    'IELTS writing evaluation',
    'AI English tutor',
    'Telegram language bot',
    'spaced repetition',
    'Groq AI'
  ],
  authors: [{ name: 'Lexify Team' }],
  openGraph: {
    title: 'Lexify - AI-Powered Language Learning & IELTS Prep',
    description: 'Master vocabulary with AI explanations, IELTS writing feedback, and spaced repetition quizzes.',
    url: 'https://lexify.app',
    siteName: 'Lexify',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lexify - AI Language Learning in Telegram',
    description: 'AI explanations, spaced repetition, and instant IELTS writing evaluations.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
