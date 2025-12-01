'use client'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-[--color-border-light]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-sm text-[--color-text-muted]">
            &copy; {currentYear} PDF Page Selector. Maruhan North Central Office All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-[--color-text-muted]">
              ※ ファイルはご自身のPC内のみで処理され、外部サーバーには送信されません
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
