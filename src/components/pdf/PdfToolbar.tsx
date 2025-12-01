'use client'

import { Button } from '@/components/ui'

interface PdfToolbarProps {
  fileName: string
  totalPages: number
  selectedCount: number
  isExporting?: boolean
  onSelectAll: () => void
  onDeselectAll: () => void
  onDownload: () => void
  onReset: () => void
}

export function PdfToolbar({
  fileName,
  totalPages,
  selectedCount,
  isExporting = false,
  onSelectAll,
  onDeselectAll,
  onDownload,
  onReset,
}: PdfToolbarProps) {
  return (
    <div className="sticky top-16 z-30 bg-white border-b border-[--color-border-light] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Row - File Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {/* PDF Icon */}
            <div className="w-10 h-10 rounded-lg bg-[--color-accent-100] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[--color-accent-600]"
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
              <h2 className="font-semibold text-[--color-text-primary] truncate max-w-xs sm:max-w-md">
                {fileName}
              </h2>
              <p className="text-sm text-[--color-text-muted]">
                {totalPages}ページ
              </p>
            </div>
          </div>

          {/* Reset Button - Large and visible */}
          <button
            onClick={onReset}
            className="
              flex items-center gap-2
              px-5 py-2.5 rounded-lg
              bg-blue-500 hover:bg-blue-600
              text-white font-medium
              shadow-md hover:shadow-lg
              transition-all duration-200
            "
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            新しいPDFを選択
          </button>
        </div>

        {/* Bottom Row - Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Selection Info & Quick Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`
                  inline-flex items-center justify-center
                  min-w-[2.5rem] px-3 py-1.5
                  text-base font-bold rounded-full
                  ${selectedCount > 0
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                  }
                `}
              >
                {selectedCount}
              </span>
              <span className="text-sm text-gray-600">
                ページを選択中
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onSelectAll}>
                全選択
              </Button>
              <Button variant="outline" size="sm" onClick={onDeselectAll}>
                全解除
              </Button>
            </div>
          </div>

          {/* Download Button - Always Visible */}
          <Button
            variant="primary"
            size="lg"
            onClick={onDownload}
            disabled={selectedCount === 0}
            isLoading={isExporting}
            className="w-full sm:w-auto"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            選択したページをダウンロード
          </Button>
        </div>
      </div>
    </div>
  )
}
