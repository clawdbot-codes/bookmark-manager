import { Inter } from 'next/font/google'
import SessionProviderWrapper from '@/components/SessionProvider'
import Header from '@/components/Header'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Bookmark Manager',
  description: 'A smart bookmark management system with todo workflow and classification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}