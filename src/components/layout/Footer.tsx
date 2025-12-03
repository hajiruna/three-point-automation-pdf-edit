'use client'

import Image from 'next/image'
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
          <div className="flex items-center gap-2">
            {/* 吹き出し */}
            <div className="relative">
              <div className={`relative px-4 py-2 rounded-xl ${
                isDark ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  ファイルはPC内で処理されるにゃ！
                  <br />
                  外部には送信されないから安心にゃん♪
                </span>
                {/* 吹き出しの三角形 */}
                <div className={`absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0
                  border-t-8 border-b-8 border-l-8
                  border-t-transparent border-b-transparent ${
                    isDark ? 'border-l-gray-700' : 'border-l-gray-100'
                  }`}
                />
              </div>
            </div>
            {/* マスコット */}
            <Image
              src="/mascot.png"
              alt="マスコット"
              width={80}
              height={80}
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
