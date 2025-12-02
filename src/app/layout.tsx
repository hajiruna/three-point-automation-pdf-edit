import type { Metadata } from 'next'
import './globals.css'
import { Header, Footer, ThemeWrapper } from '@/components/layout'
import { ToastProvider, ThemeProvider } from '@/components/ui'
import { AuthProvider } from '@/components/auth'

export const metadata: Metadata = {
  title: 'PDF Page Selector - ページ抽出ツール',
  description: '検定通知書PDFのページ操作ツール - ページ抽出・PDF合体',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <ThemeWrapper>
              <ToastProvider>
                <Header />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </ToastProvider>
            </ThemeWrapper>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
