import type { Metadata } from 'next'
import './globals.css'
import { Header, Footer } from '@/components/layout'
import { ToastProvider } from '@/components/ui'

export const metadata: Metadata = {
  title: 'PDF Page Selector - ページ抽出ツール',
  description: 'PDFファイルから必要なページだけを抽出してダウンロードできるツール',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex flex-col">
        <ToastProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  )
}
