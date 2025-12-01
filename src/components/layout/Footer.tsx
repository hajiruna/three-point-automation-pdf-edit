'use client'

import { useTheme } from '@/components/ui'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <footer className={`border-t transition-colors duration-300 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            &copy; {currentYear} PDF Page Selector. Maruhan North Central Office All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              ※ ファイルはご自身のPC内のみで処理され、外部サーバーには送信されません
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
