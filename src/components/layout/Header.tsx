'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/components/ui'
import { isBillingEnabled } from '@/lib/billing/feature-flags'

export function Header() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className={`sticky top-0 z-40 border-b transition-colors duration-300 ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* PDF Icon */}
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                PDF Page Selector
              </h1>
              <p className={`text-xs hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                検定通知書PDFを適切にページ操作する
              </p>
            </div>
          </Link>

          {/* Right side - User Info, Theme Toggle & Logo */}
          <div className="flex items-center gap-4">
            {/* Admin Dashboard Link */}
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isDark
                  ? 'bg-purple-900/50 hover:bg-purple-900 text-purple-300'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">統計</span>
            </Link>

            {/* Billing Link */}
            {isBillingEnabled() && (
              <Link
                href="/billing"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isDark
                    ? 'bg-blue-900/50 hover:bg-blue-900 text-blue-300'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span className="hidden sm:inline">プラン</span>
              </Link>
            )}

            {/* User Info & Sign Out */}
            {session?.user && (
              <div className="flex items-center gap-2">
                <span className={`text-sm hidden md:block ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {session.user.name || session.user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isDark
                      ? 'bg-red-900/50 hover:bg-red-900 text-red-300'
                      : 'bg-red-50 hover:bg-red-100 text-red-600'
                  }`}
                >
                  サインアウト
                </button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
              aria-label={isDark ? 'ライトモードに切替' : 'ダークモードに切替'}
            >
              {!isDark ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            {/* Company Logo */}
            <Image
              src="/logo.png"
              alt="MARUHAN"
              width={180}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
        </div>
      </div>
    </header>
  )
}
