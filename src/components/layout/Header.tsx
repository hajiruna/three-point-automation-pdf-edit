'use client'

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[--color-border-light]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            {/* PDF Icon */}
            <div className="w-10 h-10 rounded-lg bg-[--color-accent-500] flex items-center justify-center">
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
              <h1 className="text-xl font-bold text-[--color-text-primary]">
                PDF Page Selector
              </h1>
              <p className="text-xs text-[--color-text-muted] hidden sm:block">
                必要なページだけを抽出
              </p>
            </div>
          </div>

          {/* Optional: Help or Info */}
          <div className="flex items-center gap-2">
            <button
              className="
                p-2 rounded-lg
                text-[--color-text-muted] hover:text-[--color-text-primary]
                hover:bg-[--color-off-white]
                transition-colors
              "
              aria-label="ヘルプ"
              title="使い方"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
