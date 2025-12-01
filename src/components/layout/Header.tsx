'use client'

import Image from 'next/image'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[--color-border-light]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
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
              <h1 className="text-xl font-bold text-gray-900">
                PDF Page Selector
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                検定通知書PDFを適切にページ操作する
              </p>
            </div>
          </div>

          {/* Company Logo - Right side */}
          <div className="flex items-center">
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
