'use client'

import { useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Modal, Button, Spinner } from '@/components/ui'

interface PdfPreviewModalProps {
  isOpen: boolean
  pageNumber: number
  imageUrl: string | null
  totalPages: number
  isLoading?: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export function PdfPreviewModal({
  isOpen,
  pageNumber,
  imageUrl,
  totalPages,
  isLoading = false,
  onClose,
  onPrev,
  onNext,
}: PdfPreviewModalProps) {
  const hasPrev = pageNumber > 1
  const hasNext = pageNumber < totalPages

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowLeft':
          if (hasPrev) onPrev()
          break
        case 'ArrowRight':
          if (hasNext) onNext()
          break
      }
    },
    [isOpen, hasPrev, hasNext, onPrev, onNext]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <div className="flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[--color-border-light]">
          <h2 className="text-lg font-semibold text-[--color-text-primary]">
            ページ {pageNumber} / {totalPages}
          </h2>
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              text-[--color-text-muted] hover:text-[--color-text-primary]
              hover:bg-[--color-off-white]
              transition-colors
            "
            aria-label="閉じる"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 relative bg-[--color-off-white] overflow-auto">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : imageUrl ? (
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <Image
                src={imageUrl}
                alt={`ページ ${pageNumber}`}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-[--color-text-muted]">プレビューを読み込めませんでした</p>
            </div>
          )}

          {/* Navigation Arrows */}
          {hasPrev && (
            <button
              onClick={onPrev}
              className="
                absolute left-4 top-1/2 -translate-y-1/2
                p-3 rounded-full
                bg-white/90 shadow-lg
                text-[--color-text-primary]
                hover:bg-white hover:shadow-xl
                transition-all
              "
              aria-label="前のページ"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {hasNext && (
            <button
              onClick={onNext}
              className="
                absolute right-4 top-1/2 -translate-y-1/2
                p-3 rounded-full
                bg-white/90 shadow-lg
                text-[--color-text-primary]
                hover:bg-white hover:shadow-xl
                transition-all
              "
              aria-label="次のページ"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 px-6 py-4 border-t border-[--color-border-light] bg-white">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrev}
            disabled={!hasPrev}
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            前へ
          </Button>
          <span className="text-sm text-[--color-text-muted] min-w-[80px] text-center">
            {pageNumber} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!hasNext}
          >
            次へ
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
